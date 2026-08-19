import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, ArrowRight, ShieldCheck, Users } from 'lucide-react';

export const HowItWorksHero: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="flex pt-16 flex-col items-start w-full bg-linear-to-b from-[#FFF0EE] via-[#FFF8F7] to-white">
      <div className="flex min-h-[580px] py-16 lg:py-24 px-6 lg:px-12 justify-center items-center w-full overflow-hidden relative">
        {/* Subtle decorative background blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
          {/* Left Text Content */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 border border-red-200 text-[#93000B] font-bold text-xs tracking-wider uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#93000B]" />
              <span>{t('about.mission.badge', 'SỨ MỆNH CỦA CHÚNG TÔI')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#93000B] leading-tight tracking-tight">
              How Blood Donation Saves Lives
            </h1>

            <p className="text-[#5B403D] text-base md:text-lg leading-relaxed max-w-2xl font-normal">
              Discover the simple blood donation process and how LifeLine makes it a safer, more convenient experience for everyone in Vietnam. Every drop counts.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3 w-full sm:w-auto">
              <a
                href="#process-steps"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('process-steps')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#93000B] hover:bg-[#7a0009] text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Tìm hiểu quy trình</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-red-100 w-full mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#93000B] flex items-center justify-center shrink-0 border border-red-100">
                  <Heart className="w-4 h-4 fill-[#93000B]" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#271816]">1 Túi máu</p>
                  <p className="text-[11px] text-[#6c757d]">Cứu được 3 người</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#271816]">An toàn 100%</p>
                  <p className="text-[11px] text-[#6c757d]">Quy chuẩn Bộ Y Tế</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#271816]">50,000+</p>
                  <p className="text-[11px] text-[#6c757d]">Tình nguyện viên</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Graphic */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-[480px] aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-red-50">
              <img
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=1000"
                alt="Hiến máu cứu người"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating Mini Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/40 shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#271816]">LifeLine Blood Network</p>
                  <p className="text-[11px] text-[#6c757d]">Mỗi giọt máu cho đi — Một cuộc đời ở lại</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
