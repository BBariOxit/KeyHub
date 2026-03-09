import { inngest } from "@/config/inngest";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    const { address, items } = await req.json()

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ!' })
    }

    await connectDB()
    
    const productIds = items.map(item => item.product);
    // Truy vấn tất cả sản phẩm trong 1 lần duy nhất để tối ưu hiệu năng
    const products = await Product.find({ _id: { $in: productIds } })

    // Tính toán tổng tiền (amount)
    let amount = 0
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product)
      if (product) {
        amount += product.offerPrice * item.quantity
      }
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
    console.log("Order Error:", error)
    return NextResponse.json({ success: false, message: error.message })
  }
}