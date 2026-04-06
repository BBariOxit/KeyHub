'use client'
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục quá ngắn").max(80, "Tên danh mục quá dài"),
  slug: z.string().trim().min(2, "Slug quá ngắn").max(120, "Slug quá dài").optional().or(z.literal("")),
  description: z.string().trim().max(500, "Mô tả quá dài").optional().or(z.literal(""))
});

const CategoriesPage = () => {
  const { getToken, user } = useAppContext();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/category/list');
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.message || 'Không thể tải danh mục');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const formPreview = useMemo(() => {
    return {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim()
    };
  }, [name, slug, description]);

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

    const validation = categorySchema.safeParse(formPreview);
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
      const { data } = await axios.post('/api/category/add', validation.data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Tạo danh mục thành công');
        setName('');
        setSlug('');
        setDescription('');
        await fetchCategories();
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
        toast.error(data.message || 'Không thể tạo danh mục');
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
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Quản lý danh mục</h2>

          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.3fr] gap-6 max-w-6xl">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div>
                <p className="text-base font-semibold text-gray-800">Tạo danh mục mới</p>
                <p className="text-sm text-gray-500 mt-1">Điền thông tin để thêm danh mục cho sản phẩm.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tên danh mục</label>
                <input
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                  placeholder="Ví dụ: Bàn phím gaming"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError('name');
                  }}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Slug (không bắt buộc)</label>
                <input
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400"
                  placeholder="vi-du-ban-phim-gaming"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    clearError('slug');
                  }}
                />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows={4}
                  className="w-full outline-none px-3 py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 resize-none"
                  placeholder="Mô tả ngắn về danh mục"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError('description');
                  }}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>

              <button
                disabled={submitting || !user}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition ${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {submitting ? 'Đang tạo...' : 'Tạo danh mục'}
              </button>
            </form>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <p className="text-base font-semibold text-gray-800">Danh sách danh mục</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {categories.length} danh mục
                </span>
              </div>

              <div className="pt-3 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có danh mục nào.</p>
                )}
                {categories.map((item) => (
                  <div key={item._id} className="rounded-xl border border-gray-200 p-4 hover:border-orange-200 transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <span className="text-xs text-gray-500">/{item.slug}</span>
                    </div>
                    {item.description ? (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">Không có mô tả</p>
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

export default CategoriesPage;
