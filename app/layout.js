import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

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

export default function RootLayout({ children }) {
  return (
      <html lang="vi">
        <body className={`${beVietnamPro.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
  );
}
