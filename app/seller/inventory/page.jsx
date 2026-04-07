'use client'
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { formatThousandsInput, formatVnd, getNumericString } from "@/lib/price";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

const receiptSchema = z.object({
  supplier: objectIdSchema,
  items: z.array(
    z.object({
      product: objectIdSchema,
      quantity: z.coerce.number().int("Số lượng phải là số nguyên").min(1, "Số lượng phải lớn hơn 0"),
      importPrice: z.coerce.number().min(0, "Giá nhập không được âm")
    })
  ).min(1, "Phiếu nhập phải có ít nhất một sản phẩm"),
  notes: z.string().trim().max(1000, "Ghi chú quá dài").optional().or(z.literal(""))
});

const createEmptyItem = () => ({
  product: '',
  quantity: 1,
  importPrice: '0'
});

const InventoryPage = () => {
  const {
    getToken,
    user,
    fetchProductData,
    sellerProducts,
    fetchSellerProducts,
    sellerProductsLoading,
    suppliers,
    fetchSuppliers,
    suppliersLoading,
    inventoryReceipts,
    fetchInventoryReceipts,
    inventoryReceiptsLoading
  } = useAppContext();

  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef('');

  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([createEmptyItem()]);
  const [errors, setErrors] = useState({});

  const resetIdempotencyKey = () => {
    idempotencyKeyRef.current = '';
  };

  const getOrCreateIdempotencyKey = () => {
    if (idempotencyKeyRef.current) {
      return idempotencyKeyRef.current;
    }

    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
      throw new Error('Trình duyệt không hỗ trợ crypto.randomUUID');
    }

    const generated = crypto.randomUUID();

    idempotencyKeyRef.current = generated;
    return generated;
  };

  useEffect(() => {
    if (user?.id) {
      fetchSellerProducts({ silent: false });
      fetchSuppliers({ silent: false });
      fetchInventoryReceipts({ silent: false });
    }
  }, [user?.id, fetchSellerProducts, fetchSuppliers, fetchInventoryReceipts]);

  useEffect(() => {
    if (sellerProducts.length > 0) {
      setItems((prev) => prev.map((item) => ({ ...item, product: item.product || sellerProducts[0]._id })));
    }
  }, [sellerProducts]);

  useEffect(() => {
    if (!supplier && suppliers.length > 0) {
      setSupplier(suppliers[0]._id);
    }
  }, [supplier, suppliers]);

  const products = sellerProducts;
  const supplierOptions = suppliers;
  const receipts = inventoryReceipts;
  const loading = sellerProductsLoading || suppliersLoading || inventoryReceiptsLoading;

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const importPrice = Number(getNumericString(item.importPrice || '0')) || 0;
      return sum + (quantity * importPrice);
    }, 0);
  }, [items]);

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
    resetIdempotencyKey();
    clearError(`items.${index}.${key}`);
    clearError('items');
  };

  const addItem = () => {
    if (products.length === 0) {
      toast.error('Chưa có sản phẩm để nhập kho');
      return;
    }

    setItems((prev) => [...prev, {
      ...createEmptyItem(),
      product: products[0]?._id || ''
    }]);
    resetIdempotencyKey();
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    resetIdempotencyKey();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) {
      return;
    }
    setErrors({});

    const payload = {
      supplier,
      notes,
      items: items.map((item) => ({
        product: item.product,
        quantity: Number(item.quantity),
        importPrice: Number(getNumericString(item.importPrice || '0'))
      }))
    };

    const validation = receiptSchema.safeParse(payload);
    if (!validation.success) {
      const nextErrors = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (path && !nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const idempotencyKey = getOrCreateIdempotencyKey();
      const { data } = await axios.post('/api/inventory-receipt/create', validation.data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-idempotency-key': idempotencyKey
        }
      });

      if (data.success) {
        toast.success(data.idempotentReplay ? 'Yêu cầu đã được xử lý trước đó' : 'Tạo phiếu nhập thành công');
        setSupplier(supplierOptions[0]?._id || '');
        setNotes('');
        setItems([{ ...createEmptyItem(), product: products[0]?._id || '' }]);
        setErrors({});
        resetIdempotencyKey();
        await Promise.all([
          fetchSellerProducts({ silent: false }),
          fetchSuppliers({ silent: true }),
          fetchInventoryReceipts({ silent: false }),
          fetchProductData()
        ]);
      } else {
        if (Array.isArray(data.errors)) {
          const nextErrors = {};
          data.errors.forEach((item) => {
            if (item?.path && !nextErrors[item.path]) {
              nextErrors[item.path] = item.message;
            }
          });
          setErrors(nextErrors);
        }
        toast.error(data.message || 'Không thể tạo phiếu nhập');
        resetIdempotencyKey();
      }
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const nextErrors = {};
        apiErrors.forEach((item) => {
          if (item?.path && !nextErrors[item.path]) {
            nextErrors[item.path] = item.message;
          }
        });
        setErrors(nextErrors);
      }
      toast.error(error.response?.data?.message || error.message);
      const errorStatus = error.response?.status;
      if (errorStatus && errorStatus < 500) {
        resetIdempotencyKey();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between bg-gradient-to-b from-orange-50/40 via-white to-white">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Nhập kho</h2>

          <div className="grid grid-cols-1 2xl:grid-cols-[1.25fr_1fr] gap-6 max-w-7xl">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-800">Tạo phiếu nhập kho</p>
                <p className="text-sm text-gray-500 mt-1">Nhập sản phẩm và giá vốn để cập nhật tồn kho tự động.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nhà cung cấp</label>
                  <select
                    className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                    value={supplier}
                    onChange={(e) => {
                      setSupplier(e.target.value);
                      resetIdempotencyKey();
                      clearError('supplier');
                    }}
                    disabled={supplierOptions.length === 0}
                  >
                    {supplierOptions.length === 0 && <option value="">Chưa có nhà cung cấp</option>}
                    {supplierOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplier && <p className="text-xs text-red-500">{errors.supplier}</p>}
                  {supplierOptions.length === 0 && (
                    <p className="text-xs text-amber-600">Chưa có nhà cung cấp nào đang hoạt động. Vui lòng tạo nhà cung cấp trước.</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tổng giá trị tạm tính</label>
                  <div className="px-3 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold">
                    {formatVnd(totalValue)} VND
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Danh sách sản phẩm</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
                {products.length === 0 && (
                  <p className="text-xs text-amber-600">Chưa có sản phẩm nào. Vui lòng thêm sản phẩm trước khi tạo phiếu nhập.</p>
                )}

                <div className="hidden md:grid md:grid-cols-[1.5fr_0.65fr_0.85fr_auto] gap-2 px-2 text-xs font-semibold text-gray-500">
                  <p>Sản phẩm</p>
                  <p>Số lượng</p>
                  <p>Giá nhập</p>
                  <p className="text-center">Thao tác</p>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={`item-${index}`} className="grid grid-cols-1 md:grid-cols-[1.5fr_0.65fr_0.85fr_auto] gap-2 p-3 border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 md:hidden">Sản phẩm</p>
                        <select
                          className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                          value={item.product}
                          onChange={(e) => updateItem(index, 'product', e.target.value)}
                          disabled={products.length === 0}
                        >
                          {products.length === 0 && <option value="">Chưa có sản phẩm</option>}
                          {products.map((product) => (
                            <option value={product._id} key={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {errors[`items.${index}.product`] && <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.product`]}</p>}
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1 md:hidden">Số lượng</p>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            className="w-full outline-none pl-3 pr-10 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="SL"
                          />
                          <div className="absolute right-1.5 top-1.5 bottom-1.5 w-6 rounded-md border border-gray-200 overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'quantity', Number(item.quantity || 0) + 1)}
                              className="h-1/2 w-full flex items-center justify-center hover:bg-gray-100 border-b border-gray-200"
                              aria-label="Tăng số lượng"
                            >
                              <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-b-[6px] border-b-gray-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'quantity', Math.max(1, Number(item.quantity || 1) - 1))}
                              className="h-1/2 w-full flex items-center justify-center hover:bg-gray-100"
                              aria-label="Giảm số lượng"
                            >
                              <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-t-[6px] border-t-gray-500" />
                            </button>
                          </div>
                        </div>
                        {errors[`items.${index}.quantity`] && <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.quantity`]}</p>}
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1 md:hidden">Giá nhập</p>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                          value={formatThousandsInput(item.importPrice || '0')}
                          onChange={(e) => updateItem(index, 'importPrice', getNumericString(e.target.value))}
                          placeholder="Giá nhập"
                        />
                        {errors[`items.${index}.importPrice`] && <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.importPrice`]}</p>}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  rows={3}
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 resize-none"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    resetIdempotencyKey();
                    clearError('notes');
                  }}
                  placeholder="Ghi chú thêm nếu cần"
                />
                {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
              </div>

              <button
                disabled={submitting || products.length === 0 || supplierOptions.length === 0}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {submitting ? 'Đang lưu phiếu...' : 'Lưu phiếu nhập'}
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <p className="text-base font-semibold text-gray-800">Lịch sử nhập kho</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">{receipts.length} phiếu</span>
              </div>

              <div className="pt-3 space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {receipts.length === 0 && <p className="text-sm text-gray-500">Chưa có phiếu nhập nào.</p>}
                {receipts.map((receipt) => (
                  <div key={receipt._id} className="rounded-xl border border-gray-200 p-4 space-y-2 hover:border-orange-200 transition">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 truncate">{receipt.supplier?.name || 'Nhà cung cấp'}</p>
                      <span className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {receipt.items?.length || 0} sản phẩm • Tổng: <span className="font-semibold text-emerald-700">{formatVnd(receipt.totalValue || 0)} VND</span>
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {(receipt.items || []).slice(0, 3).map((item, idx) => (
                        <p key={`${receipt._id}-${idx}`}>• {item.product?.name || 'Sản phẩm'} x {item.quantity}</p>
                      ))}
                      {(receipt.items?.length || 0) > 3 && <p>...và thêm {(receipt.items?.length || 0) - 3} sản phẩm</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default InventoryPage;
