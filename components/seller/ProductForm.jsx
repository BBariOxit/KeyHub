'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import { formatThousandsInput, formatVnd, getNumericString } from '@/lib/price'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import toast from 'react-hot-toast'
import { useFieldArray, useForm } from 'react-hook-form'

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

const mapInitialSpecifications = (rawSpecifications) => {
  if (Array.isArray(rawSpecifications)) {
    const mapped = rawSpecifications
      .map((item) => ({
        key: String(item?.key || '').trim(),
        value: String(item?.value || '').trim()
      }))
      .filter((item) => item.key || item.value)

    return mapped.length > 0 ? mapped : [createEmptySpecification()]
  }

  if (rawSpecifications && typeof rawSpecifications === 'object') {
    const mapped = Object.entries(rawSpecifications)
      .map(([key, value]) => ({
        key: String(key || '').trim(),
        value: String(value || '').trim()
      }))
      .filter((item) => item.key || item.value)

    return mapped.length > 0 ? mapped : [createEmptySpecification()]
  }

  return [createEmptySpecification()]
}

const mapInitialImages = (images = []) => {
  const normalized = Array.from({ length: 4 }, (_, index) => {
    const url = images[index]
    if (typeof url === 'string' && url.trim()) {
      return { type: 'url', value: url }
    }
    return null
  })

  return normalized
}

