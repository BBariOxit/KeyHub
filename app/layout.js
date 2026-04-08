import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/User";

const beVietnamPro = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ["400", "500", "600", "700"] })

export const metadata = {
  title: "Keyhub",
  description: "E-Commerce with Next.js ",
  icons: {
    icon: "/icon.svg?v=1",
    shortcut: "/icon.svg?v=1",
    apple: "/icon.svg?v=1",
  },
};

async function getInitialFavoriteIds() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    await connectDB();
    const user = await User.findById(userId, { favorites: 1 }).lean();

    return Array.isArray(user?.favorites)
      ? user.favorites.map((id) => String(id)).filter(Boolean)
      : [];
  } catch (error) {
    console.error("Initial favorites prefetch error:", error);
    return [];
  }
}

export default async function RootLayout({ children }) {
  const initialFavoriteIds = await getInitialFavoriteIds();

  return (
    <ClerkProvider>
      <html lang="vi">
        <body className={`${beVietnamPro.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider initialFavoriteIds={initialFavoriteIds}>
            {children}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
