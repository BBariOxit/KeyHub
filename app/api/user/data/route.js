import connectDB from "@/config/db";
import User from "@/models/User";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    let user = await User.findById(userId)

    if (!user) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      const firstName = clerkUser.firstName || ''
      const lastName = clerkUser.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim() || clerkUser.username || 'User'
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''

      user = await User.create({
        _id: userId,
        name: fullName,
        email,
        imageUrl: clerkUser.imageUrl || ''
      })
    }
    return NextResponse.json({ success: true, user })
  } catch (error) {
      return NextResponse.json({ success: false, message: error.message })
  }
}