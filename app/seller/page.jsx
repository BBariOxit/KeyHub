'use client'
import React, { useEffect, useMemo, useRef, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { formatThousandsInput, getNumericString } from "@/lib/price";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const RichTextControlButton = ({ isActive, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1.5 text-xs rounded border transition ${isActive ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
  >
    {label}
  </button>
)

const createEmptySpecification = () => ({ key: '', value: '' })

const AddProduct = () => {

  const { getToken, fetchProductData, categories, fetchCategories, categoriesLoading } = useAppContext()

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [specifications, setSpecifications] = useState([createEmptySpecification()]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const categoryRef = useRef(null)

  const detailedDescriptionEditor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[220px] px-3 py-2.5 focus:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      setDetailedDescription(editor.getHTML())
      clearError('detailedDescription')
    }
  })

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
      setCategoryIds((prev) => (prev.length > 0 ? prev : [categories[0]._id]))
    }
  }, [categories])

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!categoryRef.current) return
      if (!categoryRef.current.contains(event.target)) {
        setCategoryMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const selectedCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return []
    return categories.filter((item) => categoryIds.includes(item._id))
  }, [categories, categoryIds])

  const previewName = name.trim() || 'Tên sản phẩm của bạn'
  const previewDescription = description.trim() || 'Mô tả ngắn sẽ hiển thị ở đây để bạn xem trước cách sản phẩm xuất hiện ngoài trang chủ.'
  const previewCategory = selectedCategories.length > 0
    ? selectedCategories.map((item) => item.name).join(', ')
    : 'Chưa chọn danh mục'
  const numericPrice = Number(getNumericString(price) || 0)
  const numericOfferPrice = Number(getNumericString(offerPrice) || 0)
  const previewImage = previewUrls[0] || assets.upload_area
  const stockNumber = Math.max(0, Number(stock || 0))
  const stockStatus = stockNumber <= 0 ? 'Hết hàng' : stockNumber <= 2 ? `Sắp hết (${stockNumber})` : `Còn ${stockNumber}`
  const normalizedSpecifications = useMemo(() => {
    return specifications
      .map((item) => ({
        key: item.key.trim(),
        value: item.value.trim()
      }))
      .filter((item) => item.key && item.value)
  }, [specifications])

  const hasIncompleteSpecification = useMemo(() => {
    return specifications.some((item) => {
      const hasKey = item.key.trim() !== ''
      const hasValue = item.value.trim() !== ''
      return hasKey !== hasValue
    })
  }, [specifications])

  const toggleCategory = (id) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
    clearError('categoryIds')
  }

  const clearError = (fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const handleSpecificationChange = (index, field, nextValue) => {
    setSpecifications((prev) => prev.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, [field]: nextValue }
        : item
    )))
    clearError('specifications')
  }

  const addSpecificationRow = () => {
    if (specifications.length >= 50) {
      toast.error('Tối đa 50 thông số kỹ thuật')
      return
    }

    setSpecifications((prev) => [...prev, createEmptySpecification()])
  }

  const removeSpecificationRow = (index) => {
    setSpecifications((prev) => {
      if (prev.length <= 1) {
        return [createEmptySpecification()]
      }
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
    clearError('specifications')
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({})

    if (categories.length === 0) {
      toast.error('Bạn cần tạo danh mục trước khi thêm sản phẩm')
      return
    }

    if (categoryIds.length === 0) {
      setFieldErrors({ categoryIds: 'Vui lòng chọn ít nhất một danh mục' })
      return
    }

    if (hasIncompleteSpecification) {
      setFieldErrors({ specifications: 'Mỗi dòng thông số cần nhập đủ cả tên và giá trị' })
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('detailedDescription', detailedDescription)
    formData.append('specifications', JSON.stringify(normalizedSpecifications))
    categoryIds.forEach((id) => formData.append('categoryIds', id))
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
        setDetailedDescription('')
        setSpecifications([createEmptySpecification()])
        detailedDescriptionEditor?.commands.clearContent()
        setCategoryIds(categories[0]?._id ? [categories[0]._id] : [])
        setPrice('')
        setOfferPrice('')
        setStock('0')
        setFieldErrors({})
        try {
          await fetchProductData()
        } catch {
          // Bỏ qua lỗi refresh list để không hiển thị toast lỗi sau khi tạo thành công.
        }
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
    <div className="flex-1 min-h-screen bg-white">
      <div className="md:p-8 p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,680px)_minmax(320px,1fr)] gap-6 items-start">
        <form onSubmit={handleSubmit} className="space-y-6 w-full rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900">Thêm sản phẩm</h2>
            <p className="text-sm text-gray-500">Nhập thông tin bên trái, khung preview bên phải sẽ cập nhật ngay.</p>
          </div>

          <div>
            <p className="text-base font-medium">Hình ảnh sản phẩm</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">

              {[...Array(4)].map((_, index) => (
                <div key={index} className="relative">
                  <label htmlFor={`image${index}`}>
                    <input onChange={(e) => {
                      const updatedFiles = [...files];
                      updatedFiles[index] = e.target.files[0];
                      setFiles(updatedFiles);
                    }} onClick={(e) => {
                      e.target.value = ''
                    }} type="file" id={`image${index}`} hidden />
                    <Image
                      className="max-w-24 cursor-pointer rounded-lg border border-gray-200"
                      src={previewUrls[index] || assets.upload_area}
                      alt=""
                      width={100}
                      height={100}
                      unoptimized
                    />
                  </label>
                  {previewUrls[index] && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const updatedFiles = [...files]
                        updatedFiles[index] = undefined
                        setFiles(updatedFiles)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/75 text-white text-xs font-semibold hover:bg-black"
                      aria-label="Bỏ chọn ảnh"
                    >
                      x
                    </button>
                  )}
                </div>
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
          <div className="flex flex-col gap-2 w-full">
            <label className="text-base font-medium">Mô tả chi tiết</label>

            <div className="flex flex-wrap gap-2 p-2 rounded-t border border-gray-500/40 border-b-0 bg-gray-50/60">
              <RichTextControlButton
                label="Đậm"
                isActive={Boolean(detailedDescriptionEditor?.isActive('bold'))}
                onClick={() => detailedDescriptionEditor?.chain().focus().toggleBold().run()}
              />
              <RichTextControlButton
                label="Nghiêng"
                isActive={Boolean(detailedDescriptionEditor?.isActive('italic'))}
                onClick={() => detailedDescriptionEditor?.chain().focus().toggleItalic().run()}
              />
              <RichTextControlButton
                label="Tiêu đề"
                isActive={Boolean(detailedDescriptionEditor?.isActive('heading', { level: 3 }))}
                onClick={() => detailedDescriptionEditor?.chain().focus().toggleHeading({ level: 3 }).run()}
              />
              <RichTextControlButton
                label="Danh sách"
                isActive={Boolean(detailedDescriptionEditor?.isActive('bulletList'))}
                onClick={() => detailedDescriptionEditor?.chain().focus().toggleBulletList().run()}
              />
            </div>

            <div className="rounded-b border border-gray-500/40 bg-white">
              <EditorContent editor={detailedDescriptionEditor} />
            </div>

            <p className="text-xs text-gray-500">Nội dung này sẽ hiển thị ở trang chi tiết sản phẩm.</p>
            {fieldErrors.detailedDescription && <p className="text-xs text-red-500">{fieldErrors.detailedDescription}</p>}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-base font-medium">Thông số kỹ thuật</label>

            <div className="space-y-2 rounded border border-gray-500/40 p-3 bg-gray-50/40">
              {specifications.map((spec, index) => (
                <div key={`spec-${index}`} className="grid grid-cols-1 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)_90px] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Tên thông số"
                    className="outline-none py-2 px-3 rounded border border-gray-300"
                    value={spec.key}
                    onChange={(event) => handleSpecificationChange(index, 'key', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Giá trị"
                    className="outline-none py-2 px-3 rounded border border-gray-300"
                    value={spec.value}
                    onChange={(event) => handleSpecificationChange(index, 'value', event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecificationRow(index)}
                    className="px-3 py-2 text-sm rounded border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSpecificationRow}
                className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                + Thêm thông số
              </button>
            </div>

            <p className="text-xs text-gray-500">Để trống cả dòng nếu chưa cần thêm thông số.</p>
            {fieldErrors.specifications && <p className="text-xs text-red-500">{fieldErrors.specifications}</p>}
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 w-full min-w-0">
              <label className="text-base font-medium" htmlFor="category-dropdown">
                Danh mục
              </label>
              <div ref={categoryRef} className="relative">
                <button
                  id="category-dropdown"
                  type="button"
                  onClick={() => !categoriesLoading && setCategoryMenuOpen((prev) => !prev)}
                  disabled={categories.length === 0 || categoriesLoading}
                  className="w-full min-h-[44px] outline-none py-2 px-3 rounded border border-gray-500/40 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex-1 overflow-x-auto whitespace-nowrap">
                    {selectedCategories.length === 0 ? (
                      <span className="text-gray-400 text-sm">
                        {categoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục'}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        {selectedCategories.map((item) => (
                          <span key={item._id} className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 text-xs font-medium">
                            {item.name}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCategory(item._id)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleCategory(item._id)
                                }
                              }}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              x
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-gray-500 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {categoryMenuOpen && categories.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {categories.map((item) => {
                      const selected = categoryIds.includes(item._id)
                      return (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => toggleCategory(item._id)}
                          className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between hover:bg-gray-50 ${selected ? 'text-orange-700 bg-orange-50/60' : 'text-gray-700'}`}
                        >
                          <span>{item.name}</span>
                          {selected && <span className="text-orange-600">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {fieldErrors.categoryIds && <p className="text-xs text-red-500">{fieldErrors.categoryIds}</p>}
              {categories.length === 0 && (
                <Link href="/seller/categories" className="text-xs text-orange-600 hover:underline">
                  Tạo danh mục ngay
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-base font-medium" htmlFor="stock">
                Số lượng
              </label>
              <div className="relative">
                <input
                  id="stock"
                  type="number"
                  min={0}
                  className="w-full outline-none pl-3 pr-10 py-2.5 rounded border border-gray-500/40"
                  onChange={(e) => {
                    setStock(e.target.value)
                    clearError('stock')
                  }}
                  value={stock}
                  required
                />
                <div className="absolute right-1.5 top-1.5 bottom-1.5 w-6 rounded-md border border-gray-200 overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setStock(String(Number(stock || 0) + 1))
                      clearError('stock')
                    }}
                    className="h-1/2 w-full flex items-center justify-center hover:bg-gray-100 border-b border-gray-200"
                    aria-label="Tăng số lượng"
                  >
                    <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-b-[6px] border-b-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStock(String(Math.max(0, Number(stock || 0) - 1)))
                      clearError('stock')
                    }}
                    className="h-1/2 w-full flex items-center justify-center hover:bg-gray-100"
                    aria-label="Giảm số lượng"
                  >
                    <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-t-[6px] border-t-gray-500" />
                  </button>
                </div>
              </div>
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
          <button disabled={submitting} type="submit" className={`px-8 py-2.5 text-white font-medium rounded-lg ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}>
            {submitting ? 'Đang thêm...' : 'THÊM SẢN PHẨM'}
          </button>
        </form>

        <aside className="xl:sticky xl:top-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/70">
              <p className="text-xs tracking-wide text-gray-500">Preview trực tiếp</p>
              <h3 className="text-lg font-semibold text-gray-900">Bản xem trước trên trang chủ</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-200 h-56 flex items-center justify-center overflow-hidden relative">
                <Image
                  src={previewImage}
                  alt="preview-product"
                  width={520}
                  height={520}
                  className="w-full h-full object-contain p-4"
                  unoptimized
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                  {previewCategory}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900 leading-tight">{previewName}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{previewDescription}</p>
              </div>

              <div className="flex items-end justify-between gap-3 pt-1">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatThousandsInput(String(numericOfferPrice || 0))} VND</p>
                  <p className="text-sm text-gray-400 line-through">{formatThousandsInput(String(numericPrice || 0))} VND</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stockNumber <= 0 ? 'bg-red-100 text-red-700' : stockNumber <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {stockStatus}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddProduct;