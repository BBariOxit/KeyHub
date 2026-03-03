import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#f0f1f2]">
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
          <p className="mt-6 text-sm">
            KeyHub mang đến các dòng bàn phím cơ được tuyển chọn kỹ lưỡng, từ
            gaming hiệu năng cao đến setup tối giản cho công việc hằng ngày.
            Chúng tôi tập trung vào trải nghiệm gõ, độ bền và dịch vụ hỗ trợ
            tận tâm để mỗi góc máy của bạn luôn vừa đẹp vừa hiệu quả.
          </p>
        </div>

        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Công ty</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:underline transition" href="#">Trang chủ</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Giới thiệu</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Liên hệ</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Chính sách bảo mật</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Liên hệ với chúng tôi</h2>
            <div className="text-sm space-y-2">
              <p>+1-234-567-890</p>
              <p>support@keyhub.vn</p>
            </div>
          </div>
        </div>
      </div>
      <p className="py-4 text-center text-xs md:text-sm">
        Copyright 2026 © KeyHub. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;