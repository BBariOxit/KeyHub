import connectDB from "@/config/db";
import Address from "@/models/address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2, "Tên quá ngắn").max(50),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số"),
  pinCode: z.string().length(6, "Mã bưu điện phải có 6 số"),
  area: z.string().min(5, "Địa chỉ chi tiết quá ngắn"),
  city: z.string().min(2),
  state: z.string().min(2),
})

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
      message: 'address added successfully!',
      newAddress
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      message: error.message || 'Something went wrong'
    }, { status: 500 })
  }
}