"use client"

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Star, Trash2, UploadCloud, X } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";
import { optimizeCloudinaryImage } from "@/lib/image";

const REVIEW_PAGE_LIMIT = 6

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, "Vui lòng chọn số sao.").max(5),
  comment: z.string().trim().min(2, "Nội dung quá ngắn.").max(2000, "Nội dung quá dài."),
  images: z.array(z.string().url("Ảnh không hợp lệ.")).max(4, "Tối đa 4 ảnh.")
})

const getCloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") {
    return ""
  }

  const marker = "/upload/"
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) {
    return ""
  }

  let publicPart = url.slice(markerIndex + marker.length)
  publicPart = publicPart.replace(/^v\d+\//, "")

  const queryIndex = publicPart.indexOf("?")
  if (queryIndex !== -1) {
    publicPart = publicPart.slice(0, queryIndex)
  }

  return publicPart.replace(/\.[a-zA-Z0-9]+$/, "")
}

const ReviewCloudImage = ({ src, alt, className, width, height }) => {
  const publicId = getCloudinaryPublicIdFromUrl(src)

  if (publicId) {
    return (
      <CldImage
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        crop="fill"
        gravity="auto"
        quality="auto"
        format="auto"
        className={className}
      />
    )
  }

  return (
    <Image
      src={optimizeCloudinaryImage(src, { width, quality: "auto" }) || src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  )
}

const formatReviewDate = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

const ReviewRatingInput = ({ value, hoverValue, onHover, onChange }) => {
  const effectiveRating = hoverValue || value

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => onHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="rounded p-1"
          aria-label={`Chọn ${star} sao`}
          onMouseEnter={() => onHover(star)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-6 w-6 transition ${star <= effectiveRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  )
}

const ReviewStatBar = ({ stars, count, percent }) => {
  return (
    <div className="grid grid-cols-[40px_1fr_48px] items-center gap-3 text-sm text-gray-600">
      <span>{stars} sao</span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-right">{count}</span>
    </div>
  )
}

const RatingSummarySkeleton = () => {
  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr] animate-pulse">
      <div className="rounded-xl bg-gray-50 p-5">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-12 w-36 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-24 rounded bg-gray-200" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="grid grid-cols-[40px_1fr_48px] items-center gap-3">
            <div className="h-4 w-8 rounded bg-gray-200" />
            <div className="h-2 rounded-full bg-gray-200" />
            <div className="h-4 w-6 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

const ProductReviewsSection = ({ productId, onSummaryChange }) => {
  const router = useRouter()
  const { openSignIn } = useClerk()
  const { isSignedIn, user } = useUser()

  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [deletingReviewId, setDeletingReviewId] = useState("")
  const [hoverRating, setHoverRating] = useState(0)
  const [editingReviewId, setEditingReviewId] = useState("")

  const userId = user?.id || ""
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      images: []
    }
  })

  const formRating = useWatch({ control, name: "rating" }) || 0
  const formImages = useWatch({ control, name: "images" }) || []

  const starRows = useMemo(() => {
    const total = Number(summary?.totalReviews || 0)
    const distribution = summary?.distribution || {}

    return [5, 4, 3, 2, 1].map((stars) => {
      const count = Number(distribution?.[stars] || 0)
      const percent = total > 0 ? Math.round((count / total) * 100) : 0
      return { stars, count, percent }
    })
  }, [summary])

  const resetForm = () => {
    reset({ rating: 0, comment: "", images: [] })
    setHoverRating(0)
    setEditingReviewId("")
  }

  const fetchReviews = async ({ page = 1, append = false, emitSummary = false } = {}) => {
    if (!productId) {
      return
    }

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setSummaryLoading(true)
    }

    try {
      const { data } = await axios.get("/api/review/list", {
        params: {
          productId,
          page,
          limit: REVIEW_PAGE_LIMIT
        }
      })

      if (!data?.success) {
        throw new Error(data?.message || "Không thể tải đánh giá")
      }

      const incoming = Array.isArray(data.reviews) ? data.reviews : []
      const nextSummary = {
        averageRating: Number(data?.summary?.averageRating || 0),
        totalReviews: Number(data?.summary?.totalReviews || 0),
        distribution: data?.summary?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }

      setSummary(nextSummary)
      if (emitSummary && typeof onSummaryChange === "function") {
        onSummaryChange(nextSummary)
      }
      setCurrentPage(page)
      setHasMore(Boolean(data?.pagination?.hasMore))

      if (append) {
        setReviews((previous) => {
          const map = new Map(previous.map((item) => [item._id, item]))
          incoming.forEach((item) => {
            map.set(item._id, item)
          })
          return Array.from(map.values())
        })
        return
      }

      setReviews(incoming)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      if (!append) {
        setSummaryLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchReviews({ page: 1, append: false, emitSummary: true })
  }, [productId])

  const onSubmit = async (values) => {
    if (!isSignedIn) {
      openSignIn()
      return
    }

    try {
      const endpoint = editingReviewId ? "/api/review/update" : "/api/review/create"
      const body = editingReviewId
        ? { reviewId: editingReviewId, ...values }
        : { productId, ...values }

      const { data } = await axios.post(endpoint, body)

      if (!data?.success) {
        throw new Error(data?.message || "Không thể gửi đánh giá")
      }

      toast.success(data?.message || "Thành công")
      resetForm()
      await fetchReviews({ page: 1, append: false, emitSummary: true })
      router.refresh()
    } catch (error) {
      if (!editingReviewId && error?.response?.status === 409) {
        resetForm()
      }

      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const handleStartEdit = (review) => {
    setEditingReviewId(String(review?._id || ""))
    setValue("rating", Number(review?.rating || 0), { shouldValidate: true })
    setValue("comment", String(review?.comment || ""), { shouldValidate: true })
    setValue("images", Array.isArray(review?.images) ? review.images.slice(0, 4) : [], { shouldValidate: true })
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || deletingReviewId) {
      return
    }

    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")
    if (!confirmed) {
      return
    }

    setDeletingReviewId(reviewId)
    try {
      const { data } = await axios.post("/api/review/delete", { reviewId })
      if (!data?.success) {
        throw new Error(data?.message || "Không thể xóa đánh giá")
      }

      toast.success(data?.message || "Đã xóa đánh giá")
      if (editingReviewId === reviewId) {
        resetForm()
      }

      await fetchReviews({ page: 1, append: false, emitSummary: true })
      router.refresh()
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setDeletingReviewId("")
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 space-y-8">
      {summaryLoading ? (
        <RatingSummarySkeleton />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm uppercase tracking-wide text-gray-500">Đánh giá trung bình</p>
            <p className="mt-2 text-5xl font-semibold text-gray-900">{Number(summary.averageRating || 0).toFixed(1)}<span className="text-xl text-gray-500">/5</span></p>
            <p className="mt-1 text-sm text-gray-500">{summary.totalReviews} lượt đánh giá</p>
          </div>

          <div className="space-y-2">
            {starRows.map((row) => (
              <ReviewStatBar key={row.stars} stars={row.stars} count={row.count} percent={row.percent} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Bình luận từ khách hàng</h3>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải bình luận...</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
            Chưa có bình luận nào cho sản phẩm này.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isOwner = review?.canEdit || (userId && userId === review?.userId)
              const authorName = review?.author?.name || "Khách hàng"
              const authorImage = review?.author?.imageUrl || ""
              const starValue = Number(review?.rating || 0)

              return (
                <article key={review._id} className="rounded-xl border border-gray-200 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {authorImage ? (
                        <Image
                          src={authorImage}
                          alt={authorName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                          {authorName.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-900">{authorName}</p>
                        <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                          onClick={() => handleStartEdit(review)}
                          aria-label="Sửa đánh giá"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-60"
                          onClick={() => handleDeleteReview(review._id)}
                          disabled={deletingReviewId === review._id}
                          aria-label="Xóa đánh giá"
                        >
                          {deletingReviewId === review._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= starValue ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.comment}</p>

                  {Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {review.images.map((url, index) => (
                        <a key={`${review._id}-${index}`} href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-gray-200">
                          <ReviewCloudImage
                            src={url}
                            alt="Ảnh đánh giá"
                            width={200}
                            height={200}
                            className="h-28 w-full object-cover transition group-hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}

            {hasMore && (
              <button
                type="button"
                className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                onClick={() => fetchReviews({ page: currentPage + 1, append: true })}
                disabled={loadingMore}
              >
                {loadingMore ? "Đang tải thêm..." : "Xem thêm bình luận"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingReviewId ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
        </h3>

        {!isSignedIn ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600">Đăng nhập để gửi bình luận cho sản phẩm.</p>
            <button
              type="button"
              onClick={() => openSignIn()}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Đăng nhập để đánh giá
            </button>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Số sao</label>
              <ReviewRatingInput
                value={formRating}
                hoverValue={hoverRating}
                onHover={setHoverRating}
                onChange={(value) => setValue("rating", value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.rating?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.rating.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-gray-700">Nội dung bình luận</label>
              <textarea
                id="review-comment"
                {...register("comment")}
                rows={4}
                maxLength={2000}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                placeholder="Đánh giá trải nghiệm của bạn về sản phẩm..."
              />
              {errors.comment?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.comment.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <CldUploadWidget
                uploadPreset={uploadPreset}
                options={{
                  sources: ["local", "camera"],
                  multiple: true,
                  maxFiles: Math.max(1, 4 - formImages.length),
                  resourceType: "image",
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  maxFileSize: 5000000,
                  folder: "keyhub/reviews"
                }}
                signatureEndpoint={undefined}
                onSuccess={(result) => {
                  const url = result?.info?.secure_url
                  if (!url) {
                    return
                  }

                  const currentImages = Array.isArray(getValues("images")) ? getValues("images") : []
                  const next = [...new Set([...currentImages, url])].slice(0, 4)
                  setValue("images", next, { shouldValidate: true, shouldDirty: true })
                }}
                onError={() => {
                  toast.error("Tải ảnh thất bại")
                }}
              >
                {({ open }) => (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      onClick={() => {
                        if (!uploadPreset) {
                          toast.error("Thiếu cấu hình upload preset Cloudinary")
                          return
                        }

                        if (formImages.length >= 4) {
                          toast.error("Tối đa 4 ảnh")
                          return
                        }

                        open()
                      }}
                      disabled={isSubmitting || formImages.length >= 4}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Tải ảnh ({formImages.length}/4)
                    </button>
                    <p className="text-xs text-gray-500">Tối đa 4 ảnh, mỗi ảnh tối đa 5MB.</p>
                  </div>
                )}
              </CldUploadWidget>

              {errors.images?.message && (
                <p className="text-sm text-red-500">{errors.images.message}</p>
              )}

              {formImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {formImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <ReviewCloudImage
                        src={url}
                        alt="Ảnh đã tải lên"
                        width={160}
                        height={160}
                        className="h-24 w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-700"
                        onClick={() => setValue("images", formImages.filter((_, imageIndex) => imageIndex !== index), { shouldValidate: true, shouldDirty: true })}
                        aria-label="Xóa ảnh"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingReviewId ? "Lưu cập nhật" : "Gửi đánh giá"}
              </button>

              {editingReviewId && (
                <button
                  type="button"
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default ProductReviewsSection