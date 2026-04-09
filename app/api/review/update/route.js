import connectDB from "@/config/db";
import { inngest } from "@/config/inngest";
import Review from "@/models/Review";
import { getAuth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")

const reviewUpdateSchema = z.object({
  reviewId: objectIdSchema,
  rating: z.preprocess(
    (value) => (value == null || value === "" ? undefined : value),
    z.coerce.number().int("Điểm đánh giá phải là số nguyên").min(1, "Điểm tối thiểu là 1").max(5, "Điểm tối đa là 5").optional()
  ),
  comment: z.preprocess(
    (value) => (value == null ? undefined : String(value)),
    z.string().trim().min(2, "Nội dung bình luận quá ngắn").max(2000, "Nội dung bình luận quá dài").optional()
  ),
  images: z.preprocess(
    (value) => {
      if (value == null) {
        return undefined
      }

      if (!Array.isArray(value)) {
        return []
      }

      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    },
    z.array(z.string().max(1000, "Đường dẫn ảnh quá dài")).max(4, "Tối đa 4 ảnh").optional()
  )
}).superRefine((data, ctx) => {
  const hasFieldToUpdate = ["rating", "comment", "images"]
    .some((field) => Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined)

  if (!hasFieldToUpdate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewId"],
      message: "Không có dữ liệu cập nhật"
    })
  }
})

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để chỉnh sửa đánh giá." }, { status: 401 })
    }

    const body = await req.json()
    const validation = reviewUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: "Dữ liệu cập nhật không hợp lệ.",
        errors: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }, { status: 400 })
    }

    await connectDB()

    const { reviewId, rating, comment, images } = validation.data
    const updatePayload = {}

    if (rating !== undefined) {
      updatePayload.rating = rating
    }

    if (comment !== undefined) {
      updatePayload.comment = comment.trim()
    }

    if (images !== undefined) {
      updatePayload.images = images
    }

    const updatedReview = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { $set: updatePayload },
      { new: true }
    ).lean()

    if (!updatedReview) {
      return NextResponse.json({ success: false, message: "Không tìm thấy đánh giá để cập nhật." }, { status: 404 })
    }

    try {
      await inngest.send({
        name: "product/review.changed",
        data: {
          productId: String(updatedReview.productId)
        }
      })
    } catch (inngestError) {
      console.error("Review update event dispatch error:", inngestError)
    }

    const productId = String(updatedReview.productId)
    revalidatePath(`/product/${productId}`)
    revalidatePath('/all-products')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: "Cập nhật đánh giá thành công.",
      review: {
        _id: updatedReview._id.toString(),
        userId: updatedReview.userId,
        productId,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        images: Array.isArray(updatedReview.images) ? updatedReview.images : [],
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt
      }
    })
  } catch (error) {
    console.error("Review update error:", error)
    return NextResponse.json({ success: false, message: "Không thể cập nhật đánh giá lúc này." }, { status: 500 })
  }
}