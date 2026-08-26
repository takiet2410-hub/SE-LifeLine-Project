import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/hospital') ? '/hospital' : '/bc';

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');

  const handleBackToList = () => {
    if (location.state?.returnUrl) {
      navigate(location.state.returnUrl);
      return;
    }
    if (location.state?.fromNotification) {
      const notifSearch = location.state?.fromNotifSearch || '';
      navigate(`${basePath}/notifications${notifSearch}`);
      return;
    }
    const contentSearch = location.state?.fromContentSearch || location.state?.fromSearch || '';
    navigate(`${basePath}/content${contentSearch}`);
  };

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
      setError(e.message || 'Không tìm thấy bài viết');
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
    if (status === 'Scheduled' && !scheduledAt) {
      alert('Vui lòng chọn ngày và giờ lên lịch xuất bản');
      return;
    }
    try {
      const res = await articleApi.updateArticle(articleId, {
        title: title.trim(),
        bodyContent,
        category,
        status,
        coverImageUrl,
        scheduledAt: status === 'Scheduled' ? scheduledAt : null,
        targetAudience
      });
      if (res.success) {
        setArticle(res.data);
        markSaved();
        setIsEditing(false);
        setToastMessage('Cập nhật bài viết thành công');
      }
    } catch (e: any) {
      alert(e.message || 'Không thể cập nhật bài viết');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!articleId) return;
    setIsDeleting(true);
    try {
      const res = await articleApi.deleteArticle(articleId);
      if (res.success) {
        handleBackToList();
      }
    } catch (e: any) {
      alert(e.message || 'Không thể xóa bài viết');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm text-gray-500">Đang tải thông tin bài viết...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error || 'Bài viết không tồn tại hoặc đã bị xóa'}
        </div>
        <button
          onClick={handleBackToList}
          className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Quay lại danh sách bài viết
        </button>
      </div>
    );
  }

  const getCategoryLabel = (cat: ArticleCategory) => {
    switch (cat) {
      case 'Alert':
        return 'Cảnh báo';
      case 'Educational':
        return 'Kiến thức';
      case 'Campaign':
        return 'Chiến dịch';
      case 'News':
      default:
        return 'Tin tức';
    }
  };

  const getStatusLabel = (st: ArticleStatus) => {
    switch (st) {
      case 'Published':
        return 'Đã xuất bản';
      case 'Scheduled':
        return 'Đã lên lịch';
      case 'Draft':
      default:
        return 'Bản nháp';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackToList}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Chỉnh Sửa Bài Viết' : article.title}
            </h1>
            <p className="text-xs text-gray-500">Mã bài viết: {article._id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{isSaving ? 'Đang lưu...' : hasUnsavedChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu'}</span>
              </span>
              <button
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Bài Viết</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
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
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chuyên mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="News">Tin tức</option>
                    <option value="Alert">Cảnh báo</option>
                    <option value="Educational">Kiến thức</option>
                    <option value="Campaign">Chiến dịch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Xuất bản</option>
                    <option value="Scheduled">Lên lịch</option>
                  </select>
                </div>
              </div>

              <FeaturedMediaUpload value={coverImageUrl} onChange={setCoverImageUrl} />
              <TargetAudienceSelector selected={targetAudience} onChange={setTargetAudience} />
              {status === 'Scheduled' && (
                <PublishingSchedulePicker value={scheduledAt} onChange={setScheduledAt} />
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nội dung chi tiết</label>
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
                    {getCategoryLabel(article.category)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {getStatusLabel(article.status)}
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
                    <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{article.readTimeMinutes} phút đọc</span>
                  </span>
                </div>

                <div className="prose max-w-none text-gray-800 text-sm leading-relaxed pt-2">
                  {article.bodyContent ? (
                    <div dangerouslySetInnerHTML={{ __html: article.bodyContent }} />
                  ) : (
                    <p className="text-gray-400 italic">Chưa có nội dung bài viết.</p>
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
            <h4 className="font-semibold text-gray-900 uppercase tracking-wider">Thông tin chung</h4>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Đối tượng mục tiêu</span>
              <span className="font-medium text-gray-900">
                {article.targetAudience?.map(a => a === 'Donors' ? 'Người hiến máu' : a === 'Staff' ? 'Nhân viên' : 'Bệnh viện').join(', ') || 'Người hiến máu'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Ngày tạo</span>
              <span className="font-medium text-gray-900">{new Date(article.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Cập nhật lần cuối</span>
              <span className="font-medium text-gray-900">{new Date(article.updatedAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Hủy các thay đổi</h3>
            <p className="text-xs text-gray-600 mb-4">
              Bạn có chắc chắn muốn hủy các thay đổi? Nội dung gốc của bài viết sẽ được khôi phục.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Hủy thay đổi
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
