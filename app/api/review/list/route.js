import connectDB from "@/config/db";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { NextResponse } from "next/server";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = String(searchParams.get("productId") || "").trim()

    if (!OBJECT_ID_REGEX.test(productId)) {
      return NextResponse.json({ success: false, message: "productId không hợp lệ." }, { status: 400 })
    }

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(1, parsedLimit), 50) : 10
    const skip = (page - 1) * limit

    await connectDB()

    const [reviewsRaw, total, productSummary] = await Promise.all([
      Review.find(
        { productId },
        {
          userId: 1,
          rating: 1,
          comment: 1,
          images: 1,
          createdAt: 1,
          updatedAt: 1
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId }),
      Product.findById(productId).select("averageRating totalReviews").lean()
    ])

    const reviews = reviewsRaw.map((review) => ({
      _id: review._id.toString(),
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      images: Array.isArray(review.images) ? review.images : [],
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }))

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        averageRating: Number(productSummary?.averageRating || 0),
        totalReviews: Number(productSummary?.totalReviews || 0)
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error("Review list error:", error)
    return NextResponse.json({ success: false, message: "Không thể tải danh sách bình luận." }, { status: 500 })
  }
}