import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  return (
    <section className="w-full bg-linear-to-b from-[#F8F9FA] to-[#FFFFFF] pt-24 pb-20 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* Text Content */}
        <div className="flex-1 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#FEE2E2] text-[#93000B] font-bold text-xs tracking-wide">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.025 10.5V7.02917L1.02083 8.76458L0 7L3.00417 5.25L0 3.51458L1.02083 1.75L4.025 3.48542V0H6.06667V3.48542L9.07083 1.75L10.0917 3.51458L7.0875 5.25L10.0917 7L9.07083 8.76458L6.06667 7.02917V10.5H4.025V10.5" fill="currentColor"/>
            </svg>
            Kết nối giọt máu — Cứu sống sinh mạng
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold text-[#93000B] leading-tight">
            Mỗi Giọt Máu Trao Đi — Một Cuộc Đời Ở Lại
          </h1>
          
          <p className="text-[#5B403D] text-lg leading-relaxed max-w-xl">
            Tham gia mạng lưới hiến máu nhân đạo đáng tin cậy tại Việt Nam. Nghĩa cử cao đẹp của bạn
            giúp người bệnh kịp thời được truyền máu cứu sống.
            Đăng ký ngay hôm nay để chung tay vì sức khỏe cộng đồng.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link to="/register" className="w-full sm:w-auto bg-[#93000B] hover:bg-[#7F1D1D] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
              Đăng Ký Hiến Máu
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9V9" fill="currentColor"/>
              </svg>
            </Link>
            <Link to="/about" className="w-full sm:w-auto border-2 border-[#455F87] text-[#455F87] hover:bg-gray-50 font-bold text-lg px-8 py-4 rounded-xl transition flex items-center justify-center">
              Tìm Hiểu Thêm
            </Link>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-400"></div>
            </div>
            <p className="text-sm font-medium text-gray-800">
              Đồng hành cùng hơn 50.000+ tình nguyện viên tích cực
            </p>
          </div>
        </div>

        {/* Image/Visual */}
        <div className="flex-1 w-full max-w-[672px] relative">
          {/* Decorative blobs */}
          <div className="absolute -right-6 -top-6 rounded-full bg-[#93000B] opacity-10 w-24 h-24 hidden md:block"></div>
          <div className="absolute -left-10 -bottom-10 rounded-full bg-[#455F87] opacity-10 w-40 h-40 hidden md:block"></div>
          
          <div className="rounded-3xl shadow-2xl overflow-hidden relative z-10 bg-gray-100 aspect-[4/3] w-full">
             <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=1000" alt="Blood Donation" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};
