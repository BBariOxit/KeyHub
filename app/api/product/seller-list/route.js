import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để thực hiện thao tác này.' }, { status: 401 })
    }

    const isSeller = await authSeller(userId)
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 })
    }

    await connectDB()

    const products = await Product.find({}, { name: 1, image: 1, category: 1, offerPrice: 1 }).sort({ date: -1 }).lean()
    return NextResponse.json({ success: true, products }) 
  } catch (error) {
    console.error('Seller product list error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách sản phẩm của shop.' }, { status: 500 })
  }
}