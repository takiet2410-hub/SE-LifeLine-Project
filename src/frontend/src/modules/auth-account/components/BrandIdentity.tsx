import React from 'react';
import { LifeLineLogo } from './LifeLineLogo';

export const BrandIdentity: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Icon Badge */}
      <div className="mb-4 p-3 bg-[#93000b] rounded-xl shadow-md flex items-center justify-center transition-transform hover:scale-105">
        <LifeLineLogo className="w-6 h-7 text-white" />
      </div>

      {/* Brand Title */}
      <h1 className="text-[28px] font-bold leading-[36.4px] text-[#93000b] tracking-tight">
        LifeLine
      </h1>

      {/* Slogan */}
      <p className="mt-1 text-[12px] font-medium leading-[16.8px] text-[#6c757d] uppercase tracking-wider">
        MỖI GIỌT MÁU TRIỆU TẤM LÒNG
      </p>
    </div>
  );
};

export default BrandIdentity;
