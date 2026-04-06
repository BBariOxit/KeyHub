import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export const revalidate = 60;
export async function GET(req) {
  try {
  
    await connectDB()

    const hasMultiCategorySchema = Boolean(Product.schema.path('categoryIds'))
    const categoryProjection = hasMultiCategorySchema ? { categoryIds: 1 } : { categoryId: 1 }
    const populatePath = hasMultiCategorySchema ? 'categoryIds' : 'categoryId'

    const productsRaw = await Product.find(
      {},
      {
        name: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        image: 1,
        ...categoryProjection,
        category: 1,
        stock: 1,
        date: 1,
      }
    )
      .populate({ path: populatePath, select: 'name slug' })
      .sort({ date: -1 })
      .lean()

    const normalizedProducts = productsRaw.map((product) => {
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

    return NextResponse.json({ success: true, products: normalizedProducts }) 
  } catch (error) {
    console.error('Product list error:', error)
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách sản phẩm.' }, { status: 500 })
  }
}