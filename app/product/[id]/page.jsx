"use client"
import { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
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

const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = 'checkout-idempotency-key'

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const productData = useMemo(() => {
        return products.find((product) => product._id === id) || null;
    }, [products, id]);
    const stock = Number.isFinite(productData?.stock) ? productData.stock : 0
    const isOutOfStock = stock <= 0
    const isLowStock = stock > 0 && stock <= 2
    const categoryDisplay = Array.isArray(productData?.categoryNames) && productData.categoryNames.length > 0
        ? productData.categoryNames.join(', ')
        : Array.isArray(productData?.category) && productData.category.length > 0
            ? productData.category.join(', ')
            : typeof productData?.category === 'string' && productData.category
                ? productData.category
                : 'Chưa phân loại'

    useEffect(() => {
        setMainImage(null)
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
                        <div className="flex items-center gap-0.5">
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image
                                className="h-4 w-4"
                                src={assets.star_dull_icon}
                                alt="star_dull_icon"
                            />
                        </div>
                        <p>(4.5)</p>
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
                            disabled={isOutOfStock}
                            className={`w-full py-3.5 transition ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-800/80 hover:bg-gray-200'}`}
                        >
                            Thêm vào giỏ
                        </button>
                        <button
                            onClick={async () => {
                                if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                                    window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY, crypto.randomUUID())
                                }
                                const added = await addToCart(productData._id)
                                if (added) {
                                    router.push('/cart')
                                }
                            }}
                            disabled={isOutOfStock}
                            className={`w-full py-3.5 transition ${isOutOfStock ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                        </button>
                    </div>
                </div>
            </div>
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