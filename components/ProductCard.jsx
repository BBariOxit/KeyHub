import React, { useState } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { formatVnd } from '@/lib/price';
import { optimizeCloudinaryImage } from '@/lib/image';
import { Heart } from 'lucide-react';
import StarDisplay from '@/components/StarDisplay';

const ProductCard = ({ product }) => {

    const { currency, isFavorite, toggleFavorite } = useAppContext()
    const [favoriteLoading, setFavoriteLoading] = useState(false)
    const normalizedAverageRating = Number.isFinite(product?.averageRating)
        ? Math.min(5, Math.max(0, product.averageRating))
        : 0
    const totalReviews = Number.isFinite(product?.totalReviews)
        ? Math.max(0, product.totalReviews)
        : 0
    const rating = totalReviews > 0 ? normalizedAverageRating : 0
    const cardImage = optimizeCloudinaryImage(product?.image?.[0], { width: 420, quality: 'auto' })
    const stock = Number.isFinite(product?.stock) ? product.stock : 0
    const isOutOfStock = stock <= 0
    const isLowStock = stock > 0 && stock <= 2
    const rawCategoryList = Array.isArray(product?.categoryNames) && product.categoryNames.length > 0
        ? product.categoryNames
        : Array.isArray(product?.category) && product.category.length > 0
            ? product.category
            : typeof product?.category === 'string' && product.category.trim() !== ''
                ? [product.category]
                : []

    const categoryList = rawCategoryList
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean)

    const categoryLabel = categoryList[0] || 'Chưa phân loại'
    const productId = String(product?._id || '')
    const favorited = isFavorite(productId)

    const handleToggleFavorite = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (favoriteLoading || !productId) {
            return
        }

        setFavoriteLoading(true)
        await toggleFavorite(productId)
        setFavoriteLoading(false)
    }

    return (
        <Link
            href={'/product/' + product._id}
            scroll={true}
            className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer"
        >
            <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center">
                <Image
                    src={cardImage || product.image[0]}
                    alt={product.name}
                    className="transition duration-300 object-contain w-full h-full p-2 scale-110 group-hover:scale-[1.18]"
                    width={800}
                    height={800}
                    sizes="(max-width: 768px) 45vw, (max-width: 1280px) 22vw, 200px"
                    loading="lazy"
                    unoptimized
                />
                <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md disabled:opacity-70"
                    aria-label={favorited ? 'Bo yeu thich' : 'Them vao yeu thich'}
                >
                    <Heart
                        className={`h-3.5 w-3.5 transition ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                    />
                </button>
            </div>

            <p className="md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
            <p className="w-full text-[11px] text-gray-500 truncate">{categoryLabel}</p>
            <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">{product.description}</p>
            <div className="flex items-center gap-2">
                <p className="text-xs">{rating.toFixed(1)}</p>
                <StarDisplay
                    rating={rating}
                    size={12}
                    activeClassName="text-orange-500"
                    inactiveClassName="text-orange-200"
                />
                <p className="text-[11px] text-gray-500">({totalReviews})</p>
            </div>

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-medium">{formatVnd(product.offerPrice)} {currency}</p>
                {(isOutOfStock || isLowStock) && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                        {isOutOfStock ? 'Hết hàng' : 'Sắp hết'}
                    </span>
                )}
                {/* <button className=" max-sm:hidden px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition">
                    Mua ngay
                </button> */}
            </div>
        </Link>
    )
}

export default ProductCard