import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import InventoryReceipt from "@/models/InventoryReceipt";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
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

    await connectDB();

    const receipts = await InventoryReceipt.find({})
      .populate({ path: "items.product", select: "name image" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, receipts, count: receipts.length });
  } catch (error) {
    console.error("Inventory receipt list error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách phiếu nhập." },
      { status: 500 }
    );
  }
}
