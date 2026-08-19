import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/hospital') ? '/hospital' : '/bc';

  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<ContentStatsSummary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Delete modal state
  const [selectedArticleToDelete, setSelectedArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-xs text-gray-500 mt-1">Manage announcements, news, and donor education articles</p>
        </div>

        <button
          onClick={() => navigate(`${basePath}/content/create`)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Article</span>
        </button>
      </div>

      {/* Summary Cards */}
      <ContentStatsCards summary={summary} loading={loading} />

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search articles by title..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 sm:flex-none items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Categories</option>
              <option value="News">News</option>
              <option value="Alert">Alerts</option>
              <option value="Educational">Educational</option>
              <option value="Campaign">Campaign</option>
            </select>
          </div>

          <div className="flex min-w-0 flex-1 sm:flex-none items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>

          <button
            onClick={fetchArticles}
            className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-sm text-gray-500">Loading articles...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No articles found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No articles match your current filter settings. Click below to create your first article!
          </p>
          <button
            onClick={() => navigate(`${basePath}/content/create`)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
          >
            Create First Article
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <ArticleCard
                key={art._id}
                article={art}
                onSelect={(id) => navigate(`${basePath}/content/${id}`)}
                onEdit={(id) => navigate(`${basePath}/content/${id}?edit=true`)}
                onDelete={(article) => setSelectedArticleToDelete(article)}
              />
            ))}
          </div>

          <nav
            aria-label="Article pagination"
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-gray-600" aria-live="polite">
              Showing <span className="font-semibold text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span>
              {'–'}
              <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
              {' of '}
              <span className="font-semibold text-gray-900">{pagination.total}</span> articles
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="min-w-24 text-center text-sm font-semibold text-gray-800">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
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
