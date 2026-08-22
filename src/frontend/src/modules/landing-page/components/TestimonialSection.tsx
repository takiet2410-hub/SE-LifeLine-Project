import React from 'react';
import { IconQuote } from '../../../shared/components/Icons/IconQuote';

export const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      id: '1',
      authorName: 'Hoàng Minh',
      donorRoleKey: 'Người hiến máu thường xuyên',
      quoteKey: '"Nền tảng giúp tôi tìm điểm hiến máu gần nhà cực kỳ nhanh. Toàn bộ quy trình chỉ mất 30 phút, và tôi rất vui khi thấy giọt máu của mình đã cứu sống nhiều bệnh nhân!"',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
      id: '2',
      authorName: 'Trần Linh',
      donorRoleKey: 'Tình nguyện viên sinh viên',
      quoteKey: '"Nhờ có Trợ lý AI kiểm tra điều kiện sức khỏe, tôi biết được cần chờ hết đợt thuốc trước khi đi hiến. Rất tiện lợi và khoa học!"',
      avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
      id: '3',
      authorName: 'Nguyễn Khánh',
      donorRoleKey: 'Người hiến máu định kỳ',
      quoteKey: '"Tính năng vé điện tử E-Ticket QR thực sự tuyệt vời. Không cần phải điền giấy tờ rườm rà tại bệnh viện, chỉ cần quét mã là được tiếp nhận ngay."',
      avatarUrl: 'https://i.pravatar.cc/150?u=3'
    }
  ];

  return (
    <section className="w-full bg-[#FFF8F7] py-24 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-16">
        <h2 className="text-4xl font-bold text-gray-900 text-center">Cảm Nhận Từ Những Người Trao Sự Sống</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-white border border-[#F1F3F5] rounded-2xl p-8 shadow-sm relative flex flex-col gap-8">
              <div className="absolute top-6 right-6 text-gray-200">
                <IconQuote className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-[#5B403D] text-base leading-relaxed italic z-10 flex-grow">
                {testimonial.quoteKey}
              </p>
              <div className="flex items-center gap-4">
                <img src={testimonial.avatarUrl} alt={testimonial.authorName} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-base">{testimonial.authorName}</span>
                  <span className="text-[#5B403D] font-medium text-xs">{testimonial.donorRoleKey}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
