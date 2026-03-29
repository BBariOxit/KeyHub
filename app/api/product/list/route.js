import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
  
    await connectDB()

    const products = await Product.find(
      {},
      {
        name: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        image: 1,
        category: 1,
        date: 1,
      }
    )
      .sort({ date: -1 })
      .lean()

    return NextResponse.json({ success: true, products }) 
  } catch (error) {
    console.error('Product list error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách sản phẩm.' }, { status: 500 })
  }
}