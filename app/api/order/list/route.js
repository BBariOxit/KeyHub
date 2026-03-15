import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function GET(req) {
  try {
    await connectDB()

    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const orders = await Order.find({ userId })
      .populate({ path: 'address', model: Address })
      .populate({ path: 'items.product', model: Product })
      .sort({ createdAt: -1 })

    return NextResponse.json({ success: true, count: orders.length, orders })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}