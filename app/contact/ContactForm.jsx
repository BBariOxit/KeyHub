"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { sendContactEmail } from "./actions";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(80, "Tên quá dài"),
  email: z.string().trim().email("Email không hợp lệ").max(120, "Email quá dài"),
  message: z.string().trim().min(5, "Lời nhắn tối thiểu 5 ký tự").max(1200, "Lời nhắn quá dài"),
});

const ContactForm = () => {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await sendContactEmail(values);
      if (result?.success) {
        toast.success(result.message);
        reset();
        return;
      }

      toast.error(result?.message || "Không thể gửi liên hệ");
    });
  });

  const isBusy = isPending || isSubmitting;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Thông tin liên hệ</h2>
        <p className="mt-2 text-gray-600">KeyHub hoạt động online 100%, hỗ trợ nhanh qua các kênh bên dưới.</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-600">support@keyhub.com</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">Hotline</p>
              <p className="text-sm text-gray-600">+84 909 123 456</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-orange-600 mt-1" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Hỗ trợ nhanh</p>
              <p>Zalo: zalo.me/keyhub-support</p>
              <p>Discord: discord.gg/keyhub</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Gửi lời nhắn cho KeyHub</h2>
        <p className="mt-2 text-gray-600">Gửi thắc mắc của bạn, KeyHub sẽ phản hồi trong 24h.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Tên của bạn</label>
            <input
              {...register("name")}
              placeholder="Nhập tên"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-400"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Lời nhắn</label>
            <textarea
              {...register("message")}
              rows={6}
              placeholder="Bạn cần KeyHub hỗ trợ điều gì?"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-400 resize-none"
            />
            {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isBusy ? "Đang gửi..." : "Gửi liên hệ"}
        </button>
      </form>
    </section>
  );
};

export default ContactForm;
