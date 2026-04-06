'use client'
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

const supplierSchema = z.object({
  name: z.string().trim().min(2, "Tên nhà cung cấp quá ngắn").max(120, "Tên nhà cung cấp quá dài"),
  phone: z.string().trim().min(6, "Số điện thoại không hợp lệ").max(30, "Số điện thoại quá dài"),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Email không hợp lệ").max(160, "Email quá dài").optional()
  ),
  address: z.string().trim().min(5, "Địa chỉ quá ngắn").max(300, "Địa chỉ quá dài"),
  taxCode: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(60, "Mã số thuế quá dài").optional()
  ),
  status: z.enum(["active", "inactive"]).default("active"),
  note: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(1000, "Ghi chú quá dài").optional()
  )
});

const SuppliersPage = () => {
  const { getToken, user, suppliers, fetchSuppliers, suppliersLoading } = useAppContext();

  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [status, setStatus] = useState("active");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  const formPayload = useMemo(() => ({
    name,
    phone,
    email,
    address,
    taxCode,
    status,
    note
  }), [name, phone, email, address, taxCode, status, note]);

  const liveValidation = useMemo(() => supplierSchema.safeParse(formPayload), [formPayload]);
  const isFormValid = liveValidation.success;

  useEffect(() => {
    if (user) {
      fetchSuppliers({ silent: false, includeInactive: true });
    }
  }, [user?.id]);

  const supplierStats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((item) => item.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [suppliers]);

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Guard cứng: form invalid thì không được gọi API.
    if (!isFormValid) {
      const nextErrors = {};
      liveValidation.error?.issues?.forEach((issue) => {
        const path = issue.path.join('.');
        if (path && !nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      });
      setErrors(nextErrors);
      toast.error('Vui lòng sửa lỗi trước khi tạo nhà cung cấp');
      return;
    }

    const validation = liveValidation;

    try {
      setSubmitting(true);
      const token = await getToken();

      if (!token) {
        toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại');
        return;
      }

      const { data } = await axios.post('/api/supplier/add', validation.data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Tạo nhà cung cấp thành công');
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setTaxCode('');
        setStatus('active');
        setNote('');
        await fetchSuppliers({ silent: false, includeInactive: true });
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
        toast.error(data.message || 'Không thể tạo nhà cung cấp');
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between bg-gradient-to-b from-orange-50/40 via-white to-white">
      {suppliersLoading && suppliers.length === 0 ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Quản lý nhà cung cấp</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-6xl">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Tổng số</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{supplierStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <p className="text-xs text-emerald-700">Đang hoạt động</p>
              <p className="text-2xl font-semibold text-emerald-700 mt-1">{supplierStats.active}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Ngưng hoạt động</p>
              <p className="text-2xl font-semibold text-gray-700 mt-1">{supplierStats.inactive}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6 max-w-6xl">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-800">Thêm nhà cung cấp</p>
                <p className="text-sm text-gray-500 mt-1">Lưu thông tin NCC để dùng cho phiếu nhập kho.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tên nhà cung cấp</label>
                <input
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                  placeholder="Ví dụ: Công ty ABC"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError('name');
                  }}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input
                    className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError('phone');
                    }}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email (không bắt buộc)</label>
                  <input
                    type="email"
                    className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                    placeholder="contact@abc.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                <input
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearError('address');
                  }}
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Mã số thuế (không bắt buộc)</label>
                  <input
                    className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                    placeholder="0312345678"
                    value={taxCode}
                    onChange={(e) => {
                      setTaxCode(e.target.value);
                      clearError('taxCode');
                    }}
                  />
                  {errors.taxCode && <p className="text-xs text-red-500">{errors.taxCode}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      clearError('status');
                    }}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ghi chú (không bắt buộc)</label>
                <textarea
                  rows={3}
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 resize-none"
                  placeholder="Ghi chú thêm về điều khoản, công nợ, đầu mối liên hệ..."
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    clearError('note');
                  }}
                />
                {errors.note && <p className="text-xs text-red-500">{errors.note}</p>}
              </div>

              <button
                disabled={submitting || !user || !isFormValid}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {submitting ? 'Đang tạo...' : 'Tạo nhà cung cấp'}
              </button>
            </form>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <p className="text-base font-semibold text-gray-800">Danh sách nhà cung cấp</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {suppliers.length} NCC
                </span>
              </div>

              <div className="pt-3 space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {suppliers.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có nhà cung cấp nào.</p>
                )}

                {suppliers.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gray-200 p-4 space-y-2 hover:border-orange-200 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </div>

                    {item.email && (
                      <p className="text-sm text-gray-600">Email: {item.email}</p>
                    )}

                    <p className="text-sm text-gray-600">Địa chỉ: {item.address}</p>

                    {item.taxCode && (
                      <p className="text-sm text-gray-600">MST: {item.taxCode}</p>
                    )}

                    {item.note && (
                      <p className="text-sm text-gray-500 italic">{item.note}</p>
                    )}
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

export default SuppliersPage;