import connectDB from "@/config/db";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({}, { name: 1, slug: 1, description: 1 })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Category list error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách danh mục." },
      { status: 500 }
    );
  }
}
