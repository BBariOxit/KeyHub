import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export const revalidate = 60;
export async function GET(req) {
  try {
  
    await connectDB()

    const productsRaw = await Product.find(
      {},
      {
        name: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        image: 1,
        categoryId: 1,
        category: 1,
        stock: 1,
        date: 1,
      }
    )
      .populate({ path: 'categoryId', select: 'name slug' })
      .sort({ date: -1 })
      .lean()

    const products = productsRaw.map((product) => ({
      ...product,
      category: product?.categoryId?.name || product.category || '',
      categorySlug: product?.categoryId?.slug || null
    }))

    return NextResponse.json({ success: true, products }) 
  } catch (error) {
    console.error('Product list error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách sản phẩm.' }, { status: 500 })
  }
}