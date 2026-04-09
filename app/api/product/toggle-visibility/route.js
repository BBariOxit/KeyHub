import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

const toggleVisibilitySchema = z.object({
  productId: objectIdSchema,
  isVisible: z.boolean().optional(),
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để thực hiện thao tác này." }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 });
    }

    const body = await req.json();
    const validation = toggleVisibilitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu không hợp lệ.",
          errors: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { productId, isVisible } = validation.data;

    const product = await Product.findOne({ _id: productId, userId }).select("_id isVisible").lean();

    if (!product) {
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm." }, { status: 404 });
    }

    const nextVisibility = typeof isVisible === "boolean" ? isVisible : !Boolean(product.isVisible);

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, userId },
      { $set: { isVisible: nextVisibility } },
      { new: true }
    )
      .select("_id isVisible")
      .lean();

    return NextResponse.json({
      success: true,
      message: nextVisibility ? "Đã hiển thị sản phẩm." : "Đã ẩn sản phẩm.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Toggle visibility error:", error);
    return NextResponse.json({ success: false, message: "Không thể cập nhật trạng thái hiển thị." }, { status: 500 });
  }
}
