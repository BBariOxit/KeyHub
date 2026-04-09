import connectDB from "@/config/db";
import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")

const reviewCreateSchema = z.object({
  productId: objectIdSchema,
  rating: z.coerce.number().int("Điểm đánh giá phải là số nguyên").min(1, "Điểm tối thiểu là 1").max(5, "Điểm tối đa là 5"),
  comment: z.string().trim().min(2, "Nội dung bình luận quá ngắn").max(2000, "Nội dung bình luận quá dài"),
  images: z.preprocess(
    (value) => {
      if (!Array.isArray(value)) {
        return []
      }

      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    },
    z.array(z.string().max(1000, "Đường dẫn ảnh quá dài")).max(10, "Tối đa 10 ảnh")
  ).optional().default([])
})

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để đánh giá sản phẩm." }, { status: 401 })
    }

    const body = await req.json()
    const validation = reviewCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: "Dữ liệu đánh giá không hợp lệ.",
        errors: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }, { status: 400 })
    }

    await connectDB()

    const { productId, rating, comment, images } = validation.data
    const productExists = await Product.exists({ _id: productId })

    if (!productExists) {
      return NextResponse.json({ success: false, message: "Sản phẩm không tồn tại." }, { status: 404 })
    }

    let createdReview
    try {
      createdReview = await Review.create({
        userId,
        productId,
        rating,
        comment,
        images
      })
    } catch (error) {
      if (error?.code === 11000) {
        return NextResponse.json({
          success: false,
          message: "Bạn đã đánh giá sản phẩm này rồi."
        }, { status: 409 })
      }

      throw error
    }

    // Fire and forget: user gets fast response while aggregate runs in background.
    try {
      await inngest.send({
        name: "product/review.created",
        data: {
          productId
        }
      })
    } catch (inngestError) {
      console.error("Review event dispatch error:", inngestError)
    }

    return NextResponse.json({
      success: true,
      message: "Đăng bình luận thành công.",
      review: {
        _id: createdReview._id.toString(),
        userId: createdReview.userId,
        productId: createdReview.productId.toString(),
        rating: createdReview.rating,
        comment: createdReview.comment,
        images: createdReview.images || [],
        createdAt: createdReview.createdAt
      }
    })
  } catch (error) {
    console.error("Review create error:", error)
    return NextResponse.json({ success: false, message: "Không thể gửi đánh giá lúc này." }, { status: 500 })
  }
}