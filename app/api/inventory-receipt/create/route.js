import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import InventoryReceipt from "@/models/InventoryReceipt";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

const inventoryReceiptCreateSchema = z.object({
  supplierName: z.string().trim().min(2, "Tên nhà cung cấp quá ngắn").max(120, "Tên nhà cung cấp quá dài"),
  items: z.array(
    z.object({
      product: objectIdSchema,
      quantity: z.coerce.number().int("Số lượng phải là số nguyên").min(1, "Số lượng phải lớn hơn 0"),
      importPrice: z.coerce.number().min(0, "Giá nhập không được âm")
    })
  ).min(1, "Phiếu nhập phải có ít nhất một sản phẩm"),
  notes: z.string().trim().max(1000, "Ghi chú quá dài").optional().default("")
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
    const validation = inventoryReceiptCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu phiếu nhập không hợp lệ.",
          errors: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { supplierName, items, notes } = validation.data;

    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.importPrice, 0);
    const productIds = [...new Set(items.map((item) => item.product))];

    await connectDB();

    const products = await Product.find({ _id: { $in: productIds } }).select("_id").lean();
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, message: "Một hoặc nhiều sản phẩm không tồn tại." },
        { status: 400 }
      );
    }

    await Product.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } }
        }
      }))
    );

    const receipt = await InventoryReceipt.create({
      enteredBy: userId,
      supplierName,
      items,
      totalValue,
      notes
    });

    return NextResponse.json({
      success: true,
      message: "Tạo phiếu nhập thành công.",
      receipt
    });
  } catch (error) {
    console.error("Inventory receipt create error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo phiếu nhập kho." },
      { status: 500 }
    );
  }
}
