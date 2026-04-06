'use client'
import React, { useCallback, useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatVnd } from "@/lib/price";
import { optimizeCloudinaryImage } from "@/lib/image";

const ProductList = () => {

  const { getToken, user } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSellerProduct = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/product/seller-list', { headers: { Authorization: `Bearer ${token}` }})
      if (data.success) {
        setProducts(data.products)
        setLoading(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false) 
    }
  }, [getToken])

  useEffect(() => {
    if (user) {
      fetchSellerProduct()
    }
  }, [user, fetchSellerProduct])

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
        <h2 className="pb-4 text-lg font-medium">Tất cả sản phẩm</h2>
        <div className="w-full overflow-x-auto rounded-md bg-white border border-gray-500/20">
          <table className="table-fixed min-w-[980px] w-full overflow-hidden">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="text-gray-900 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-medium truncate">Sản phẩm</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Danh mục</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Tồn kho</th>
                <th className="px-4 py-3 font-medium truncate text-left">
                  Giá
                </th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {products.map((product) => (
                <tr key={product._id} className="border-t border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <div className="bg-gray-500/10 rounded p-2">
                       <Image
                        src={optimizeCloudinaryImage(product.image[0], { width: 120, quality: 'auto' }) || product.image[0]}
                        alt="product Image"
                        className="w-16"
                        width={1280}
                        height={720}
                        unoptimized
                      />
                    </div>
                    <span className="truncate w-full">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
                  <td className="px-4 py-3 max-sm:hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{product.stock ?? 0}</span>
                      {(product.stock ?? 0) < 5 && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-700 font-medium">
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatVnd(product.offerPrice)} VND</td>
                  <td className="px-4 py-3 max-sm:hidden text-center">
                    <Link href={`/product/${product._id}`} className="inline-flex items-center gap-1 px-1.5 md:px-3.5 py-2 bg-orange-600 text-white rounded-md">
                      <span className="hidden md:block">Xem</span>
                      <Image
                        className="h-3.5"
                        src={assets.redirect_icon}
                        alt="redirect_icon"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
      <Footer />
    </div>
  );
};

export default ProductList;