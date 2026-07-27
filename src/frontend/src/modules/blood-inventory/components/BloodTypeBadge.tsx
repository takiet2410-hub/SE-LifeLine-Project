import React from 'react';
import type { BloodType } from '../types/inventory.types';

interface Props {
  bloodType: BloodType | string;
  className?: string;
}

export const BloodTypeBadge: React.FC<Props> = ({ bloodType, className = '' }) => {
  const isRhNegative = bloodType.endsWith('-');

  return (
    <span
      className={`inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-md text-xs border ${
        isRhNegative
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-red-50 text-red-700 border-red-200'
      } ${className}`}
    >
      {bloodType}
    </span>
  );
};
