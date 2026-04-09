'use client'
import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAppContext } from '@/context/AppContext'
import ProductForm from '@/components/seller/ProductForm'

const AddProduct = () => {
  const { getToken, fetchProductData } = useAppContext()
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleCreateProduct = async (payload) => {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('description', payload.description)
    formData.append('detailedDescription', payload.detailedDescription)
    formData.append('specifications', JSON.stringify(payload.specifications))
    payload.categoryIds.forEach((id) => formData.append('categoryIds', id))
    formData.append('price', payload.price)
    formData.append('offerPrice', payload.offerPrice)
    formData.append('stock', payload.stock)
    payload.newImageFiles.forEach((file) => formData.append('images', file))

    try {
      setSubmitting(true)
      const token = await getToken()
      const { data } = await axios.post('/api/product/add', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!data.success) {
        const error = new Error(data.message || 'Không thể thêm sản phẩm')
        error.response = { data }
        throw error
      }

      toast.success(data.message || 'Thêm sản phẩm thành công')
      await fetchProductData()
      setFormKey((prev) => prev + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-white">
      <ProductForm
        key={formKey}
        mode="create"
        submitting={submitting}
        onSubmit={handleCreateProduct}
        submitLabel="THÊM SẢN PHẨM"
        submittingLabel="Đang thêm..."
      />
    </div>
  )
}

export default AddProduct
