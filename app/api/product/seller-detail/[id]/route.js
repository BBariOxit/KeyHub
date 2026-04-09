import connectDB from '@/config/db'
import authSeller from '@/lib/authSeller'
import Product from '@/models/Product'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import z from 'zod'

const paramsSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, 'ID không hợp lệ')
})

export async function GET(req, context) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để thực hiện thao tác này.' }, { status: 401 })
    }

    const isSeller = await authSeller(userId)
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 })
    }

    const validation = paramsSchema.safeParse(context?.params)
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0]?.message || 'ID không hợp lệ' }, { status: 400 })
    }

    await connectDB()

    const hasCategoryIdsPath = Boolean(Product.schema.path('categoryIds'))
    const hasCategoryIdPath = Boolean(Product.schema.path('categoryId'))

    const projection = {
      name: 1,
      description: 1,
      detailedDescription: 1,
      specifications: 1,
      price: 1,
      offerPrice: 1,
      stock: 1,
      image: 1,
      category: 1,
      timestamp: 1
    }

    if (hasCategoryIdsPath) {
      projection.categoryIds = 1
    }

    if (hasCategoryIdPath) {
      projection.categoryId = 1
    }

    let query = Product.findOne({ _id: validation.data.id, userId }, projection)

    if (hasCategoryIdsPath) {
      query = query.populate({ path: 'categoryIds', select: 'name slug' })
    } else if (hasCategoryIdPath) {
      query = query.populate({ path: 'categoryId', select: 'name slug' })
    }

    const productRaw = await query.lean()

    if (!productRaw) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy sản phẩm.' }, { status: 404 })
    }

    const populatedCategoryDocs = hasCategoryIdsPath
      ? (Array.isArray(productRaw?.categoryIds) ? productRaw.categoryIds : [])
      : (hasCategoryIdPath && productRaw?.categoryId ? [productRaw.categoryId] : [])

    const populatedCategoryNames = populatedCategoryDocs.map((item) => item?.name).filter(Boolean)
    const fallbackCategoryNames = Array.isArray(productRaw?.category)
      ? productRaw.category.filter(Boolean)
      : productRaw?.category
        ? [productRaw.category]
        : []

    const resolvedCategoryNames = populatedCategoryNames.length > 0
      ? populatedCategoryNames
      : fallbackCategoryNames

    const categorySlugs = populatedCategoryDocs.map((item) => item?.slug).filter(Boolean)
    const serializedCategoryIds = populatedCategoryDocs
      .map((item) => ({
        _id: item?._id ? item._id.toString() : null,
        name: item?.name || '',
        slug: item?.slug || null
      }))
      .filter((item) => item._id)

    const product = {
      ...productRaw,
      categoryIds: serializedCategoryIds,
      categoryNames: resolvedCategoryNames,
      category: resolvedCategoryNames.join(', '),
      categorySlugs,
      categorySlug: categorySlugs[0] || null
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Seller product detail error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải thông tin sản phẩm.' }, { status: 500 })
  }
}
