import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Bạn cần đăng nhập để xem giỏ hàng" }, { status: 401 });
    }

    await connectDB()
    const user = await User.findById(userId).select("cartItems");

    if (!user) {
      return NextResponse.json({ success: true, cartItems: {} });
    }

    return NextResponse.json({ success: true, cartItems: user.cartItems || {} })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}