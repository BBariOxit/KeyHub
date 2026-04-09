'use client'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Loading from '@/components/Loading'
import ProductForm from '@/components/seller/ProductForm'
import { useAppContext } from '@/context/AppContext'

const EditProductPage = () => {
  const { id } = useParams()
  const router = useRouter()
  const { getToken, user, fetchSellerProducts, fetchProductData } = useAppContext()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [product, setProduct] = useState(null)

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.get(`/api/product/seller-detail/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!data.success) {
        toast.error(data.message || 'Không thể tải thông tin sản phẩm')
        router.push('/seller/product-list')
        return
      }

      setProduct(data.product)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
      router.push('/seller/product-list')
    } finally {
      setLoading(false)
    }
  }, [getToken, id, router])

  useEffect(() => {
    if (user) {
      fetchProductDetail()
    }
  }, [user, fetchProductDetail])

  const handleUpdateProduct = async (payload) => {
    const formData = new FormData()
    formData.append('productId', id)
    formData.append('name', payload.name)
    formData.append('description', payload.description)
    formData.append('detailedDescription', payload.detailedDescription)
    formData.append('specifications', JSON.stringify(payload.specifications))
    payload.categoryIds.forEach((categoryId) => formData.append('categoryIds', categoryId))
    formData.append('price', payload.price)
    formData.append('offerPrice', payload.offerPrice)
    formData.append('stock', payload.stock)
    payload.existingImages.forEach((imageUrl) => formData.append('existingImages', imageUrl))
    payload.newImageFiles.forEach((file) => formData.append('images', file))

    try {
      setSubmitting(true)
      const token = await getToken()
      const { data } = await axios.post('/api/product/update', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!data.success) {
        const error = new Error(data.message || 'Không thể cập nhật sản phẩm')
        error.response = { data }
        throw error
      }

      toast.success(data.message || 'Cập nhật sản phẩm thành công')
      await Promise.all([
        fetchSellerProducts({ silent: true }),
        fetchProductData()
      ])
      router.push('/seller/product-list')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 min-h-screen bg-white p-6">
        <p className="text-sm text-gray-600">Không tìm thấy sản phẩm để chỉnh sửa.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="px-4 md:px-8 pt-4">
        <Link href="/seller/product-list" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600">
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>

      <ProductForm
        mode="edit"
        initialData={product}
        submitting={submitting}
        onSubmit={handleUpdateProduct}
        submitLabel="LƯU THAY ĐỔI"
        submittingLabel="Đang lưu..."
      />
    </div>
  )
}

export default EditProductPage
