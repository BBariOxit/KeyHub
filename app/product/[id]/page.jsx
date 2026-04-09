"use client"
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import React from "react";
import { formatVnd } from "@/lib/price";
import { optimizeCloudinaryImage } from "@/lib/image";
import DOMPurify from "isomorphic-dompurify";
import ProductReviewsSection from "@/components/reviews/ProductReviewsSection";
import StarDisplay from "@/components/StarDisplay";

const Product = () => {
    const SPECIFICATIONS_PREVIEW_LIMIT = 6

    const { id } = useParams();

    const { products, router, addToCart, cartItems } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [isSpecificationExpanded, setIsSpecificationExpanded] = useState(false)
    const [liveReviewSummary, setLiveReviewSummary] = useState({
        averageRating: null,
        totalReviews: null
    })
    const productData = useMemo(() => {
        return products.find((product) => product._id === id) || null;
    }, [products, id]);
    const stock = Number.isFinite(productData?.stock) ? productData.stock : 0
    const isOutOfStock = stock <= 0
    const isLowStock = stock > 0 && stock <= 2
    const cartQuantity = Number(cartItems?.[id] || 0)
    const isCartAtStockLimit = !isOutOfStock && cartQuantity >= stock
    const categoryDisplay = Array.isArray(productData?.categoryNames) && productData.categoryNames.length > 0
        ? productData.categoryNames.join(', ')
        : Array.isArray(productData?.category) && productData.category.length > 0
            ? productData.category.join(', ')
            : typeof productData?.category === 'string' && productData.category
                ? productData.category
                : 'Chưa phân loại'
    const cleanDetailedDescription = useMemo(() => {
        return DOMPurify.sanitize(productData?.detailedDescription || '')
    }, [productData?.detailedDescription])
    const hasDetailedDescription = useMemo(() => {
        const plainText = cleanDetailedDescription
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim()

        return plainText.length > 0
    }, [cleanDetailedDescription])
    const normalizedSpecifications = useMemo(() => {
        const rawSpecifications = productData?.specifications

        if (Array.isArray(rawSpecifications)) {
            return rawSpecifications
                .map((item) => ({
                    key: String(item?.key || '').trim(),
                    value: String(item?.value || '').trim()
                }))
                .filter((item) => item.key && item.value)
        }

        if (rawSpecifications && typeof rawSpecifications === 'object') {
            return Object.entries(rawSpecifications)
                .map(([key, value]) => ({
                    key: String(key || '').trim(),
                    value: String(value || '').trim()
                }))
                .filter((item) => item.key && item.value)
        }

        return []
    }, [productData?.specifications])
    const visibleSpecifications = isSpecificationExpanded
        ? normalizedSpecifications
        : normalizedSpecifications.slice(0, SPECIFICATIONS_PREVIEW_LIMIT)
    const hasMoreSpecifications = normalizedSpecifications.length > SPECIFICATIONS_PREVIEW_LIMIT
    const resolvedAverageRating = liveReviewSummary.averageRating ?? productData?.averageRating
    const resolvedTotalReviews = liveReviewSummary.totalReviews ?? productData?.totalReviews
    const averageRating = Number.isFinite(resolvedAverageRating)
        ? Math.min(5, Math.max(0, resolvedAverageRating))
        : 0
    const totalReviews = Number.isFinite(resolvedTotalReviews)
        ? Math.max(0, resolvedTotalReviews)
        : 0

    useEffect(() => {
        setMainImage(null)
    }, [id])

    useEffect(() => {
        setIsSpecificationExpanded(false)
    }, [id])

    useEffect(() => {
        setLiveReviewSummary({
            averageRating: null,
            totalReviews: null
        })
    }, [id])

    return productData ? (<>
        <Navbar />
        <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="px-5 lg:px-16 xl:px-20">
                    <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4 h-[360px] md:h-[420px] flex items-center justify-center">
                        <Image
                            src={optimizeCloudinaryImage(mainImage || productData.image[0], { width: 900, quality: "auto" }) || productData.image[0]}
                            alt="alt"
                            className="w-full h-full object-contain p-2 scale-105"
                            width={1280}
                            height={720}
                            priority
                            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 48vw, 640px"
                            unoptimized
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {productData.image.map((image, index) => (
                            <div
                                key={`${image}-${index}`}
                                onClick={() => setMainImage(image)}
                                className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10 h-24 md:h-28 flex items-center justify-center"
                            >
                                <Image
                                    src={optimizeCloudinaryImage(image, { width: 220, quality: "auto" }) || image}
                                    alt="alt"
                                    className="w-full h-full object-contain p-1 scale-105"
                                    width={1280}
                                    height={720}
                                    sizes="(max-width: 768px) 22vw, 120px"
                                    loading="lazy"
                                    unoptimized
                                />
                            </div>

                        ))}
                    </div>
                </div>

                <div className="flex flex-col">
                    <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
                        {productData.name}
                    </h1>
                    <div className="flex items-center gap-2">
                        <StarDisplay
                            rating={averageRating}
                            size={16}
                            activeClassName="text-orange-500"
                            inactiveClassName="text-orange-200"
                        />
                        <p>({averageRating.toFixed(1)} - {totalReviews} đánh giá)</p>
                    </div>
                    <p className="text-gray-600 mt-3">
                        {productData.description}
                    </p>
                    <p className="text-3xl font-medium mt-6">
                        {formatVnd(productData.offerPrice)} VND
                        <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                            {formatVnd(productData.price)} VND
                        </span>
                    </p>
                    <hr className="bg-gray-600 my-6" />
                    <div className="overflow-x-auto">
                        <table className="table-fixed border-collapse w-full max-w-md">
                            <tbody>
                                <tr>
                                    <td className="text-gray-600 font-medium whitespace-nowrap w-28 pr-5">Thương hiệu</td>
                                    <td className="text-gray-800/50 pl-5">KeyHub</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium whitespace-nowrap w-28 pr-5">Màu sắc</td>
                                    <td className="text-gray-800/50 pl-5">Nhiều màu</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium whitespace-nowrap w-28 pr-5">Danh mục</td>
                                    <td className="text-gray-800/50 pl-5">
                                        {categoryDisplay}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium whitespace-nowrap w-28 pr-5">Số lượng</td>
                                    <td className={`${isOutOfStock ? "text-red-500 font-medium" : isLowStock ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"} pl-5`}>
                                        {isOutOfStock ? 'Hết hàng' : isLowStock ? `Sắp hết (${stock})` : `Còn ${stock} sản phẩm`}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center mt-10 gap-4">
                        <button
                            onClick={() => addToCart(productData._id)}
                            disabled={isOutOfStock || isCartAtStockLimit}
                            className={`w-full py-3.5 transition ${(isOutOfStock || isCartAtStockLimit) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-800/80 hover:bg-gray-200'}`}
                        >
                            {isOutOfStock ? 'Hết hàng' : isCartAtStockLimit ? 'Đã thêm tối đa' : 'Thêm vào giỏ'}
                        </button>
                        <button
                            onClick={() => router.push('/cart')}
                            disabled={isOutOfStock}
                            className={`w-full py-3.5 transition ${isOutOfStock ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                        </button>
                    </div>
                </div>
            </div>

            <section className="pt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 lg:gap-10 items-start">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Mô tả chi tiết</h2>
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                        {hasDetailedDescription ? (
                            <div
                                className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-img:rounded-xl"
                                dangerouslySetInnerHTML={{ __html: cleanDetailedDescription }}
                            />
                        ) : (
                            <p className="text-gray-500">Sản phẩm chưa có mô tả chi tiết.</p>
                        )}
                    </div>
                </div>

                <aside className="lg:sticky lg:top-5 self-start">
                    <h2 className="text-2xl font-semibold text-gray-900">Thông số kỹ thuật</h2>
                    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="table-fixed border-collapse w-full">
                            <tbody>
                                {visibleSpecifications.length > 0 ? (
                                    visibleSpecifications.map((specification, index) => (
                                        <tr key={`${specification.key}-${index}`} className={index % 2 === 0 ? 'bg-gray-50/60' : ''}>
                                            <td className="text-gray-700 font-medium whitespace-nowrap w-36 px-4 py-3">{specification.key}</td>
                                            <td className="text-gray-700 px-4 py-3">{specification.value}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-4 text-gray-500">Sản phẩm chưa có thông số kỹ thuật chi tiết.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {hasMoreSpecifications && (
                        <button
                            type="button"
                            onClick={() => setIsSpecificationExpanded((prev) => !prev)}
                            className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                            {isSpecificationExpanded ? 'Thu gọn cấu hình' : 'Xem cấu hình chi tiết'}
                        </button>
                    )}
                </aside>
            </section>

            <section className="pt-2">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Đánh giá sản phẩm</h2>
                <ProductReviewsSection
                    productId={productData._id}
                    onSummaryChange={(summary) => {
                        setLiveReviewSummary({
                            averageRating: Number(summary?.averageRating || 0),
                            totalReviews: Number(summary?.totalReviews || 0)
                        })
                    }}
                />
            </section>

            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4 mt-16">
                    <p className="text-3xl font-medium">Sản phẩm <span className="font-medium text-orange-600">nổi bật</span></p>
                    <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
                    {products.slice(0, 5).map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
                <Link href='/all-products' className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition inline-block text-center">
                    Xem thêm
                </Link>
            </div>
        </div>
        <Footer />
    </>
    ) : <Loading />
};

export default Product;