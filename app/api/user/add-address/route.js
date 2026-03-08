import connectDB from "@/config/db";
import Address from "@/models/address";
import { addressSchema } from "@/lib/validators/addressSchema";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json()

    //check validation từ front-end
    const validation = addressSchema.safeParse(body.address)
    
    if (!validation.success) {
      // Trả về lỗi chi tiết từ Zod
      return NextResponse.json({ 
        success: false, 
        errors: validation.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message      
        }))
      }, { status: 400 });
    }

    await connectDB()
    const newAddress = await Address.create({...validation.data, userId})

    return NextResponse.json({ 
      success: true,
      message: 'Địa chỉ đã được thêm thành công!',
      newAddress
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      message: error.message || 'Đã có lỗi xảy ra!'
    }, { status: 500 })
  }
}