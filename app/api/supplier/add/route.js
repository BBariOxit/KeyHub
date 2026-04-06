import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Supplier from "@/models/Supplier";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const supplierCreateSchema = z.object({
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
  status: z.enum(["active", "inactive"]).optional().default("active"),
  note: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(1000, "Ghi chú quá dài").optional()
  )
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để thực hiện thao tác này." },
        { status: 401 }
      );
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = supplierCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu nhà cung cấp không hợp lệ.",
          errors: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { name, phone, email, address, taxCode, status, note } = validation.data;

    const existed = await Supplier.findOne({ name }).select("_id").lean();
    if (existed) {
      return NextResponse.json(
        { success: false, message: "Nhà cung cấp đã tồn tại." },
        { status: 409 }
      );
    }

    const supplier = await Supplier.create({
      name,
      phone,
      email,
      address,
      taxCode,
      status,
      note: note || ""
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Supplier add error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo nhà cung cấp mới." },
      { status: 500 }
    );
  }
}