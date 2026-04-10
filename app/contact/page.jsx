import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Liên hệ | KeyHub",
  description: "Liên hệ hỗ trợ, tư vấn và hợp tác với KeyHub.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white min-h-[70vh]">
        <section className="px-6 md:px-16 lg:px-32 pt-12 pb-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-orange-700">Liên hệ KeyHub</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">Nhanh gọn, rõ ràng, có phản hồi</h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Nếu bạn cần hỗ trợ đơn hàng, cần tư vấn chọn phím, hoặc muốn hợp tác kỹ thuật,
              hãy gửi form bên dưới. KeyHub sẽ phản hồi qua email trong thời gian sớm nhất.
            </p>
          </div>

          <div className="mt-8">
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
