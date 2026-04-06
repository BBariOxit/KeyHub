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

    const hasMultiCategorySchema = Boolean(Product.schema.path('categoryIds'))
    const categoryProjection = hasMultiCategorySchema ? { categoryIds: 1 } : { categoryId: 1 }
    const populatePath = hasMultiCategorySchema ? 'categoryIds' : 'categoryId'

    const productsRaw = await Product.find(
      {},
      { name: 1, image: 1, ...categoryProjection, category: 1, offerPrice: 1, stock: 1 }
    )
      .populate({ path: populatePath, select: 'name slug' })
      .sort({ date: -1 })
      .lean()

    const products = productsRaw.map((product) => {
      const populatedCategoryDocs = hasMultiCategorySchema
        ? (Array.isArray(product?.categoryIds) ? product.categoryIds : [])
        : (product?.categoryId ? [product.categoryId] : [])

      const populatedCategoryNames = populatedCategoryDocs
        .map((item) => item?.name)
        .filter(Boolean)

      const fallbackCategoryNames = Array.isArray(product?.category)
        ? product.category.filter(Boolean)
        : product?.category
          ? [product.category]
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

      return {
        ...product,
        categoryIds: serializedCategoryIds,
        categoryNames: resolvedCategoryNames,
        category: resolvedCategoryNames.join(', '),
        categorySlugs,
        categorySlug: categorySlugs[0] || null
      }
    })

    return NextResponse.json({ success: true, products }) 
  } catch (error) {
    console.error('Seller product list error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách sản phẩm của shop.' }, { status: 500 })
  }
}