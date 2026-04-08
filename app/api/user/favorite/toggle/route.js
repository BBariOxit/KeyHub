import connectDB from "@/config/db";
import User from "@/models/User";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function ensureUser(userId) {
  let user = await User.findById(userId);

  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || clerkUser.username || "User";
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

    user = await User.create({
      _id: userId,
      name: fullName,
      email,
      imageUrl: clerkUser.imageUrl || ""
    });
  }

  return user;
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
    }

    await connectDB();
    const user = await ensureUser(userId);

    const favoriteIds = Array.isArray(user.favorites) ? user.favorites : [];
    const alreadyFavorited = favoriteIds.includes(productId);

    const updateOperation = alreadyFavorited
      ? { $pull: { favorites: productId } }
      : { $addToSet: { favorites: productId } };

    await User.findByIdAndUpdate(userId, updateOperation, { new: true });
    const refreshedUser = await User.findById(userId).select('favorites').lean();
    const updatedFavorites = Array.isArray(refreshedUser?.favorites)
      ? refreshedUser.favorites.map((id) => String(id)).filter(Boolean)
      : [];

    return NextResponse.json({
      success: true,
      isFavorite: !alreadyFavorited,
      favorites: updatedFavorites,
      message: !alreadyFavorited ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích"
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật yêu thích." },
      { status: 500 }
    );
  }
}
