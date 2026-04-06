import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Supplier from "@/models/Supplier";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const revalidate = 0;

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

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const status = searchParams.get("status");

    let query = { status: "active" };
    if (includeInactive || status === "all") {
      query = {};
    } else if (status === "inactive") {
      query = { status: "inactive" };
    }

    const suppliers = await Supplier.find(
      query,
      { name: 1, phone: 1, email: 1, address: 1, taxCode: 1, status: 1, note: 1 }
    )
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, suppliers });
  } catch (error) {
    console.error("Supplier list error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách nhà cung cấp." },
      { status: 500 }
    );
  }
}