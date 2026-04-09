import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { cleanupCloudinaryImages } from "@/lib/cloudinaryCleanup";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

const deleteProductSchema = z.object({
  productId: objectIdSchema,
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
    const validation = deleteProductSchema.safeParse(body);

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

    const { productId } = validation.data;

    const hasOrder = await Order.exists({ "items.product": productId });
    if (hasOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Sản phẩm này đã phát sinh đơn hàng. Để bảo toàn dữ liệu đối soát, không thể xóa vĩnh viễn. Vui lòng dùng chức năng Ẩn.",
        },
        { status: 409 }
      );
    }

    const product = await Product.findOneAndDelete({ _id: productId, userId }).lean();

    if (!product) {
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm để xóa." }, { status: 404 });
    }

    const imageList = Array.isArray(product.image) ? product.image : [];
    await cleanupCloudinaryImages(imageList, { errorPrefix: "Cloudinary product cleanup error:" });

    return NextResponse.json({ success: true, message: "Đã xóa sản phẩm vĩnh viễn." });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ success: false, message: "Không thể xóa sản phẩm lúc này." }, { status: 500 });
  }
}
