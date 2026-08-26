import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { ContentStatsCards } from '../components/ContentStatsCards';
import { ArticleCard } from '../components/ArticleCard';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import type { Article, ContentStatsSummary } from '../types/article.types';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const ArticleListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/hospital') ? '/hospital' : '/bc';

  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<ContentStatsSummary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'All');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Delete modal state
  const [selectedArticleToDelete, setSelectedArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronize URL Search Params into State whenever location.search changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'All';
    const urlStatus = searchParams.get('status') || 'All';
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

    setCategoryFilter(urlCategory);
    setStatusFilter(urlStatus);
    setSearchQuery(urlSearch);
    setPage(urlPage);
  }, [location.search]);

  // Compute current search query string from active state
  const currentSearchQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter !== 'All') params.set('category', categoryFilter);
    if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (page > 1) params.set('page', String(page));
    const str = params.toString();
    return str ? `?${str}` : '';
  }, [categoryFilter, statusFilter, searchQuery, page]);

  // Synchronize state changes to URL Search Params when query string differs
  useEffect(() => {
    if (location.search !== currentSearchQuery) {
      const params = new URLSearchParams(currentSearchQuery.replace(/^\?/, ''));
      setSearchParams(params, { replace: true });
    }
  }, [currentSearchQuery, location.search, setSearchParams]);

  // Navigation with preservation of filters in state
  const navTo = (path: string) => {
    const q = currentSearchQuery || location.search || '';
    navigate(path, {
      state: {
        fromContentSearch: q,
        fromSearch: q,
      },
    });
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await articleApi.getArticles({
        page,
        limit: 10,
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery
      });
      if (res.success) {
        setArticles(res.data);
        setPagination(res.pagination);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Không thể tải danh sách bài viết'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter, statusFilter, searchQuery, page]);

  const handleDeleteConfirm = async () => {
    if (!selectedArticleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await articleApi.deleteArticle(selectedArticleToDelete._id);
      if (res.success) {
        setSelectedArticleToDelete(null);
        if (articles.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          await fetchArticles();
        }
      }
    } catch (e: unknown) {
      alert(getApiErrorMessage(e, 'Không thể xóa bài viết'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <ContentStatsCards summary={summary} loading={loading} />

      {/* Filters, Search & Action Bar */}
      <div className="bg-white rounded-2xl border border-[#f1f3f5] p-4 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left / Center: Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm bài viết theo tiêu đề..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-[#f1f3f5] rounded-xl text-sm focus:border-[#93000b] outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex min-w-0 flex-1 sm:flex-none items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Filter className="w-4 h-4 text-gray-400" />
              <span>Chuyên mục:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-red-500 focus:border-red-500 bg-white cursor-pointer"
              >
                <option value="All">Tất cả chuyên mục</option>
                <option value="News">Tin tức</option>
                <option value="Alert">Cảnh báo</option>
                <option value="Educational">Kiến thức</option>
                <option value="Campaign">Chiến dịch</option>
              </select>
            </div>

            <div className="flex min-w-0 flex-1 sm:flex-none items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-red-500 focus:border-red-500 bg-white cursor-pointer"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Published">Đã xuất bản</option>
                <option value="Draft">Bản nháp</option>
                <option value="Scheduled">Đã lên lịch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Refresh & Create Article Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto">
          <button
            onClick={fetchArticles}
            className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer shadow-2xs shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navTo(`${basePath}/content/create`)}
            className="h-10 px-4 bg-[#93000b] hover:bg-[#7a0009] text-white text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bài Viết Mới</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#93000b] border-t-transparent rounded-full mb-2"></div>
          <p className="text-sm text-gray-500">Đang tải danh sách bài viết...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
          <div className="w-12 h-12 bg-red-50 text-[#93000b] rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Không tìm thấy bài viết nào</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Không có bài viết nào phù hợp với bộ lọc hiện tại. Nhấn nút bên dưới để tạo bài viết mới!
          </p>
          <button
            onClick={() => navTo(`${basePath}/content/create`)}
            className="px-4 py-2 bg-[#93000b] text-white text-xs font-semibold rounded-xl hover:bg-[#7a0009] cursor-pointer"
          >
            Tạo bài viết đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <ArticleCard
                key={art._id}
                article={art}
                onSelect={(id) => navTo(`${basePath}/content/${id}`)}
                onEdit={(id) => navTo(`${basePath}/content/${id}?edit=true`)}
                onDelete={(article) => setSelectedArticleToDelete(article)}
              />
            ))}
          </div>

          <nav
            aria-label="Article pagination"
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-gray-600" aria-live="polite">
              Hiển thị <span className="font-semibold text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span>
              {'–'}
              <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
              {' trong tổng số '}
              <span className="font-semibold text-gray-900">{pagination.total}</span> bài viết
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trang trước
              </button>
              <span className="min-w-24 text-center text-sm font-semibold text-gray-800">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trang sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!selectedArticleToDelete}
        articleTitle={selectedArticleToDelete?.title}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSelectedArticleToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
