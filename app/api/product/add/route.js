
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")

const normalizeSpecificationsInput = (value) => {
  if (value == null || value === '') {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
      }

      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, val]) => ({
          key,
          value: val == null ? '' : String(val)
        }))
      }
    } catch {
      return value
    }
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, val]) => ({
      key,
      value: val == null ? '' : String(val)
    }))
  }

  return value
}

const specificationSchema = z.object({
  key: z.string().trim().min(1, 'Tên thông số không được để trống').max(80, 'Tên thông số quá dài'),
  value: z.string().trim().min(1, 'Giá trị thông số không được để trống').max(300, 'Giá trị thông số quá dài')
})

const productCreateSchema = z.object({
  name: z.string().trim().min(2, 'Tên sản phẩm quá ngắn').max(120, 'Tên sản phẩm quá dài'),
  description: z.string().trim().min(5, 'Mô tả quá ngắn').max(2000, 'Mô tả quá dài'),
  detailedDescription: z.preprocess(
    (value) => (value == null ? '' : value),
    z.string().max(40000, 'Mô tả chi tiết quá dài').default('')
  ),
  specifications: z.preprocess(
    normalizeSpecificationsInput,
    z.array(specificationSchema).max(50, 'Tối đa 50 thông số kỹ thuật').default([])
  ),
  categoryIds: z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return value.filter((item) => item != null && String(item).trim() !== '')
      }
      if (value == null || value === '') {
        return []
      }
      return [value]
    },
    z.array(objectIdSchema)
  ),
  categoryId: z.preprocess(
    (value) => (value == null || value === '' ? undefined : value),
    objectIdSchema.optional()
  ),
  category: z.preprocess(
    (value) => (value == null || value === '' ? undefined : value),
    z.string().trim().min(2, 'Danh mục không hợp lệ').max(80, 'Danh mục quá dài').optional()
  ),
  price: z.coerce.number().positive('Giá phải lớn hơn 0'),
  offerPrice: z.coerce.number().positive('Giá bán phải lớn hơn 0'),
  stock: z.coerce.number().int('Tồn kho phải là số nguyên').min(0, 'Tồn kho không được âm').default(0)
}).superRefine((data, ctx) => {
  if (!data.categoryIds.length && !data.categoryId && !data.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['categoryIds'],
      message: 'Vui lòng chọn ít nhất một danh mục hợp lệ'
    })
  }
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
      detailedDescription: formData.get('detailedDescription'),
      specifications: formData.get('specifications'),
      categoryIds: formData.getAll('categoryIds'),
      categoryId: formData.get('categoryId'),
      category: formData.get('category'),
      price: formData.get('price'),
      offerPrice: formData.get('offerPrice'),
      stock: formData.get('stock')
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

    const {
      name,
      description,
      detailedDescription,
      specifications,
      categoryIds,
      categoryId,
      category,
      price,
      offerPrice,
      stock
    } = validation.data

    const resolvedCategoryIds = [...new Set([
      ...categoryIds,
      ...(categoryId ? [categoryId] : [])
    ])]

    let categoryDocs = []

    if (resolvedCategoryIds.length > 0) {
      categoryDocs = await Category.find({ _id: { $in: resolvedCategoryIds } }).select('_id name').lean()

      if (categoryDocs.length !== resolvedCategoryIds.length) {
        return NextResponse.json({ success: false, message: 'Một hoặc nhiều danh mục không tồn tại.' }, { status: 400 })
      }
    } else if (category) {
      const fallbackCategory = await Category.findOne({ name: category }).select('_id name').lean()
      if (!fallbackCategory) {
        return NextResponse.json({ success: false, message: 'Danh mục không tồn tại.' }, { status: 400 })
      }
      categoryDocs = [fallbackCategory]
    }

    if (categoryDocs.length === 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng chọn ít nhất một danh mục.' }, { status: 400 })
    }

    const categoryNames = categoryDocs.map((item) => item.name)
    const categorySchemaPath = Product.schema.path('category')
    const useArrayCategory = categorySchemaPath?.instance === 'Array'

    const productPayload = {
      userId,
      name,
      description,
      detailedDescription,
      specifications,
      price,
      offerPrice,
      stock,
      image,
      date: Date.now(),
      category: useArrayCategory ? categoryNames : categoryNames.join(', ')
    }

    // Tương thích cả schema mới (categoryIds) lẫn schema cũ đang cache trong dev server.
    if (Product.schema.path('categoryIds')) {
      productPayload.categoryIds = categoryDocs.map((item) => item._id)
    }

    const newProduct = await Product.create(productPayload)

    return NextResponse.json({ success: true, message: 'Upload successfully', newProduct })

  } catch (error) {
    console.error('Product add error:', error)
    return NextResponse.json({ success: false, message: 'Không thể thêm sản phẩm mới.' }, { status: 500 })
  }
}