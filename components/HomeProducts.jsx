'use client'
import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";

const DEFAULT_LIMIT = 15

const HomeProducts = ({ initialProducts = [], initialPagination }) => {

  const [displayProducts, setDisplayProducts] = React.useState(initialProducts)
  const [currentPage, setCurrentPage] = React.useState(initialPagination?.page || 1)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(Boolean(initialPagination?.hasMore))
  const limit = Number.isFinite(initialPagination?.limit) ? initialPagination.limit : DEFAULT_LIMIT

  const { products } = useAppContext()

  React.useEffect(() => {
    setDisplayProducts(initialProducts)
    setCurrentPage(initialPagination?.page || 1)
    setHasMore(Boolean(initialPagination?.hasMore))
  }, [initialProducts, initialPagination?.hasMore, initialPagination?.page])

  const visibleProducts = displayProducts.length > 0 ? displayProducts : products

  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) {
      return
    }

    const nextPage = currentPage + 1
    setIsLoadingMore(true)

    try {
      const { data } = await axios.get('/api/product/list', {
        params: {
          page: nextPage,
          limit
        }
      })

      if (!data?.success) {
        return
      }

      const incomingProducts = Array.isArray(data.products) ? data.products : []
      setDisplayProducts((previousProducts) => [...previousProducts, ...incomingProducts])
      setCurrentPage(nextPage)
      setHasMore(Boolean(data?.pagination?.hasMore) && incomingProducts.length > 0)
    } catch {
      // Keep silent to avoid noisy toasts on temporary network hiccups.
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">Sản phẩm phổ biến</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full">
        {visibleProducts.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={loadMoreProducts}
          disabled={isLoadingMore}
          className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition inline-block disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

export default HomeProducts;
