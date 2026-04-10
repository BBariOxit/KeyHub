"use server";

import { Resend } from "resend";
import { z } from "zod";
import ContactEmail from "./ContactEmail";

const normalizeEnv = (value) =>
  typeof value === "string"
    ? value.trim().replace(/^['\"]|['\"]$/g, "")
    : "";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(5).max(1200),
});

export async function sendContactEmail(payload) {
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Thông tin liên hệ không hợp lệ.",
    };
  }

  const resendApiKey = normalizeEnv(process.env.RESEND_API_KEY);
  const senderEmail = normalizeEnv(process.env.RESEND_FROM_EMAIL);
  const receiverEmail = normalizeEnv(process.env.CONTACT_RECEIVER_EMAIL) || senderEmail;

  if (!resendApiKey || !senderEmail || !receiverEmail) {
    return {
      success: false,
      message: "Email server chưa được cấu hình đầy đủ.",
    };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { name, email, message } = parsed.data;

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [receiverEmail],
      replyTo: email,
      subject: `[KeyHub] Liên hệ mới từ ${name}`,
      react: ContactEmail({ name, email, message }),
    });

    if (error) {
      console.error("Resend API error:", error);
      return {
        success: false,
        message: error.message || "Resend từ chối gửi email. Vui lòng kiểm tra domain/email gửi.",
      };
    }

    return {
      success: true,
      message: "Đã gửi tin nhắn thành công. KeyHub sẽ phản hồi sớm.",
    };
  } catch (error) {
    console.error("Contact email send error:", error);
    return {
      success: false,
      message: "Gửi liên hệ thất bại. Vui lòng thử lại sau.",
    };
  }
}
