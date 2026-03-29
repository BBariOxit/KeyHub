"use client"
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const sliderData = [
  {
    id: 1,
    title: "Bàn phím cơ RGB - Tăng tốc mọi trận đấu",
    offer: "Ưu đãi giới hạn giảm đến 30%",
    buttonText1: "Mua ngay",
    buttonText2: "Xem thêm",
    imgSrc: assets.products_1,
  },
  {
    id: 2,
    title: "Thiết kế gọn gàng, hiệu năng ổn định cho mọi setup",
    offer: "Số lượng có hạn",
    buttonText1: "Mua ngay",
    buttonText2: "Khám phá",
    imgSrc: assets.products_7,
  },
  {
    id: 3,
    title: "Cảm giác gõ cao cấp cho game thủ và dân văn phòng",
    offer: "Giảm thêm 10% hôm nay",
    buttonText1: "Đặt ngay",
    buttonText2: "Tìm hiểu",
    imgSrc: assets.products_10,
  },
];

const HeaderSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="overflow-hidden relative w-full">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between bg-[#E6E9F2] py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full"
          >
            <div className="md:pl-8 mt-10 md:mt-0 md:flex-1">
              <p className="md:text-base text-orange-600 pb-1">{slide.offer}</p>
              <h1 className="max-w-xl md:max-w-[42rem] md:text-[40px] md:leading-[48px] text-2xl font-semibold">
                {slide.title}
              </h1>
              <div className="flex items-center mt-4 md:mt-6 ">
                <button className="md:px-10 px-7 md:py-2.5 py-2 bg-orange-600 rounded-full text-white font-medium">
                  {slide.buttonText1}
                </button>
                <button className="group flex items-center gap-2 px-6 py-2.5 font-medium">
                  {slide.buttonText2}
                  <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon} alt="arrow_icon" />
                </button>
              </div>
            </div>
            <div className="flex items-center flex-1 justify-center md:justify-end md:pr-6 w-full md:w-auto">
              <Image
                className="w-[260px] md:w-[420px] lg:w-[500px] h-[140px] md:h-[220px] lg:h-[260px] object-contain"
                src={slide.imgSrc}
                alt={`Slide ${index + 1}`}
                priority={index === 0}
                sizes="(max-width: 768px) 260px, (max-width: 1024px) 420px, 500px"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => handleSlideChange(index)}
            className={`h-2 w-2 rounded-full cursor-pointer ${
              currentSlide === index ? "bg-orange-600" : "bg-gray-500/30"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
