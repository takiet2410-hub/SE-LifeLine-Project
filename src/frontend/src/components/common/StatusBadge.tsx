import React from 'react';

export type StatusVariant =
  | 'Draft'
  | 'Upcoming'
  | 'Active'
  | 'Completed'
  | 'Full'
  | 'Closed'
  | 'Cancelled'
  | 'Registered'
  | 'CheckedIn'
  | 'Eligible'
  | 'Ineligible'
  | 'Published'
  | 'Unpublished'
  | 'Available'
  | 'Reserved'
  | 'Used'
  | 'Expired'
  | 'Discarded'
  | 'Routine'
  | 'SOS'
  | 'Normal';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusLabelMap: Record<string, string> = {
    Draft: 'Bản nháp',
    Upcoming: 'Sắp diễn ra',
    Active: 'Đang mở',
    Cancelled: 'Đã hủy',
    Completed: 'Đã kết thúc',
  };

  const displayLabel = label || statusLabelMap[status] || status;

  const styleMap: Record<string, string> = {
    // Campaign statuses
    Draft: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    Completed: 'bg-slate-200 text-slate-700 border-slate-300 font-medium',
    Full: 'bg-amber-50 text-amber-700 border-amber-300',
    Closed: 'bg-red-50 text-red-700 border-red-200',

    // Registration statuses
    Pending: 'bg-sky-50 text-sky-700 border-sky-300 font-medium',
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    Rejected: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    Registered: 'bg-blue-50 text-blue-700 border-blue-200',
    CheckedIn: 'bg-amber-50 text-amber-700 border-amber-300 font-medium',
    Eligible: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold',
    Ineligible: 'bg-rose-50 text-rose-700 border-rose-300',

    // Content statuses
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    Unpublished: 'bg-amber-50 text-amber-700 border-amber-300',

    // Inventory statuses
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    Reserved: 'bg-amber-50 text-amber-700 border-amber-300 font-medium',
    Used: 'bg-slate-100 text-slate-600 border-slate-300',
    Expired: 'bg-red-100 text-red-800 border-red-300 font-bold',
    Discarded: 'bg-slate-200 text-slate-700 border-slate-400',

    // Notification types
    Routine: 'bg-blue-50 text-blue-700 border-blue-200',
    SOS: 'bg-red-600 text-white border-red-700 font-bold uppercase tracking-wider px-2.5 py-1 animate-pulse',
    Normal: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const badgeClass =
    styleMap[status] || 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${badgeClass}`}
    >
      {displayLabel}
    </span>
  );
};
