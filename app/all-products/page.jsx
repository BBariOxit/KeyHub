'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";

const PRODUCTS_PER_PAGE = 15

const AllProducts = () => {
    const { products, productsLoading } = useAppContext()

    const skeletonCount = useMemo(() => {
        if (products.length === 0) {
            return PRODUCTS_PER_PAGE
        }
        return products.length
    }, [products.length])

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
                <div className="flex flex-col items-end pt-12">
                    <p className="text-2xl font-medium">Tất cả sản phẩm</p>
                    <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
                    {products.map((product) => <ProductCard key={product._id} product={product} />)}

                    {productsLoading && Array.from({ length: skeletonCount }).map((_, index) => (
                        <div
                            key={`all-products-initial-skeleton-${index}`}
                            className="w-full max-w-[200px] animate-pulse"
                        >
                            <div className="relative rounded-lg h-52 bg-gray-200" />
                            <div className="mt-3 h-4 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-5/6 rounded bg-gray-200" />
                            <div className="mt-3 h-5 w-1/2 rounded bg-gray-200" />
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;
