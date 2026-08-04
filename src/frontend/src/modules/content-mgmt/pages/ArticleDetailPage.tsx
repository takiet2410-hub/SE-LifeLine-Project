import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Calendar, User, Clock, CheckCircle2, Save } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { PerformancePanel } from '../components/PerformancePanel';
import { FeaturedMediaUpload } from '../components/FeaturedMediaUpload';
import { TargetAudienceSelector } from '../components/TargetAudienceSelector';
import { PublishingSchedulePicker } from '../components/PublishingSchedulePicker';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { useAutosave } from '../hooks/useAutosave';
import type { Article, ArticleCategory, ArticleStatus, TargetAudience } from '../types/article.types';

export const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');

  // Form edit state
  const [title, setTitle] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('News');
  const [status, setStatus] = useState<ArticleStatus>('Draft');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(['Donors']);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const fetchArticle = async () => {
    if (!articleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await articleApi.getArticleById(articleId);
      if (res.success && res.data) {
        setArticle(res.data);
        setTitle(res.data.title);
        setBodyContent(res.data.bodyContent || '');
        setCategory(res.data.category);
        setStatus(res.data.status);
        setCoverImageUrl(res.data.coverImageUrl || '');
        setScheduledAt(res.data.scheduledAt || null);
        setTargetAudience(res.data.targetAudience || ['Donors']);
      }
    } catch (e: any) {
      setError(e.message || 'Article not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const editState = { title, bodyContent, category, status, coverImageUrl, scheduledAt, targetAudience };

  const { hasUnsavedChanges, lastSavedTime: _lastSavedTime, isSaving, markSaved } = useAutosave({
    data: editState,
    onSave: async (data) => {
      if (!articleId || !isEditing || !data.title.trim()) return;
      await articleApi.updateArticle(articleId, data);
    },
    enabled: isEditing
  });

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      if (article) {
        setTitle(article.title);
        setBodyContent(article.bodyContent || '');
        setCategory(article.category);
        setStatus(article.status);
        setCoverImageUrl(article.coverImageUrl || '');
        setScheduledAt(article.scheduledAt || null);
        setTargetAudience(article.targetAudience || ['Donors']);
      }
      setIsEditing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!articleId || !title.trim()) return;
    try {
      const res = await articleApi.updateArticle(articleId, {
        title: title.trim(),
        bodyContent,
        category,
        status,
        coverImageUrl,
        scheduledAt,
        targetAudience
      });
      if (res.success) {
        setArticle(res.data);
        markSaved();
        setIsEditing(false);
        setToastMessage('Article updated successfully');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update article');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!articleId) return;
    setIsDeleting(true);
    try {
      const res = await articleApi.deleteArticle(articleId);
      if (res.success) {
        navigate('/bc/content');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm text-gray-500">Loading article details...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error || 'Article not found or has been deleted'}
        </div>
        <button
          onClick={() => navigate('/bc/content')}
          className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg"
        >
          Return to Article List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Action Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/bc/content')}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Article' : article.title}
            </h1>
            <p className="text-xs text-gray-500">Article ID: {article._id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}</span>
              </span>
              <button
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Article</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Article Body / Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="News">News</option>
                    <option value="Alert">Alert</option>
                    <option value="Health Tips">Health Tips</option>
                    <option value="Campaign">Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <FeaturedMediaUpload value={coverImageUrl} onChange={setCoverImageUrl} />
              <TargetAudienceSelector selected={targetAudience} onChange={setTargetAudience} />
              <PublishingSchedulePicker value={scheduledAt} onChange={setScheduledAt} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Content Body</label>
                <textarea
                  rows={12}
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {article.coverImageUrl && (
                <div className="h-64 w-full overflow-hidden bg-gray-100">
                  <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                    {article.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {article.status}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>

                <div className="flex items-center space-x-4 text-xs text-gray-500 border-y border-gray-100 py-3">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{article.authorName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{article.readTimeMinutes} min read</span>
                  </span>
                </div>

                <div className="prose max-w-none text-gray-800 text-sm leading-relaxed pt-2">
                  {article.bodyContent ? (
                    <div dangerouslySetInnerHTML={{ __html: article.bodyContent }} />
                  ) : (
                    <p className="text-gray-400 italic">No article body content written yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Performance Analytics Panel */}
        <div className="space-y-6">
          <PerformancePanel performance={article.performance} />

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm text-xs text-gray-600">
            <h4 className="font-semibold text-gray-900 uppercase tracking-wider">Metadata</h4>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Target Audience</span>
              <span className="font-medium text-gray-900">{article.targetAudience?.join(', ') || 'Donors'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Created At</span>
              <span className="font-medium text-gray-900">{new Date(article.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium text-gray-900">{new Date(article.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Discard Changes</h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to discard your edits? Original article details will be restored.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        articleTitle={article.title}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
