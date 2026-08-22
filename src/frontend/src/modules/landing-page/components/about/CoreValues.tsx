import React from 'react';
import { ValueCard } from './ValueCard';
import { IconReliability } from '../../../../shared/components/Icons/IconReliability';
import { IconHumanCentered } from '../../../../shared/components/Icons/IconHumanCentered';
import { IconInnovation } from '../../../../shared/components/Icons/IconInnovation';
import type { CoreValueProps } from '../../../../types/about';

const coreValues: CoreValueProps[] = [
  {
    id: 'reliability',
    title: 'Độ Tin Cậy Chuẩn Y Tế',
    description: 'Áp dụng các tiêu chuẩn an toàn y khoa nghiêm ngặt trong mọi quy trình. Chúng tôi đặt sự an toàn của người hiến và tính toàn vẹn dữ liệu lên hàng đầu.',
    icon: <IconReliability />
  },
  {
    id: 'humanCentered',
    title: 'Lấy Con Người Làm Trung Tâm',
    description: 'Thiết kế trải nghiệm tối ưu từ người hiến máu đến người bệnh. Chúng tôi tin rằng công nghệ sinh ra để gắn kết tình người và lan tỏa sự sống.',
    icon: <IconHumanCentered />
  },
  {
    id: 'innovation',
    title: 'Đổi Mới & Sáng Tạo',
    description: 'Ứng dụng AI và phân tích dữ liệu để tăng tốc độ phản ứng cấp cứu SOS, số hóa vận hành kho máu giúp cứu sống bệnh nhân kịp thời hơn bao giờ hết.',
    icon: <IconInnovation />
  }
];

export const CoreValues: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#2D3748]">
            Giá Trị Cốt Lõi Của Chúng Tôi
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map(value => (
            <ValueCard key={value.id} value={value} />
          ))}
        </div>
      </div>
    </section>
  );
};
