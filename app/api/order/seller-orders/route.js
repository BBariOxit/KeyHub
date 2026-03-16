import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Bạn cần đăng nhập để thực hiện thao tác này' }, 
        { status: 401 }
      )
    }

    await connectDB()

    const isSeller = await authSeller(userId)

    if (!isSeller) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền truy cập (Dành cho người bán)' }, 
        { status: 403 }
      )
    }

    const orders = await Order.find({})
      .populate({ 
        path: 'address', 
        model: Address 
      })
      .populate({ 
        path: 'items.product', 
        model: Product 
      })
      .sort({ createdAt: -1 })

    return NextResponse.json({ 
      success: true, 
      message: 'Lấy danh sách đơn hàng thành công',
      count: orders.length, 
      orders 
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ, vui lòng thử lại sau' }, 
      { status: 500 }
    )
  }
}