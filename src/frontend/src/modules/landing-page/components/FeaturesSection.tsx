import React from 'react';
import { IconMapPin } from '../../../shared/components/Icons/IconMapPin';
import { IconTicket } from '../../../shared/components/Icons/IconTicket';
import { IconImpact } from '../../../shared/components/Icons/IconImpact';
import { IconRobot } from '../../../shared/components/Icons/IconRobot';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      id: '1',
      titleKey: 'Tìm Điểm Hiến Gần Nhất',
      descriptionKey: 'Khám phá các chiến dịch hiến máu đang diễn ra trên bản đồ tương tác và chọn khung giờ thuận tiện chỉ trong vài giây.',
      icon: <IconMapPin />
    },
    {
      id: '2',
      titleKey: 'Thẻ Hẹn E-Ticket QR',
      descriptionKey: 'Nhận thẻ hẹn điện tử cá nhân hóa kèm mã QR bảo mật để check-in và khám sàng lọc đón tiếp ưu tiên tại điểm tiếp nhận.',
      icon: <IconTicket />
    },
    {
      id: '3',
      titleKey: 'Theo Dõi Hành Trình',
      descriptionKey: 'Xem nhật ký hiến máu, mở khóa huy hiệu vinh danh và tích lũy cấp độ người hiến khi bạn trao thêm nhiều cơ hội sống.',
      icon: <IconImpact />
    },
    {
      id: '4',
      titleKey: 'Trợ Lý AI Đồng Hành',
      descriptionKey: 'Trò chuyện cùng trợ lý AI thông minh để được tư vấn điều kiện sức khỏe, chuẩn bị trước hiến và bí quyết phục hồi tốt nhất.',
      icon: <IconRobot />
    }
  ];

  return (
    <section className="w-full bg-white py-24 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-16">
        <div className="text-center max-w-2xl flex flex-col gap-4">
          <h2 className="text-4xl font-bold text-gray-900">Tại Sao Nên Đồng Hành Cùng LifeLine?</h2>
          <p className="text-[#5B403D] text-base leading-relaxed">
            Chúng tôi ứng dụng công nghệ hiện đại giúp hành trình hiến máu cứu người trở nên
            nhanh chóng, minh bạch và mang lại nhiều giá trị ý nghĩa cho cộng đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {features.map(feature => (
            <div key={feature.id} className="bg-[#F8F9FA] border border-[#F1F3F5] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6">
              <div className="w-12 h-12 bg-[#FEE2E2] rounded-xl flex items-center justify-center text-[#93000B]">
                {feature.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-gray-900">{feature.titleKey}</h3>
                <p className="text-[#5B403D] text-sm leading-relaxed">{feature.descriptionKey}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
