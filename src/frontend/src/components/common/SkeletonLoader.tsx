import React from 'react';

interface SkeletonLoaderProps {
  type?: 'table' | 'card' | 'form';
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'table',
  rows = 5,
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="h-40 bg-slate-200 rounded-lg" />
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-pulse max-w-2xl">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-24 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-14 px-4 flex items-center gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
};
