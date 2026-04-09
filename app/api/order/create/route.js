import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")
const idempotencyKeySchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Idempotency key phải là UUID v4 hợp lệ'
  )

const orderCreateSchema = z.object({
  address: objectIdSchema,
  items: z.array(z.object({
    product: objectIdSchema,
    quantity: z.number().int().positive("Số lượng phải lớn hơn 0")
  })).min(1, "Giỏ hàng trống")
})

export async function POST(req) {
  let session
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để đặt hàng.' }, { status: 401 })
    }

    const body = await req.json()
    const idempotencyHeader = req.headers.get('x-idempotency-key')
    const idempotencyValidation = idempotencyKeySchema.safeParse(idempotencyHeader)

    if (!idempotencyValidation.success) {
      return NextResponse.json(
        { success: false, message: 'Thiếu hoặc sai định dạng idempotency key.' },
        { status: 400 }
      )
    }

    const idempotencyKey = idempotencyValidation.data
    const validation = orderCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Dữ liệu đơn hàng không hợp lệ.',
        errors: validation.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const { address, items } = validation.data

    const productIds = [...new Set(items.map(item => item.product))]

    const quantityByProduct = items.reduce((acc, item) => {
      acc.set(item.product, (acc.get(item.product) || 0) + Number(item.quantity))
      return acc
    }, new Map())

    await connectDB()

    const existingOrder = await Order.findOne({ userId, idempotencyKey }).lean()
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: 'Đơn hàng đã được xử lý trước đó',
        order: existingOrder,
        idempotentReplay: true
      })
    }

    session = await mongoose.startSession()

    const result = await session.withTransaction(async () => {
      const existingOrderInTransaction = await Order.findOne({ userId, idempotencyKey })
        .session(session)
        .lean()

      if (existingOrderInTransaction) {
        return { success: true, order: existingOrderInTransaction, idempotentReplay: true }
      }

      const addressDoc = await Address.findOne({ _id: address, userId }).session(session).select('_id').lean()
      if (!addressDoc) {
        return { error: 'Địa chỉ giao hàng không hợp lệ.' }
      }

      const products = await Product.find({ _id: { $in: productIds }, isVisible: { $ne: false } })
        .session(session)
        .select('_id offerPrice stock')
        .lean()

      if (products.length !== productIds.length) {
        return { error: 'Một số sản phẩm không còn tồn tại.' }
      }

      const productMap = new Map(products.map((product) => [product._id.toString(), product]))

      let amount = 0
      for (const item of items) {
        const product = productMap.get(item.product)
        if (!product || typeof product.offerPrice !== 'number') {
          return { error: 'Dữ liệu sản phẩm không hợp lệ.' }
        }

        if ((product.stock ?? 0) < item.quantity) {
          return { error: `Sản phẩm ${product._id.toString()} không đủ tồn kho.` }
        }

        amount += product.offerPrice * item.quantity
      }

      for (const [productId, quantity] of quantityByProduct.entries()) {
        const updated = await Product.updateOne(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { session }
        )

        if (!updated.modifiedCount) {
          return { error: 'Một hoặc nhiều sản phẩm đã hết hàng. Vui lòng thử lại.' }
        }
      }

      const [createdOrder] = await Order.create([
        {
          userId,
          idempotencyKey,
          items: items.map((item) => ({
            product: item.product,
            quantity: Number(item.quantity)
          })),
          amount: amount + Math.floor(amount * 0.02),
          address,
          date: Date.now()
        }
      ], { session })

      await User.findByIdAndUpdate(userId, { cartItems: {} }, { session })

      return { success: true, order: createdOrder, idempotentReplay: false }
    })

    if (!result?.success) {
      return NextResponse.json({ success: false, message: result?.error || 'Không thể tạo đơn hàng lúc này.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result?.idempotentReplay ? 'Đơn hàng đã được xử lý trước đó' : 'đặt hàng thành công',
      order: result?.order,
      idempotentReplay: Boolean(result?.idempotentReplay)
    })
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.userId && error?.keyPattern?.idempotencyKey) {
      const { userId } = getAuth(req)
      const idempotencyKey = req.headers.get('x-idempotency-key')
      if (userId && idempotencyKey) {
        const duplicated = await Order.findOne({ userId, idempotencyKey }).lean()
        if (duplicated) {
          return NextResponse.json({
            success: true,
            message: 'Đơn hàng đã được xử lý trước đó',
            order: duplicated,
            idempotentReplay: true
          })
        }
      }
    }

    console.error("Order Error:", error)
    return NextResponse.json({ success: false, message: 'Không thể tạo đơn hàng lúc này.' }, { status: 500 })
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}