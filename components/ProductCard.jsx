import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { formatVnd } from '@/lib/price';
import { optimizeCloudinaryImage } from '@/lib/image';

const STAR_INDICES = [0, 1, 2, 3, 4]

const ProductCard = ({ product }) => {

    const { currency, router } = useAppContext()
    const rating = Number.isFinite(product?.rating) ? product.rating : 4.5
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
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md"
                >
                    <Image
                        className="h-3 w-3"
                        src={assets.heart_icon}
                        alt="heart_icon"
                    />
                </button>
            </div>

            <p className="md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
            <p className="w-full text-[11px] text-gray-500 truncate">{categoryLabel}</p>
            <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">{product.description}</p>
            <div className="flex items-center gap-2">
                <p className="text-xs">{rating}</p>
                <div className="flex items-center gap-0.5">
                    {STAR_INDICES.map((index) => (
                        <Image
                            key={index}
                            className="h-3 w-3"
                            src={
                                index < Math.floor(rating)
                                    ? assets.star_icon
                                    : assets.star_dull_icon
                            }
                            alt="star_icon"
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-medium">{formatVnd(product.offerPrice)} {currency}</p>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'Còn hàng'}
                </span>
                {/* <button className=" max-sm:hidden px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition">
                    Mua ngay
                </button> */}
            </div>
        </Link>
    )
}

export default ProductCard