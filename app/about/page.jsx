import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowDown, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Giới thiệu | KeyHub",
  description: "Hành trình KeyHub: từ đam mê bàn phím cơ đến trải nghiệm mua sắm rõ ràng, minh bạch.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white overflow-hidden">
        <section className="relative px-6 md:px-16 lg:px-32 pt-16 md:pt-24 pb-20" data-animate-group="hero">
          <div className="max-w-5xl">
            {/* <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 bg-orange-100 px-3 py-1 rounded-full js-reveal" data-animate="fade-up">
              Câu chuyện KeyHub
            </p> */}
            <h1 className="mt-5 text-4xl md:text-4xl font-bold text-gray-900 leading-tight js-reveal" data-animate="fade-up" data-delay="100">
              Chúng tôi tạo KeyHub để mỗi lần đặt tay lên bàn phím là một lần thấy đáng tiền.
            </h1>
            <p className="mt-6 text-gray-600 text-base md:text-xl leading-relaxed max-w-3xl js-reveal" data-animate="fade-up" data-delay="200">
              KeyHub bắt đầu từ một điều rất đơn giản: gõ trên bàn phím tốt giúp bạn làm việc lâu hơn,
              chơi game đã hơn, và giữ được cảm hứng mỗi ngày. Từ đó, chúng tôi chọn lọc sản phẩm theo
              tiêu chí rõ ràng về cảm giác gõ, độ bền và giá trị sử dụng thật.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5" data-animate="stagger" data-delay="300">
            <div className="aspect-[16/9] rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50 js-parallax" data-speed="0.2" aria-label="hero-image-wide" />
            <div className="aspect-[4/5] rounded-3xl border-2 border-dashed border-gray-300 bg-white js-parallax" data-speed="0.35" aria-label="hero-image-tall" />
          </div>

          <a href="#about-story" className="mt-10 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition js-reveal" data-animate="fade-up" data-delay="400">
            Kéo xuống để xem tiếp
            <ArrowDown className="w-4 h-4" />
          </a>
        </section>

        <section id="about-story" className="px-6 md:px-16 lg:px-32 pb-20" data-animate-group="story">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 js-reveal" data-animate="slide-right">
              <p className="text-sm font-semibold text-orange-700">01. Bắt đầu từ trải nghiệm gõ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Không chỉ bán bàn phím, mà bán cảm giác muốn gõ tiếp.</h2>
              <p className="text-gray-600 leading-relaxed">
                Những mẫu lên kệ tại KeyHub không được chọn vì chạy trend ngắn hạn, mà vì dùng thật ổn trong
                thời gian dài. Chúng tôi ưu tiên cảm giác gõ rõ ràng, layout hợp lý, và trải nghiệm đồng đều
                giữa công việc lẫn giải trí.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Mỗi mô tả sản phẩm đều tập trung vào thứ người dùng cần: loại switch, chất liệu keycap,
                độ ổn định khung phím, kết nối, và tính tương thích để bạn không phải mua theo cảm tính.
              </p>
            </div>

            <div className="aspect-[4/3] rounded-3xl border-2 border-dashed border-gray-300 bg-white js-reveal" data-animate="zoom-in" aria-label="story-image" />
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-32 pb-20" data-animate-group="milestones">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-10 shadow-sm">
            <p className="text-sm font-semibold text-orange-700 js-reveal" data-animate="fade-up">02. Cột mốc phát triển</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 js-reveal" data-animate="fade-up" data-delay="100">
              Từng bước mở rộng, nhưng luôn giữ một tiêu chuẩn phục vụ nhất quán
            </h2>

            <div className="mt-8 space-y-6">
              {[
                {
                  label: "Giai đoạn 01",
                  title: "Khởi đầu từ cộng đồng người dùng bàn phím cơ",
                  description: "Lắng nghe thói quen sử dụng thực tế để hiểu rõ nhu cầu từ người mới đến người dùng đã có kinh nghiệm.",
                },
                {
                  label: "Giai đoạn 02",
                  title: "Chuẩn hóa danh mục và mô tả sản phẩm",
                  description: "Tập trung vào thông tin quan trọng giúp khách so sánh nhanh và chọn đúng sản phẩm phù hợp ngân sách.",
                },
                {
                  label: "Giai đoạn 03",
                  title: "Nâng cấp trải nghiệm mua hàng và hậu mãi",
                  description: "Giảm thời gian phản hồi, hỗ trợ sau mua rõ ràng và đảm bảo quá trình bảo hành minh bạch hơn.",
                },
              ].map((item, index) => (
                <article key={item.label} className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 rounded-2xl border border-gray-200 p-4 js-reveal" data-animate="fade-up" data-delay={150 + index * 100}>
                  <div className="text-sm font-semibold text-orange-700">{item.label}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-32 pb-20" data-animate-group="gallery">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-700 js-reveal" data-animate="fade-up">03. Bộ ảnh thương hiệu</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 js-reveal" data-animate="fade-up" data-delay="100">Khoảnh khắc sản phẩm trong setup đời thực</h2>
              <p className="mt-3 text-gray-600 max-w-3xl js-reveal" data-animate="fade-up" data-delay="150">
                Khu vực này dành cho ảnh sản phẩm thực tế, ảnh góc làm việc, và các shot cận cảnh chi tiết hoàn thiện.
                Bạn chỉ cần thay ảnh vào đúng khung là toàn bộ mạch kể chuyện sẽ liền mạch từ trên xuống dưới.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4" data-animate="stagger" data-delay="150">
            <div className="md:col-span-2 aspect-[16/10] rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50 js-parallax" data-speed="0.2" aria-label="gallery-image-01" />
            <div className="aspect-[4/5] rounded-3xl border-2 border-dashed border-gray-300 bg-white js-parallax" data-speed="0.25" aria-label="gallery-image-02" />
            <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 bg-white js-parallax" data-speed="0.15" aria-label="gallery-image-03" />
            <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 bg-white js-parallax" data-speed="0.3" aria-label="gallery-image-04" />
            <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 bg-white js-parallax" data-speed="0.18" aria-label="gallery-image-05" />
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-32 pb-24" data-animate-group="cta">
          <div className="rounded-3xl border border-orange-200 bg-orange-50/70 p-8 md:p-12">
            <p className="text-sm font-semibold text-orange-700 js-reveal" data-animate="fade-up">04. Call to action cuối trang</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 js-reveal" data-animate="fade-up" data-delay="100">
              Nếu bạn đang tìm một chiếc bàn phím dùng lâu dài, KeyHub sẵn sàng đồng hành từ lúc chọn đến lúc sử dụng.
            </h2>
            <p className="mt-4 text-gray-700 max-w-2xl js-reveal" data-animate="fade-up" data-delay="200">
              Chúng tôi ưu tiên tư vấn đúng nhu cầu, quy trình mua hàng rõ ràng và hỗ trợ nhanh khi bạn cần.
              Hãy khám phá danh sách sản phẩm hoặc gửi yêu cầu để được tư vấn chi tiết.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/all-products" className="inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white px-5 py-3 font-semibold hover:bg-orange-700 transition js-reveal" data-animate="fade-up" data-delay="250">
                Xem sản phẩm
                <ChevronRight className="w-4 h-4" />
              </a>
              <a href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-800 px-5 py-3 font-semibold hover:bg-gray-50 transition js-reveal" data-animate="fade-up" data-delay="300">
                Liên hệ tư vấn
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
