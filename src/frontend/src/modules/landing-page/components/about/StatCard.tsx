import React from 'react';
import type { ImpactStatProps } from '../../../../types/about';

export const StatCard: React.FC<{ stat: ImpactStatProps }> = ({ stat }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#FCF9F9] rounded-xl shadow-sm border border-[#FEE2E2] hover:shadow-md transition-shadow duration-300">
      <div className="w-12 h-12 text-[#93000B] flex items-center justify-center mb-4">
        {stat.icon}
      </div>
      <h3 className="text-4xl font-extrabold text-[#93000B] mb-2">{stat.value}</h3>
      <p className="text-gray-700 font-semibold text-lg text-center">
        {stat.label}
      </p>
    </div>
  );
};
