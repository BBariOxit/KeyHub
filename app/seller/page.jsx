'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { formatThousandsInput, getNumericString } from "@/lib/price";
import Link from "next/link";

const AddProduct = () => {

  const { getToken, fetchProductData, categories, fetchCategories, categoriesLoading } = useAppContext()

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = files.map((file) => (file ? URL.createObjectURL(file) : null));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories({ silent: false })
    }
  }, [categories.length, fetchCategories])

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryId((prev) => prev || categories[0]._id)
    }
  }, [categories])

  const clearError = (fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({})

    if (categories.length === 0) {
      toast.error('Bạn cần tạo danh mục trước khi thêm sản phẩm')
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('categoryId', categoryId)
    formData.append('price', getNumericString(price))
    formData.append('offerPrice', getNumericString(offerPrice))
    formData.append('stock', stock)

    for (let i = 0; i < files.length; i++) {
      if (files[i]) {
        formData.append('images', files[i])
      }
    }

    try {
      setSubmitting(true)
      const token = await getToken()
      const { data } = await axios.post('/api/product/add', formData, {headers: {Authorization: `Bearer ${token}`}})

      if (data.success) {
        toast.success(data.message)
        setFiles([])
        setName('')
        setDescription('')
        setCategoryId(categories[0]?._id || '')
        setPrice('')
        setOfferPrice('')
        setStock('0')
        setFieldErrors({})
        await fetchProductData()
      } else {
        if (Array.isArray(data.errors)) {
          const nextErrors = {}
          data.errors.forEach((item) => {
            if (!item?.path) return
            if (!nextErrors[item.path]) {
              nextErrors[item.path] = item.message
            }
          })
          setFieldErrors(nextErrors)
        }
        toast.error(data.message)
      }
    } catch (error) {
      const apiErrors = error.response?.data?.errors
      if (Array.isArray(apiErrors)) {
        const nextErrors = {}
        apiErrors.forEach((item) => {
          if (!item?.path) return
          if (!nextErrors[item.path]) {
            nextErrors[item.path] = item.message
          }
        })
        setFieldErrors(nextErrors)
      }
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }

  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-6 max-w-lg w-full">
        <div>
          <p className="text-base font-medium">Hình ảnh sản phẩm</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }} type="file" id={`image${index}`} hidden />
                <Image
                  className="max-w-24 cursor-pointer"
                  src={previewUrls[index] || assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}

          </div>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <label className="text-base font-medium" htmlFor="product-name">
            Tên sản phẩm
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Nhập tại đây"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Mô tả sản phẩm
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Nhập tại đây"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 w-full min-w-0">
            <label className="text-base font-medium" htmlFor="category">
              Danh mục
            </label>
            <select
              id="category"
              className="w-full min-w-0 outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => {
                setCategoryId(e.target.value)
                clearError('categoryId')
              }}
              value={categoryId}
              disabled={categories.length === 0 || categoriesLoading}
            >
              {categoriesLoading && <option value="">Đang tải danh mục...</option>}
              {!categoriesLoading && categories.length === 0 && <option value="">Chưa có danh mục</option>}
              {categories.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            {fieldErrors.categoryId && <p className="text-xs text-red-500">{fieldErrors.categoryId}</p>}
            {categories.length === 0 && (
              <Link href="/seller/categories" className="text-xs text-orange-600 hover:underline">
                Tạo danh mục ngay
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-base font-medium" htmlFor="stock">
              Tồn kho
            </label>
            <input
              id="stock"
              type="number"
              min={0}
              className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => {
                setStock(e.target.value)
                clearError('stock')
              }}
              value={stock}
              required
            />
            {fieldErrors.stock && <p className="text-xs text-red-500">{fieldErrors.stock}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-base font-medium" htmlFor="product-price">
              Giá sản phẩm
            </label>
            <input
              id="product-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(getNumericString(e.target.value))}
              value={formatThousandsInput(price)}
              required
            />
            {fieldErrors.price && <p className="text-xs text-red-500">{fieldErrors.price}</p>}
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-base font-medium" htmlFor="offer-price">
              Giá ưu đãi
            </label>
            <input
              id="offer-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(getNumericString(e.target.value))}
              value={formatThousandsInput(offerPrice)}
              required
            />
            {fieldErrors.offerPrice && <p className="text-xs text-red-500">{fieldErrors.offerPrice}</p>}
          </div>
        </div>
        {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        {fieldErrors.description && <p className="text-xs text-red-500">{fieldErrors.description}</p>}
        <button disabled={submitting} type="submit" className={`px-8 py-2.5 text-white font-medium rounded ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600'}`}>
          THÊM
        </button>
      </form>
      {/* <Footer /> */}
    </div>
  );
};

export default AddProduct;