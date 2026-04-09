import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import z from "zod";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

const normalizeSpecificationsInput = (value) => {
  if (value == null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (parsed && typeof parsed === "object") {
        return Object.entries(parsed).map(([key, val]) => ({
          key,
          value: val == null ? "" : String(val),
        }));
      }
    } catch {
      return value;
    }
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, val]) => ({
      key,
      value: val == null ? "" : String(val),
    }));
  }

  return value;
};

const specificationSchema = z.object({
  key: z.string().trim().min(1, "Tên thông số không được để trống").max(80, "Tên thông số quá dài"),
  value: z.string().trim().min(1, "Giá trị thông số không được để trống").max(300, "Giá trị thông số quá dài"),
});

const normalizeImageListInput = (value) => {
  if (value == null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [value];
    }
    return [value];
  }

  return value;
};

const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const uploadImageToCloudinary = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    stream.end(buffer);
  });
};

const productUpdateSchema = z
  .object({
    productId: objectIdSchema,
    name: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.string().trim().min(2, "Tên sản phẩm quá ngắn").max(120, "Tên sản phẩm quá dài").optional()
    ),
    description: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.string().trim().min(5, "Mô tả quá ngắn").max(2000, "Mô tả quá dài").optional()
    ),
    detailedDescription: z.preprocess(
      (value) => (value == null ? undefined : value),
      z.string().max(40000, "Mô tả chi tiết quá dài").optional()
    ),
    specifications: z.preprocess(
      normalizeSpecificationsInput,
      z.array(specificationSchema).max(50, "Tối đa 50 thông số kỹ thuật").optional()
    ),
    categoryIds: z.preprocess(
      (value) => {
        if (Array.isArray(value)) {
          const sanitized = value.filter((item) => item != null && String(item).trim() !== "");
          return sanitized.length > 0 ? sanitized : undefined;
        }
        if (value == null || value === "") {
          return undefined;
        }
        return [value];
      },
      z.array(objectIdSchema).optional()
    ),
    categoryId: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      objectIdSchema.optional()
    ),
    category: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.string().trim().min(2, "Danh mục không hợp lệ").max(80, "Danh mục quá dài").optional()
    ),
    price: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.coerce.number().positive("Giá phải lớn hơn 0").optional()
    ),
    offerPrice: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.coerce.number().positive("Giá bán phải lớn hơn 0").optional()
    ),
    stock: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.coerce.number().int("Tồn kho phải là số nguyên").min(0, "Tồn kho không được âm").optional()
    ),
    existingImages: z.preprocess(
      normalizeImageListInput,
      z.array(z.string().trim().min(1, "Ảnh không hợp lệ").max(2000, "Đường dẫn ảnh quá dài")).optional()
    ),
  })
  .superRefine((data, ctx) => {
    const hasUpdatableField = [
      "name",
      "description",
      "detailedDescription",
      "specifications",
      "categoryIds",
      "categoryId",
      "category",
      "price",
      "offerPrice",
      "stock",
      "existingImages",
    ].some((field) => Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined);

    if (!hasUpdatableField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Không có dữ liệu cập nhật",
      });
    }
  });

