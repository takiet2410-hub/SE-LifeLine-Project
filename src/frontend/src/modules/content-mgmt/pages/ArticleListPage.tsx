import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';
import type { ArticleData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { EmptyState } from '../../../components/common/EmptyState';

export const ArticleListPage: React.FC = () => {
  useTranslation();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryFilter = 'All';
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await apiService.getArticles(categoryFilter, statusFilter);
      setArticles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Bài Viết & Truyền Thông</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đăng tải bài viết tuyên truyền, kiến thức sức khỏe và thông báo chiến dịch
          </p>
        </div>
        <button
          onClick={() => navigate('/bc/content/create')}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài viết mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Trạng thái:</span>
          {['All', 'Published', 'Draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'Tất cả' : st === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
            </button>
          ))}
        </div>
      </div>

      {/* Article Cards Grid */}
      {loading ? (
        <SkeletonLoader type="card" />
      ) : articles.length === 0 ? (
        <EmptyState message="Chưa có bài viết nào" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={article.imageUrls[0] || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=80'}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={article.status} />
                  </div>
                  <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Article Info */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-red-600 transition-colors">
                    {article.title}
                  </h3>
                  <div
                    className="text-xs text-slate-500 line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.bodyContent.replace(/<[^>]+>/g, '') }}
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[120px]">{article.authorName}</span>
                </div>
                <button
                  onClick={() => navigate(`/bc/content/${article._id}`)}
                  className="font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <span>Xem & Sửa</span>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
