import { inngest } from "@/config/inngest";
import connectDB from "@/config/db";
import Address from "@/models/Address";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")

const orderCreateSchema = z.object({
  address: objectIdSchema,
  items: z.array(z.object({
    product: objectIdSchema,
    quantity: z.number().int().positive("Số lượng phải lớn hơn 0")
  })).min(1, "Giỏ hàng trống")
})

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để đặt hàng.' }, { status: 401 })
    }

    const body = await req.json()
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

    await connectDB()

    const addressDoc = await Address.findOne({ _id: address, userId }).select('_id').lean()
    if (!addressDoc) {
      return NextResponse.json({ success: false, message: 'Địa chỉ giao hàng không hợp lệ.' }, { status: 400 })
    }
    
    // Truy vấn tất cả sản phẩm trong 1 lần duy nhất để tối ưu hiệu năng
    const products = await Product.find({ _id: { $in: productIds } }).select('_id offerPrice').lean()

    if (products.length !== productIds.length) {
      return NextResponse.json({ success: false, message: 'Một số sản phẩm không còn tồn tại.' }, { status: 400 })
    }

    const productPriceMap = new Map(products.map(product => [product._id.toString(), product.offerPrice]))

    // Tính toán tổng tiền (amount)
    let amount = 0
    for (const item of items) {
      const productPrice = productPriceMap.get(item.product)
      if (typeof productPrice !== 'number') {
        return NextResponse.json({ success: false, message: 'Dữ liệu sản phẩm không hợp lệ.' }, { status: 400 })
      }
      amount += productPrice * item.quantity
    }

  
    await inngest.send({
      name: 'order/created',
      data: {
        userId,
        address,
        items,
        amount: amount + Math.floor(amount * 0.02),
        date: Date.now()
      }
    })

    // clear user cart
    await User.findByIdAndUpdate(userId, { cartItems: {} })

    return NextResponse.json({ success: true, message: 'đặt hàng thành công' })
  } catch (error) {
    console.error("Order Error:", error)
    return NextResponse.json({ success: false, message: 'Không thể tạo đơn hàng lúc này.' }, { status: 500 })
  }
}