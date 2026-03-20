
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import z from "zod";

const productCreateSchema = z.object({
  name: z.string().trim().min(2, 'Tên sản phẩm quá ngắn').max(120, 'Tên sản phẩm quá dài'),
  description: z.string().trim().min(5, 'Mô tả quá ngắn').max(2000, 'Mô tả quá dài'),
  category: z.string().trim().min(2, 'Danh mục không hợp lệ').max(80, 'Danh mục quá dài'),
  price: z.coerce.number().positive('Giá phải lớn hơn 0'),
  offerPrice: z.coerce.number().positive('Giá bán phải lớn hơn 0')
}).refine((data) => data.offerPrice <= data.price, {
  message: 'Giá bán không được lớn hơn giá gốc',
  path: ['offerPrice']
})

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để thực hiện thao tác này.' }, { status: 401 })
    }

    const isSeller = await authSeller(userId)
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 })
    }

    const formData = await req.formData()

    const validation = productCreateSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      price: formData.get('price'),
      offerPrice: formData.get('offerPrice')
    })

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Dữ liệu sản phẩm không hợp lệ.',
        errors: validation.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const files = formData.getAll('images')
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng tải lên ít nhất một ảnh.' }, { status: 400 })
    }

    const imageFiles = files.filter(file => file && typeof file.arrayBuffer === 'function' && file.size > 0)
    if (imageFiles.length === 0) {
      return NextResponse.json({ success: false, message: 'Ảnh tải lên không hợp lệ.' }, { status: 400 })
    }

    const result = await Promise.all(
      imageFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return new Promise((res,rej) => {
          const stream = cloudinary.uploader.upload_stream(
            {resource_type: 'auto'},
            (error, result) => {
              if (error) {
                rej(error)
              } else {
                res(result)
              }
            } 
          )
          stream.end(buffer)
        })
      })
    )

    const image = result.map(result => result.secure_url)

    await connectDB()
    const { name, description, category, price, offerPrice } = validation.data
    const newProduct = await Product.create({
      userId,
      name,
      description,
      category,
      price,
      offerPrice,
      image,
      date: Date.now()
    })

    return NextResponse.json({ success: true, message: 'Upload successfully', newProduct })

  } catch (error) {
    console.error('Product add error:', error)
    return NextResponse.json({ success: false, message: 'Không thể thêm sản phẩm mới.' }, { status: 500 })
  }
}