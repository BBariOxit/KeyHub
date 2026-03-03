import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const products = [
  {
    id: 1,
    image: assets.feature_pro_1,
    title: "Gọn gàng, không dây",
    description: "Bàn phím không dây gọn gàng, tối ưu góc làm việc hiện đại.",
  },
  {
    id: 2,
    image: assets.feature_pro_2,
    title: "Bàn phím RGB gaming",
    description: "Hiệu ứng LED nổi bật, phản hồi nhanh cho mọi trận đấu.",
  },
  {
    id: 3,
    image: assets.feature_pro_3,
    title: "Trải nghiệm gõ cao cấp",
    description: "Switch êm, cảm giác gõ chắc tay cho cả game lẫn công việc.",
  },
];

const FeaturedProduct = () => {
  return (
    <div className="mt-14">
      <div className="flex flex-col items-center">
        <p className="text-3xl font-medium">Sản phẩm nổi bật</p>
        <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
        {products.map(({ id, image, title, description }) => (
          <div key={id} className="relative group">
            <Image
              src={image}
              alt={title}
              className="group-hover:brightness-75 transition duration-300 w-full h-[22rem] md:h-[28rem] object-cover"
            />
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 right-8 text-white space-y-2">
              <p className="font-medium text-xl lg:text-2xl">{title}</p>
              <p className="text-sm lg:text-base leading-5 max-w-[22rem]">
                {description}
              </p>
              <button className="flex items-center gap-1.5 bg-orange-600 px-4 py-2 rounded">
                Mua ngay <Image className="h-3 w-3" src={assets.redirect_icon} alt="Redirect Icon" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;
