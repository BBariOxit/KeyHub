"use client"
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";

const Banner = () => {
  const { products, router } = useAppContext()

  const targetProductId = products?.[0]?._id
  const targetPath = targetProductId ? `/product/${targetProductId}` : '/all-products'

  return (
    <div className="flex flex-col md:flex-row items-center justify-between md:px-12 lg:px-16 py-14 md:py-10 bg-[#E6E9F2] my-16 rounded-xl overflow-hidden">
      <Image
        className="w-full max-w-64 md:max-w-72 lg:max-w-80"
        src={assets.banner_1}
        alt="banner_1"
        sizes="(max-width: 768px) 256px, (max-width: 1024px) 288px, 320px"
        loading="lazy"
      />
      <div className="flex flex-col items-center justify-center text-center space-y-2 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-semibold max-w-[290px]">
          Nâng cấp trải nghiệm chơi game
        </h2>
        <p className="max-w-[343px] font-medium text-gray-800/60">
          Tốc độ phản hồi nhanh, độ chính xác cao - mọi thứ bạn cần để chiến thắng
        </p>
        <button
          type="button"
          onClick={() => router.push(targetPath)}
          className="group flex items-center justify-center gap-1 px-12 py-2.5 bg-orange-600 rounded text-white"
        >
          Mua ngay
          <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon_white} alt="arrow_icon_white" />
        </button>
      </div>
      <Image
        className="hidden md:block w-full max-w-72 lg:max-w-80 md:mr-1"
        src={assets.banner_2}
        alt="banner_2"
        sizes="(max-width: 1024px) 288px, 320px"
        loading="lazy"
      />
    </div>
  );
};

export default Banner;