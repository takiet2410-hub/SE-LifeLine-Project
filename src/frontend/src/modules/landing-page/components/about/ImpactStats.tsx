import React from 'react';
import { StatCard } from './StatCard';
import { IconDonors } from '../../../../shared/components/Icons/IconDonors';
import { IconHospital } from '../../../../shared/components/Icons/IconHospital';
import { IconImpact } from '../../../../shared/components/Icons/IconImpact';
import type { ImpactStatProps } from '../../../../types/about';

const stats: ImpactStatProps[] = [
  {
    id: 'donors',
    value: '50,000+',
    label: 'Tình Nguyện Viên Tích Cực',
    icon: <IconDonors />
  },
  {
    id: 'hospitals',
    value: '120+',
    label: 'Bệnh Viện & Cơ Sở Đối Tác',
    icon: <IconHospital />
  },
  {
    id: 'impacted',
    value: '150,000+',
    label: 'Bệnh Nhân Được Cứu Sống',
    icon: <IconImpact />
  }
];

export const ImpactStats: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-[#2D3748] mb-4">Tác Động Lan Tỏa Của Chúng Tôi</h2>
          <div className="w-16 h-1 bg-[#93000B]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map(stat => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
};
