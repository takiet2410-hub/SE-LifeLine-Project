import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Activity, HeartPulse, Megaphone, Inbox } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { ArticleCard } from '../components/ArticleCard';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import type { Article, ArticleCategory } from '../types/article.types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../../shared/api/apiError';


export const NewsFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articleApi.getPublicArticles({
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });
      if (res.success) {
        setArticles(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      toast.error(getApiErrorMessage(err, 'Không thể tải tin tức'));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCategoryChange = (category: ArticleCategory | 'All') => {
    setCategoryFilter(category);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">Tin tức & Thông tin</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm kiếm bài viết theo từ khóa..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            
            <div className="flex flex-wrap gap-2 md:flex-nowrap">
              {[
                { id: 'All', label: 'Tất cả' },
                { id: 'News', label: 'Tin tức' },
                { id: 'Alert', label: 'Cảnh báo' },
                { id: 'Educational', label: 'Kiến thức' },
                { id: 'Campaign', label: 'Chiến dịch' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleCategoryChange(id as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === id
                      ? 'bg-red-600 text-white shadow-sm font-semibold'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {total > 0 ? `Tìm thấy ${total} bài viết` : 'Không tìm thấy bài viết'}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} type="card" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <EmptyState 
              message={searchQuery || categoryFilter !== 'All' 
                ? 'Không tìm thấy bài viết phù hợp với bộ lọc của bạn.' 
                : 'Chưa có bài viết nào được xuất bản.'}
              actionLabel={searchQuery || categoryFilter !== 'All' ? 'Xóa bộ lọc' : undefined}
              onAction={searchQuery || categoryFilter !== 'All' ? () => {
                setSearchQuery('');
                setCategoryFilter('All');
              } : undefined}
              icon={
                categoryFilter === 'Educational' ? <HeartPulse className="w-8 h-8 text-green-500" /> :
                categoryFilter === 'Campaign' ? <Megaphone className="w-8 h-8 text-purple-500" /> :
                categoryFilter === 'Alert' ? <Activity className="w-8 h-8 text-red-500" /> :
                <Inbox className="w-8 h-8" />
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    onClick={() => navigate(`/news/${article._id}`)}
                    variant="public"
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || loading}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-red-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewsFeedPage;
