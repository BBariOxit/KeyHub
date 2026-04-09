import connectDB from "@/config/db";
import { inngest } from "@/config/inngest";
import Review from "@/models/Review";
import { getAuth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import z from "zod";

const reviewDeleteSchema = z.object({
  reviewId: z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ")
})

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để xóa đánh giá." }, { status: 401 })
    }

    const body = await req.json()
    const validation = reviewDeleteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: "Dữ liệu xóa đánh giá không hợp lệ.",
        errors: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }, { status: 400 })
    }

    await connectDB()

    const { reviewId } = validation.data
    const review = await Review.findOne({ _id: reviewId, userId }).select("_id productId")

    if (!review) {
      return NextResponse.json({ success: false, message: "Không tìm thấy đánh giá để xóa." }, { status: 404 })
    }

    const productId = String(review.productId)
    await Review.deleteOne({ _id: review._id, userId })

    try {
      await inngest.send({
        name: "product/review.changed",
        data: {
          productId
        }
      })
    } catch (inngestError) {
      console.error("Review delete event dispatch error:", inngestError)
    }

    revalidatePath(`/product/${productId}`)
    revalidatePath('/all-products')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: "Xóa đánh giá thành công."
    })
  } catch (error) {
    console.error("Review delete error:", error)
    return NextResponse.json({ success: false, message: "Không thể xóa đánh giá lúc này." }, { status: 500 })
  }
}