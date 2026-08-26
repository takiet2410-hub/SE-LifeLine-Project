import React from 'react';

export const MissionSection: React.FC = () => {

  return (
    <section className="bg-[#FCF9F9] py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 flex flex-col items-start text-left">
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#FEE2E2] text-[#93000B] text-xs font-bold mb-6 tracking-widest uppercase">
            SỨ MỆNH CỦA CHÚNG TÔI
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2D3748] mb-6 leading-tight">
            Mỗi Giọt Máu — Một Niềm Tin
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
            LifeLine là nền tảng số tiên phong tại Việt Nam trong quản lý hiến máu và điều phối cấp cứu, thu hẹp khoảng cách giữa người hiến máu tình nguyện và các bệnh viện để không một bệnh nhân nào phải chờ đợi máu trong tuyệt vọng.
          </p>
          <a 
            href="https://www.facebook.com/profile.php?id=61592481823429"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#93000b] hover:bg-[#7a0009] !text-white text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-center active:scale-[0.98]"
            style={{ color: '#ffffff' }}
          >
            <span className="text-white !text-white" style={{ color: '#ffffff' }}>Tham Gia Mạng Lưới Cùng Chúng Tôi</span>
          </a>
        </div>
        <div className="flex-1 w-full">
          <div className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] w-full">
             <img src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=1000" alt="Doctors" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};
