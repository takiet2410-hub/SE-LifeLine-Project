import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { ContentStatsCards } from '../components/ContentStatsCards';
import { ArticleCard } from '../components/ArticleCard';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import type { Article, ContentStatsSummary } from '../types/article.types';

export const ArticleListPage: React.FC = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<ContentStatsSummary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [selectedArticleToDelete, setSelectedArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await articleApi.getArticles({
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery
      });
      if (res.success) {
        setArticles(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e: any) {
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter, statusFilter, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!selectedArticleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await articleApi.deleteArticle(selectedArticleToDelete._id);
      if (res.success) {
        setArticles(prev => prev.filter(a => a._id !== selectedArticleToDelete._id));
        if (summary) {
          setSummary({
            ...summary,
            totalArticles: Math.max(0, summary.totalArticles - 1)
          });
        }
        setSelectedArticleToDelete(null);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-xs text-gray-500 mt-1">Manage announcements, news, and donor education articles</p>
        </div>

        <button
          onClick={() => navigate('/bc/content/create')}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Categories</option>
              <option value="News">News</option>
              <option value="Alert">Alerts</option>
              <option value="Health Tips">Health Tips</option>
              <option value="Campaign">Campaign</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            onClick={() => navigate('/bc/content/create')}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
          >
            Create First Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard
              key={art._id}
              article={art}
              onSelect={(id) => navigate(`/bc/content/${id}`)}
              onEdit={(id) => navigate(`/bc/content/${id}?edit=true`)}
              onDelete={(article) => setSelectedArticleToDelete(article)}
            />
          ))}
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
