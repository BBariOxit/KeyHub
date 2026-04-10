import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Category from "@/models/Category";
import { getAuth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import z from "zod";

const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục quá ngắn").max(80, "Tên danh mục quá dài"),
  slug: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(2, "Slug quá ngắn").max(120, "Slug quá dài").optional()
  ),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(500, "Mô tả quá dài").optional()
  )
});

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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
    const validation = categoryCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu danh mục không hợp lệ.",
          errors: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { name, description } = validation.data;
    const generatedSlug = slugify(validation.data.slug || name);

    if (!generatedSlug) {
      return NextResponse.json(
        { success: false, message: "Không thể tạo slug hợp lệ cho danh mục." },
        { status: 400 }
      );
    }

    const existed = await Category.findOne({ $or: [{ name }, { slug: generatedSlug }] })
      .select("_id")
      .lean();

    if (existed) {
      return NextResponse.json(
        { success: false, message: "Danh mục đã tồn tại." },
        { status: 409 }
      );
    }

    const category = await Category.create({
      name,
      slug: generatedSlug,
      description: description || ""
    });

    revalidatePath("/api/category/list");
    revalidatePath("/seller/categories");
    revalidatePath("/seller");

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Category add error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo danh mục mới." },
      { status: 500 }
    );
  }
}
