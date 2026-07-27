import React from 'react';
import type { BagStatus } from '../types/inventory.types';

interface Props {
  status: BagStatus;
  className?: string;
}

export const BloodBagStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const getBadgeStyle = (st: BagStatus) => {
    switch (st) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'Reserved':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'Used':
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20';
      case 'Expired':
        return 'bg-red-50 text-red-700 border-red-200 ring-red-600/20';
      case 'Discarded':
        return 'bg-gray-100 text-gray-600 border-gray-300 ring-gray-600/20';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ring-1 ring-inset ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'Available'
            ? 'bg-emerald-500'
            : status === 'Reserved'
            ? 'bg-amber-500'
            : status === 'Expired'
            ? 'bg-red-500'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};
