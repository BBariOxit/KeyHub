import connectDB from "@/config/db";
import User from "@/models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const cartSchema = z.record(z.string(), z.number().int().positive())

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    const body = await req.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng" }, { status: 401 })
    }

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

    // User model đang dùng _id = clerk userId, không phải clerkId.
    let user = await User.findById(userId)

    if (!user) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      const firstName = clerkUser.firstName || ""
      const lastName = clerkUser.lastName || ""
      const fullName = `${firstName} ${lastName}`.trim() || clerkUser.username || "User"
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || ""

      user = await User.create({
        _id: userId,
        name: fullName,
        email,
        imageUrl: clerkUser.imageUrl || "",
        cartItems: {}
      })
    }

    user.cartItems = cleanCartData
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}