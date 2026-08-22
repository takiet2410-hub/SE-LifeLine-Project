import React from 'react';
import { FileText, Eye, AlertTriangle } from 'lucide-react';
import type { ContentStatsSummary } from '../types/article.types';

interface ContentStatsCardsProps {
  summary?: ContentStatsSummary;
  loading?: boolean;
}

export const ContentStatsCards: React.FC<ContentStatsCardsProps> = ({ summary, loading }) => {
  const stats = [
    {
      title: 'Tổng bài viết',
      value: summary?.totalArticles ?? 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100'
    },
    {
      title: 'Lượt xem cộng đồng',
      value: (summary?.publicReach ?? 0).toLocaleString(),
      icon: Eye,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100'
    },
    {
      title: 'Cảnh báo đang chạy',
      value: summary?.activeAlerts ?? 0,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl border ${stat.border} p-5 shadow-sm flex items-center space-x-4`}
          >
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};
