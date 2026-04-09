'use client'
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatVnd } from "@/lib/price";
import { optimizeCloudinaryImage } from "@/lib/image";
import { Eye, Pencil, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

const ProductList = () => {

  const { getToken, user, fetchProductData } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingVisibilityIds, setPendingVisibilityIds] = useState({})
  const [pendingDeleteIds, setPendingDeleteIds] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchSellerProduct = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/product/seller-list', { headers: { Authorization: `Bearer ${token}` }})
      if (data.success) {
        setProducts(data.products)
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

  const handleToggleVisibility = async (productId, currentVisibility) => {
    const nextVisibility = !Boolean(currentVisibility)

    setProducts((prev) => prev.map((item) => (
      item._id === productId
        ? { ...item, isVisible: nextVisibility }
        : item
    )))
    setPendingVisibilityIds((prev) => ({ ...prev, [productId]: true }))

    try {
      const token = await getToken()
      const { data } = await axios.post('/api/product/toggle-visibility', {
        productId,
        isVisible: nextVisibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái hiển thị')
      }

      setProducts((prev) => prev.map((item) => (
        item._id === productId
          ? { ...item, isVisible: Boolean(data?.product?.isVisible) }
          : item
      )))

      try {
        await fetchProductData()
      } catch {
        // Không chặn luồng seller nếu refresh storefront data lỗi.
      }
    } catch (error) {
      setProducts((prev) => prev.map((item) => (
        item._id === productId
          ? { ...item, isVisible: Boolean(currentVisibility) }
          : item
      )))
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setPendingVisibilityIds((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    }
  }

  const openDeleteModal = (product) => {
    if (!product?._id) {
      return
    }

    setDeleteTarget({ _id: product._id, name: product.name || '' })
  }

  const closeDeleteModal = () => {
    if (deleteTarget?._id && pendingDeleteIds[deleteTarget._id]) {
      return
    }

    setDeleteTarget(null)
  }

  const handleDeleteProduct = async () => {
    const productId = deleteTarget?._id
    if (!productId) {
      return
    }

    setPendingDeleteIds((prev) => ({ ...prev, [productId]: true }))

    try {
      const token = await getToken()
      const { data } = await axios.post('/api/product/delete', {
        productId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!data.success) {
        throw new Error(data.message || 'Không thể xóa sản phẩm')
      }

      setProducts((prev) => prev.filter((item) => item._id !== productId))
      toast.success(data.message || 'Đã xóa sản phẩm')

      try {
        await fetchProductData()
      } catch {
        // Không chặn luồng seller nếu refresh storefront data lỗi.
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setPendingDeleteIds((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
        <h2 className="pb-4 text-lg font-medium">Tất cả sản phẩm</h2>
        <div className="w-full overflow-x-auto rounded-md bg-white border border-gray-500/20">
          <table className="table-fixed min-w-[980px] w-full overflow-hidden">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="text-gray-900 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-medium truncate">Sản phẩm</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Danh mục</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Số lượng</th>
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
                  <td className="px-4 py-3 max-sm:hidden">
                    <div className="space-y-1 leading-5">
                      {(
                        Array.isArray(product.categoryNames) && product.categoryNames.length > 0
                          ? product.categoryNames
                            .flatMap((item) => String(item || '').split(','))
                            .map((item) => item.trim())
                            .filter(Boolean)
                          : String(product.category || '')
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean)
                      ).slice(0, 2).map((categoryName, index) => (
                        <p key={`${product._id}-category-${index}`} className="truncate">
                          {categoryName}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{product.stock ?? 0}</span>
                      {(product.stock ?? 0) === 0 && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-red-100 text-red-600 font-medium">
                          Hết hàng
                        </span>
                      )}
                      {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 2 && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-700 font-medium">
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatVnd(product.offerPrice)} VND</td>
                  <td className="px-4 py-3 max-sm:hidden text-center">
                    <div className="inline-flex items-center gap-2.5">
                      <Link
                        href={`/product/${product._id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-orange-200 text-orange-600 hover:bg-orange-50"
                        aria-label="Xem sản phẩm"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/seller/products/${product._id}/edit`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                        aria-label="Sửa sản phẩm"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(product)}
                        disabled={Boolean(pendingDeleteIds[product._id])}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50 ${pendingDeleteIds[product._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label="Xóa sản phẩm"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(product._id, product.isVisible)}
                        disabled={Boolean(pendingVisibilityIds[product._id])}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${product.isVisible ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-300 border-gray-300'} ${pendingVisibilityIds[product._id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                        aria-label={product.isVisible ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                        title={product.isVisible ? 'Đang hiển thị - bấm để ẩn' : 'Đang ẩn - bấm để hiện'}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${product.isVisible ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        objectLabel="sản phẩm"
        objectName={deleteTarget?.name || ''}
        loading={Boolean(deleteTarget?._id && pendingDeleteIds[deleteTarget._id])}
        onCancel={closeDeleteModal}
        onConfirm={handleDeleteProduct}
      />
      <Footer />
    </div>
  );
};

export default ProductList;