const parseRequestPayload = async (req) => {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    return {
      productId: formData.get("productId"),
      name: formData.get("name"),
      description: formData.get("description"),
      detailedDescription: formData.get("detailedDescription"),
      specifications: formData.get("specifications"),
      categoryIds: formData.getAll("categoryIds"),
      categoryId: formData.get("categoryId"),
      category: formData.get("category"),
      price: formData.get("price"),
      offerPrice: formData.get("offerPrice"),
      stock: formData.get("stock"),
      existingImages: formData.getAll("existingImages"),
      images: formData.getAll("images"),
    };
  }

  const body = await req.json();
  return {
    productId: body?.productId,
    name: body?.name,
    description: body?.description,
    detailedDescription: body?.detailedDescription,
    specifications: body?.specifications,
    categoryIds: body?.categoryIds,
    categoryId: body?.categoryId,
    category: body?.category,
    price: body?.price,
    offerPrice: body?.offerPrice,
    stock: body?.stock,
    existingImages: body?.existingImages,
    images: body?.images,
  };
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

    const payload = await parseRequestPayload(req);
    const validation = productUpdateSchema.safeParse(payload);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu cập nhật không hợp lệ.",
          errors: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const {
      productId,
      name,
      description,
      detailedDescription,
      specifications,
      categoryIds,
      categoryId,
      category,
      price,
      offerPrice,
      stock,
      existingImages,
    } = validation.data;

    const existingProduct = await Product.findOne({ _id: productId, userId }).select("price offerPrice").lean();
    if (!existingProduct) {
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm để cập nhật." }, { status: 404 });
    }

    const updatePayload = {};

    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (detailedDescription !== undefined) updatePayload.detailedDescription = detailedDescription;
    if (specifications !== undefined) updatePayload.specifications = specifications;
    if (stock !== undefined) updatePayload.stock = stock;
    if (price !== undefined) updatePayload.price = price;
    if (offerPrice !== undefined) updatePayload.offerPrice = offerPrice;

    const nextExistingImages = Array.isArray(existingImages) ? existingImages : undefined;
    const incomingImageFiles = Array.isArray(payload.images)
      ? payload.images.filter((file) => file && typeof file.arrayBuffer === "function" && file.size > 0)
      : [];

    const hasOversizedImage = incomingImageFiles.some((file) => Number(file.size || 0) > MAX_IMAGE_FILE_SIZE_BYTES);
    if (hasOversizedImage) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu cập nhật không hợp lệ.",
          errors: [{ path: "images", message: "Mỗi ảnh phải nhỏ hơn hoặc bằng 10MB" }],
        },
        { status: 400 }
      );
    }

    if (nextExistingImages !== undefined || incomingImageFiles.length > 0) {
      const uploadedImages = [];

      for (const file of incomingImageFiles) {
        const secureUrl = await uploadImageToCloudinary(file);
        if (secureUrl) {
          uploadedImages.push(secureUrl);
        }
      }

      const nextImages = [
        ...(nextExistingImages || []),
        ...uploadedImages.filter(Boolean),
      ];

      if (nextImages.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Dữ liệu cập nhật không hợp lệ.",
            errors: [{ path: "images", message: "Sản phẩm cần ít nhất một ảnh" }],
          },
          { status: 400 }
        );
      }

      updatePayload.image = nextImages;
    }

    const nextPrice = price !== undefined ? price : existingProduct.price;
    const nextOfferPrice = offerPrice !== undefined ? offerPrice : existingProduct.offerPrice;

    if (nextOfferPrice > nextPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu cập nhật không hợp lệ.",
          errors: [{ path: "offerPrice", message: "Giá bán không được lớn hơn giá gốc" }],
        },
        { status: 400 }
      );
    }

    const hasCategoryUpdate = categoryIds !== undefined || categoryId !== undefined || category !== undefined;

    if (hasCategoryUpdate) {
      const resolvedCategoryIds = [...new Set([...(categoryIds || []), ...(categoryId ? [categoryId] : [])])];
      let categoryDocs = [];

      if (resolvedCategoryIds.length > 0) {
        categoryDocs = await Category.find({ _id: { $in: resolvedCategoryIds } }).select("_id name").lean();

        if (categoryDocs.length !== resolvedCategoryIds.length) {
          return NextResponse.json({ success: false, message: "Một hoặc nhiều danh mục không tồn tại." }, { status: 400 });
        }
      } else if (category) {
        const fallbackCategory = await Category.findOne({ name: category }).select("_id name").lean();
        if (!fallbackCategory) {
          return NextResponse.json({ success: false, message: "Danh mục không tồn tại." }, { status: 400 });
        }
        categoryDocs = [fallbackCategory];
      }

      if (categoryDocs.length === 0) {
        return NextResponse.json({ success: false, message: "Vui lòng chọn ít nhất một danh mục." }, { status: 400 });
      }

      if (Product.schema.path("categoryIds")) {
        updatePayload.categoryIds = categoryDocs.map((item) => item._id);
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, userId },
      { $set: updatePayload },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, message: "Cập nhật sản phẩm thành công.", product: updatedProduct });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ success: false, message: "Không thể cập nhật sản phẩm." }, { status: 500 });
  }
}
