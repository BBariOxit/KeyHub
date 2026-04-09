import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const cartSchema = z.record(z.string(), z.number().int().positive())

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để cập nhật giỏ hàng." }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    
    const validation = cartSchema.safeParse(body.cartData)

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Dữ liệu lỗi",
        errors: validation.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message      
        }))
      }, { status: 400 })
    }

    // dữ liệu sạch
    const cleanCartData = validation.data

    await connectDB()

    const productIds = Object.keys(cleanCartData)
    const products = await Product.find({ _id: { $in: productIds }, isVisible: { $ne: false } }).select('_id stock').lean()

    const stockMap = new Map(
      products.map((product) => [String(product._id), Number.isFinite(product.stock) ? Math.max(0, product.stock) : null])
    )

    const normalizedCartData = {}
    for (const [productId, quantity] of Object.entries(cleanCartData)) {
      const maxStock = stockMap.get(productId)

      if (maxStock === undefined) {
        continue
      }

      if (maxStock === null) {
        normalizedCartData[productId] = quantity
        continue
      }

      const cappedQuantity = Math.min(quantity, maxStock)
      if (cappedQuantity > 0) {
        normalizedCartData[productId] = cappedQuantity
      }
    }

    // User model đang dùng _id = clerk userId, không phải clerkId.
    let user = await User.findById(userId)

    if (!user) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      const firstName = clerkUser.firstName || ""
      const lastName = clerkUser.lastName || ""
      const fullName = `${firstName} ${lastName}`.trim() || clerkUser.username || "User"
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || ""

      await User.create({
        _id: userId,
        name: fullName,
        email,
        imageUrl: clerkUser.imageUrl || "",
        cartItems: normalizedCartData
      })

      return NextResponse.json({ success: true })
    }

    await User.findByIdAndUpdate(userId, { 
      $set: { cartItems: normalizedCartData }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Lỗi POST giỏ hàng:", error)
    return NextResponse.json(
      { success: false, message: "không thể cập nhật giỏ hàng lúc này." }, 
      { status: 500 }
    )
  }
}