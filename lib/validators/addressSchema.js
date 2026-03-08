import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên")
    .min(2, "Họ và tên quá ngắn")
    .max(50, "Họ và tên không được vượt quá 50 ký tự"),
  phoneNumber: z.string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(/^\d+$/, "Số điện thoại chỉ được chứa chữ số")
    .length(10, "Số điện thoại phải gồm đúng 10 chữ số"),
  pinCode: z.string()
    .trim()
    .min(1, "Vui lòng nhập mã bưu chính")
    .regex(/^\d+$/, "Mã bưu chính chỉ được chứa chữ số")
    .length(6, "Mã bưu chính phải gồm đúng 6 chữ số"),
  area: z.string()
    .trim()
    .min(1, "Vui lòng nhập địa chỉ chi tiết")
    .min(5, "Địa chỉ chi tiết quá ngắn"),
  city: z.string()
    .trim()
    .min(1, "Vui lòng nhập phường/quận/huyện")
    .min(2, "Phường/Quận/Huyện phải có ít nhất 2 ký tự"),
  state: z.string()
    .trim()
    .min(1, "Vui lòng nhập tỉnh/thành phố")
    .min(2, "Tỉnh/Thành phố phải có ít nhất 2 ký tự"),
});

export const mapZodIssuesToFieldErrors = (issues = []) => {
  const mappedErrors = {};

  issues.forEach((issue) => {
    if (!issue?.message) return;

    let normalizedPath = [];
    if (Array.isArray(issue.path)) {
      normalizedPath = issue.path.filter(Boolean).map((item) => String(item));
    } else if (typeof issue.path === "string") {
      normalizedPath = issue.path.split(".").filter(Boolean);
    }

    const field = normalizedPath[0] === "address" ? normalizedPath[1] : normalizedPath[0];

    if (field && !mappedErrors[field]) {
      mappedErrors[field] = issue.message;
    }
  });

  return mappedErrors;
};
