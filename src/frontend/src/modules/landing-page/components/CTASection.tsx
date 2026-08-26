import React from 'react';
import { Link } from 'react-router-dom';

export const CTASection: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 lg:px-12 bg-white flex justify-center">
      <div className="w-full max-w-[1024px] rounded-[32px] bg-[#93000b] shadow-2xl p-12 lg:p-20 flex flex-col items-center text-center gap-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        <h2 className="text-4xl lg:text-5xl font-bold text-white z-10">
          Sẵn Sàng Trao Cơ Hội Sống?
        </h2>
        
        <p className="text-[#FEE2E2] text-lg max-w-2xl leading-relaxed z-10">
          Gia nhập mạng lưới hơn 50.000+ tình nguyện viên trên khắp Việt Nam. Mỗi lần hiến máu của bạn
          có thể cứu sống tới 3 sinh mạng. Hãy trở thành người hùng thầm lặng ngay hôm nay.
        </p>
        
        <div className="z-10 mt-4">
          <Link 
            to="/register" 
            className="inline-block bg-white hover:bg-gray-100 font-extrabold text-xl lg:text-[22px] px-10 py-5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
            style={{ color: '#93000b' }}
          >
            <span className="text-[#93000b] !text-[#93000b]" style={{ color: '#93000b' }}>Đăng Ký Ngay</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
