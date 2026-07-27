import React from 'react';

interface Props {
  expiryDate: string;
  collectionDate?: string;
  className?: string;
}

export const DaysRemainingProgressBar: React.FC<Props> = ({ expiryDate, collectionDate, className = '' }) => {
  const exp = new Date(expiryDate);
  const now = new Date();

  const totalDuration = collectionDate
    ? Math.max(1, (exp.getTime() - new Date(collectionDate).getTime()) / (1000 * 3600 * 24))
    : 42; // default 42 days shelf life

  const diffMs = exp.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));

  const percentage = Math.min(100, Math.max(0, (daysLeft / totalDuration) * 100));

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let bgTrack = 'bg-emerald-100';

  if (daysLeft <= 0) {
    barColor = 'bg-red-600';
    textColor = 'text-red-700';
    bgTrack = 'bg-red-100';
  } else if (daysLeft <= 7) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgTrack = 'bg-amber-100';
  }

  return (
    <div className={`flex flex-col gap-1 w-full max-w-[140px] ${className}`}>
      <div className="flex justify-between items-center text-[11px] font-medium">
        <span className={textColor}>
          {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
        </span>
        <span className="text-slate-400 font-mono text-[10px]">{Math.round(percentage)}%</span>
      </div>
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${bgTrack}`}>
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
