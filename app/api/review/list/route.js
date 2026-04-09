import connectDB from "@/config/db";
import Product from "@/models/Product";
import Review from "@/models/Review";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i

export async function GET(req) {
  try {
    const { userId: currentUserId } = getAuth(req)
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

    const [reviewsRaw, total, productSummary, distributionRaw, liveSummaryRaw] = await Promise.all([
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
      Product.findById(productId).select("averageRating totalReviews").lean(),
      Review.aggregate([
        { $match: { productId: Product.base.Types.ObjectId.createFromHexString(productId) } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 }
          }
        }
      ]),
      Review.aggregate([
        { $match: { productId: Product.base.Types.ObjectId.createFromHexString(productId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ])

    const authorIds = [...new Set(reviewsRaw.map((review) => String(review.userId || "")).filter(Boolean))]
    const authorsRaw = await User.find(
      { _id: { $in: authorIds } },
      { _id: 1, name: 1, imageUrl: 1 }
    ).lean()

    const authorMap = new Map(
      authorsRaw.map((author) => [String(author._id), {
        name: author?.name || "Khách hàng",
        imageUrl: author?.imageUrl || ""
      }])
    )

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const item of distributionRaw) {
      const star = Number(item?._id)
      if (star >= 1 && star <= 5) {
        distribution[star] = Number(item?.count || 0)
      }
    }

    const liveSummary = Array.isArray(liveSummaryRaw) ? liveSummaryRaw[0] : null
    const liveAverageRating = Number.isFinite(liveSummary?.averageRating)
      ? Number(liveSummary.averageRating.toFixed(2))
      : 0
    const liveTotalReviews = Number.isFinite(liveSummary?.totalReviews)
      ? Number(liveSummary.totalReviews)
      : 0

    const effectiveAverageRating = liveTotalReviews > 0
      ? liveAverageRating
      : Number(productSummary?.averageRating || 0)
    const effectiveTotalReviews = liveTotalReviews > 0
      ? liveTotalReviews
      : Number(productSummary?.totalReviews || 0)

    const reviews = reviewsRaw.map((review) => ({
      _id: review._id.toString(),
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      images: Array.isArray(review.images) ? review.images : [],
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      author: authorMap.get(String(review.userId)) || {
        name: "Khách hàng",
        imageUrl: ""
      },
      canEdit: Boolean(currentUserId) && String(review.userId) === String(currentUserId)
    }))

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        averageRating: effectiveAverageRating,
        totalReviews: effectiveTotalReviews,
        distribution
      },
      viewer: {
        userId: currentUserId || null
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