const ProductForm = ({
  mode = 'create',
  initialData,
  submitting,
  onSubmit,
  submitLabel,
  submittingLabel
}) => {
  const { categories, fetchCategories, categoriesLoading } = useAppContext()

  const [imageSlots, setImageSlots] = useState(() => mapInitialImages(initialData?.image || []))
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [detailedDescription, setDetailedDescription] = useState(initialData?.detailedDescription || '')
  const [categoryIds, setCategoryIds] = useState(() => {
    const ids = Array.isArray(initialData?.categoryIds)
      ? initialData.categoryIds.map((item) => String(item?._id || item)).filter(Boolean)
      : []
    return ids
  })
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : '')
  const [offerPrice, setOfferPrice] = useState(initialData?.offerPrice != null ? String(initialData.offerPrice) : '')
  const [stock, setStock] = useState(initialData?.stock != null ? String(initialData.stock) : '0')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const initializedProductIdRef = useRef('')

  const categoryRef = useRef(null)

  const specificationForm = useForm({
    defaultValues: {
      specifications: mapInitialSpecifications(initialData?.specifications)
    }
  })

  const { control, register, reset, getValues } = specificationForm
  const { fields: specificationFields, append, remove, replace } = useFieldArray({
    control,
    name: 'specifications'
  })

  const detailedDescriptionEditor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: initialData?.detailedDescription || '',
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

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories({ silent: false })
    }
  }, [categories.length, fetchCategories])

  useEffect(() => {
    if (mode === 'create' && categories.length > 0) {
      setCategoryIds((prev) => (prev.length > 0 ? prev : [categories[0]._id]))
    }
  }, [mode, categories])

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

  useEffect(() => {
    if (!initialData) return

    const incomingProductId = String(initialData?._id || '')
    if (mode === 'edit' && incomingProductId && initializedProductIdRef.current === incomingProductId) {
      return
    }

    const nextCategoryIds = Array.isArray(initialData?.categoryIds)
      ? initialData.categoryIds.map((item) => String(item?._id || item)).filter(Boolean)
      : []

    setImageSlots(mapInitialImages(initialData?.image || []))
    setName(initialData?.name || '')
    setDescription(initialData?.description || '')
    setDetailedDescription(initialData?.detailedDescription || '')
    reset({
      specifications: mapInitialSpecifications(initialData?.specifications)
    })
    setCategoryIds(nextCategoryIds)
    setPrice(initialData?.price != null ? String(initialData.price) : '')
    setOfferPrice(initialData?.offerPrice != null ? String(initialData.offerPrice) : '')
    setStock(initialData?.stock != null ? String(initialData.stock) : '0')
    setFieldErrors({})

    if (detailedDescriptionEditor) {
      detailedDescriptionEditor.commands.setContent(initialData?.detailedDescription || '')
    }

    if (mode === 'edit' && incomingProductId) {
      initializedProductIdRef.current = incomingProductId
    }
  }, [mode, initialData, detailedDescriptionEditor, reset])

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
  const stockNumber = Math.max(0, Number(stock || 0))
  const stockStatus = stockNumber <= 0 ? 'Hết hàng' : stockNumber <= 2 ? `Sắp hết (${stockNumber})` : `Còn ${stockNumber}`
  const [previewUrls, setPreviewUrls] = useState([])

  useEffect(() => {
    const nextUrls = imageSlots.map((slot) => {
      if (!slot) return null
      if (slot.type === 'url') return slot.value
      if (slot.type === 'file') return URL.createObjectURL(slot.value)
      return null
    })

    setPreviewUrls(nextUrls)

    return () => {
      nextUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imageSlots])

  const previewImage = previewUrls.find(Boolean) || assets.upload_area

  const clearError = (fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const setApiErrors = (errors = []) => {
    if (!Array.isArray(errors)) return
    const nextErrors = {}

    errors.forEach((item) => {
      if (!item?.path) return
      if (!nextErrors[item.path]) {
        nextErrors[item.path] = item.message
      }
    })

    setFieldErrors(nextErrors)
  }

  const toggleCategory = (id) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
    clearError('categoryIds')
  }

  const handleImageChange = (slotIndex, file) => {
    setImageSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = file ? { type: 'file', value: file } : null
      return next
    })
    clearError('images')
  }

  const removeImage = (slotIndex) => {
    setImageSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
    clearError('images')
  }

  const addSpecificationRow = () => {
    if (specificationFields.length >= 50) {
      toast.error('Tối đa 50 thông số kỹ thuật')
      return
    }

    append(createEmptySpecification())
    clearError('specifications')
  }

  const removeSpecificationRow = (index) => {
    if (specificationFields.length <= 1) {
      replace([createEmptySpecification()])
      clearError('specifications')
      return
    }

    remove(index)
    clearError('specifications')
  }

  const parseBulkSpecifications = (pasteData) => {
    const rows = String(pasteData || '').split(/\r?\n/)
    return rows
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => {
        const match = row.match(/^([^=:\t]+)[=:\t](.*)$/)
        if (!match) return null
        return {
          key: match[1].trim(),
          value: match[2].trim()
        }
      })
      .filter((item) => item && item.key && item.value)
  }

  const handleSpecificationPaste = (event) => {
    const pasteData = event.clipboardData.getData('text')
    const isBulkData = pasteData.includes('\n') || pasteData.includes('=') || pasteData.includes(':') || pasteData.includes('\t')

    if (!isBulkData) {
      return
    }

    const parsedRows = parseBulkSpecifications(pasteData)
    if (parsedRows.length === 0) {
      return
    }

    event.preventDefault()
    clearError('specifications')

    const currentSpecs = getValues('specifications') || []
    const hasOnlyEmptySpecification = currentSpecs.length === 1
      && !String(currentSpecs[0]?.key || '').trim()
      && !String(currentSpecs[0]?.value || '').trim()

    if (hasOnlyEmptySpecification) {
      replace(parsedRows.slice(0, 50))
      if (parsedRows.length > 50) {
        toast.error('Chỉ dán tối đa 50 thông số kỹ thuật')
      }
      return
    }

    const remainingSlots = Math.max(0, 50 - currentSpecs.length)
    if (remainingSlots === 0) {
      toast.error('Đã đạt tối đa 50 thông số kỹ thuật')
      return
    }

    append(parsedRows.slice(0, remainingSlots))
    if (parsedRows.length > remainingSlots) {
      toast.error('Chỉ dán tối đa 50 thông số kỹ thuật')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldErrors({})

    if (categories.length === 0) {
      toast.error(mode === 'edit' ? 'Bạn cần tạo danh mục trước khi cập nhật sản phẩm' : 'Bạn cần tạo danh mục trước khi thêm sản phẩm')
      return
    }

    if (categoryIds.length === 0) {
      setFieldErrors({ categoryIds: 'Vui lòng chọn ít nhất một danh mục' })
      return
    }

    const specificationValues = getValues('specifications') || []
    const hasIncompleteSpecification = specificationValues.some((item) => {
      const hasKey = String(item?.key || '').trim() !== ''
      const hasValue = String(item?.value || '').trim() !== ''
      return hasKey !== hasValue
    })

    if (hasIncompleteSpecification) {
      setFieldErrors({ specifications: 'Mỗi dòng thông số cần nhập đủ cả tên và giá trị' })
      return
    }

    const normalizedSpecifications = specificationValues
      .map((item) => ({
        key: String(item?.key || '').trim(),
        value: String(item?.value || '').trim()
      }))
      .filter((item) => item.key && item.value)

    const existingImages = imageSlots
      .filter((slot) => slot?.type === 'url')
      .map((slot) => slot.value)

    const newImageFiles = imageSlots
      .filter((slot) => slot?.type === 'file')
      .map((slot) => slot.value)

    if (mode === 'create' && newImageFiles.length === 0) {
      setFieldErrors({ images: 'Vui lòng chọn ít nhất một ảnh sản phẩm' })
      return
    }

    if (mode === 'edit' && existingImages.length + newImageFiles.length === 0) {
      setFieldErrors({ images: 'Sản phẩm cần ít nhất một ảnh' })
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      detailedDescription,
      specifications: normalizedSpecifications,
      categoryIds,
      price: getNumericString(price),
      offerPrice: getNumericString(offerPrice),
      stock: String(Math.max(0, Number(stock || 0))),
      existingImages,
      newImageFiles
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      const apiErrors = error?.response?.data?.errors
      setApiErrors(apiErrors)
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  return (
    <div className="md:p-8 p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,680px)_minmax(320px,1fr)] gap-6 items-start">
      <form onSubmit={handleSubmit} className="space-y-6 w-full rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">{mode === 'edit' ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <p className="text-sm text-gray-500">Nhập thông tin bên trái, khung preview bên phải sẽ cập nhật ngay.</p>
        </div>

        <div>
          <p className="text-base font-medium">Hình ảnh sản phẩm</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="relative">
                <label htmlFor={`image-${mode}-${index}`}>
                  <input
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0]
                      handleImageChange(index, selectedFile)
                    }}
                    onClick={(e) => {
                      e.target.value = ''
                    }}
                    type="file"
                    id={`image-${mode}-${index}`}
                    hidden
                  />
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
                      removeImage(index)
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
          {fieldErrors.images && <p className="text-xs text-red-500 mt-2">{fieldErrors.images}</p>}
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
            onChange={(e) => {
              setName(e.target.value)
              clearError('name')
            }}
            value={name}
            required
          />
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label className="text-base font-medium" htmlFor="product-description">
            Mô tả sản phẩm
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Nhập tại đây"
            onChange={(e) => {
              setDescription(e.target.value)
              clearError('description')
            }}
            value={description}
            required
          />
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
            {specificationFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)_90px] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Tên thông số"
                  className="outline-none py-2 px-3 rounded border border-gray-300"
                  {...register(`specifications.${index}.key`)}
                  onPaste={handleSpecificationPaste}
                />
                <input
                  type="text"
                  placeholder="Giá trị"
                  className="outline-none py-2 px-3 rounded border border-gray-300"
                  {...register(`specifications.${index}.value`)}
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
              onChange={(e) => {
                setPrice(getNumericString(e.target.value))
                clearError('price')
              }}
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
              onChange={(e) => {
                setOfferPrice(getNumericString(e.target.value))
                clearError('offerPrice')
              }}
              value={formatThousandsInput(offerPrice)}
              required
            />
            {fieldErrors.offerPrice && <p className="text-xs text-red-500">{fieldErrors.offerPrice}</p>}
          </div>
        </div>

        {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        {fieldErrors.description && <p className="text-xs text-red-500">{fieldErrors.description}</p>}

        <button
          disabled={submitting}
          type="submit"
          className={`px-8 py-2.5 text-white font-medium rounded-lg ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
        >
          {submitting ? submittingLabel : submitLabel}
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
                <p className="text-2xl font-bold text-gray-900">{formatVnd(numericOfferPrice)} VND</p>
                <p className="text-sm text-gray-400 line-through">{formatVnd(numericPrice)} VND</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stockNumber <= 0 ? 'bg-red-100 text-red-700' : stockNumber <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {stockStatus}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default ProductForm
