import React from 'react';
import { Eye, Users, Share2, TrendingUp } from 'lucide-react';
import type { ArticlePerformance } from '../types/article.types';

interface PerformancePanelProps {
  performance?: ArticlePerformance;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ performance }) => {
  if (!performance) return null;

  const viewsCount = performance.viewsCount ?? 0;
  const publicReachCount = performance.publicReachCount ?? (performance as any).reach ?? 0;
  const sharesCount = performance.sharesCount ?? (performance as any).shares ?? 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-gray-300">
          Hiệu suất & Thống kê
        </h4>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          Theo dõi trực tiếp
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center space-x-1.5 text-gray-400 text-xs mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Tổng lượt xem</span>
          </div>
          <p className="text-xl font-bold">{viewsCount.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center space-x-1.5 text-gray-400 text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Lượt tiếp cận</span>
          </div>
          <p className="text-xl font-bold">{publicReachCount.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center space-x-1.5 text-gray-400 text-xs mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Lượt chia sẻ</span>
          </div>
          <p className="text-xl font-bold">{sharesCount.toLocaleString()}</p>
        </div>
      </div>

      {performance.engagementNote && (
        <div className="flex items-start space-x-2 bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-3 text-xs text-emerald-300">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{performance.engagementNote}</span>
        </div>
      )}
    </div>
  );
};
