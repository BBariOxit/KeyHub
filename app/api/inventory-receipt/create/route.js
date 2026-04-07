import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import InventoryReceipt from "@/models/InventoryReceipt";
import Product from "@/models/Product";
import Supplier from "@/models/Supplier";
import { getAuth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");
const idempotencyKeySchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Idempotency key phải là UUID v4 hợp lệ"
  );

const inventoryReceiptCreateSchema = z.object({
  supplier: objectIdSchema,
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
    const idempotencyHeader = req.headers.get("x-idempotency-key");
    const keyValidation = idempotencyKeySchema.safeParse(idempotencyHeader);

    if (!keyValidation.success) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc sai định dạng idempotency key." },
        { status: 400 }
      );
    }

    const idempotencyKey = keyValidation.data;
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

    const { supplier, items, notes } = validation.data;

    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.importPrice, 0);
    const productIds = [...new Set(items.map((item) => item.product))];

    await connectDB();

    const existingReceipt = await InventoryReceipt.findOne({
      enteredBy: userId,
      idempotencyKey
    }).lean();

    if (existingReceipt) {
      return NextResponse.json({
        success: true,
        message: "Phiếu nhập đã được xử lý trước đó.",
        receipt: existingReceipt,
        idempotentReplay: true
      });
    }

    const session = await mongoose.startSession();
    let receipt;

    try {
      await session.withTransaction(async () => {
        const existingInTransaction = await InventoryReceipt.findOne({
          enteredBy: userId,
          idempotencyKey
        })
          .session(session)
          .lean();

        if (existingInTransaction) {
          receipt = existingInTransaction;
          return;
        }

        const products = await Product.find({ _id: { $in: productIds } })
          .select("_id")
          .session(session)
          .lean();

        if (products.length !== productIds.length) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const supplierDoc = await Supplier.findById(supplier)
          .select("_id status")
          .session(session)
          .lean();

        if (!supplierDoc) {
          throw new Error("SUPPLIER_NOT_FOUND");
        }

        if (supplierDoc.status !== "active") {
          throw new Error("SUPPLIER_INACTIVE");
        }

        await Product.bulkWrite(
          items.map((item) => ({
            updateOne: {
              filter: { _id: item.product },
              update: { $inc: { stock: item.quantity } }
            }
          })),
          { session }
        );

        const [createdReceipt] = await InventoryReceipt.create(
          [
            {
              enteredBy: userId,
              idempotencyKey,
              supplier,
              items,
              totalValue,
              notes
            }
          ],
          { session }
        );

        receipt = createdReceipt;
      });
    } catch (error) {
      if (error?.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "Một hoặc nhiều sản phẩm không tồn tại." },
          { status: 400 }
        );
      }

      if (error?.message === "SUPPLIER_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "Nhà cung cấp không tồn tại." },
          { status: 400 }
        );
      }

      if (error?.message === "SUPPLIER_INACTIVE") {
        return NextResponse.json(
          { success: false, message: "Nhà cung cấp đang ở trạng thái ngưng hoạt động." },
          { status: 400 }
        );
      }

      if (error?.code === 11000 && error?.keyPattern?.enteredBy && error?.keyPattern?.idempotencyKey) {
        const duplicated = await InventoryReceipt.findOne({ enteredBy: userId, idempotencyKey }).lean();

        if (duplicated) {
          return NextResponse.json({
            success: true,
            message: "Phiếu nhập đã được xử lý trước đó.",
            receipt: duplicated,
            idempotentReplay: true
          });
        }
      }

      if (
        error?.message?.includes("Transaction numbers are only allowed") ||
        error?.message?.includes("Transaction is not supported")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "MongoDB hiện tại chưa hỗ trợ transaction. Vui lòng dùng replica set để đảm bảo toàn vẹn dữ liệu."
          },
          { status: 500 }
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      message: "Tạo phiếu nhập thành công.",
      receipt,
      idempotentReplay: false
    });
  } catch (error) {
    console.error("Inventory receipt create error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo phiếu nhập kho." },
      { status: 500 }
    );
  }
}
