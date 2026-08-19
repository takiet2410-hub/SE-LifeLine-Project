import React from 'react';
import type { CoreValueProps } from '../../../../types/about';

export const ValueCard: React.FC<{ value: CoreValueProps }> = ({ value }) => {
  return (
    <div className="flex flex-col items-start text-left p-8 bg-[#FCF9F9] rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#93000B] flex items-center justify-center mb-6">
        <div className="w-6 h-6">
          {value.icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">
        {value.description}
      </p>
    </div>
  );
};
