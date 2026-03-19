import connectDB from "@/config/db";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để xem giỏ hàng." },
        { status: 401 }
      );
    }

    await connectDB()
    const user = await User.findById(userId).select("cartItems").lean()

    if (!user) {
      return NextResponse.json({ success: true, cartItems: {} });
    }

    return NextResponse.json({ success: true, cartItems: user.cartItems || {} })
  } catch (error) {
    console.error("Lỗi get cart:", error)
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau." }, 
      { status: 500 }
    )
  }
}