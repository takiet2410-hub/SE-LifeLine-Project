import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import type { ArticleData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format } from 'date-fns';

// S-07 FIX: Sanitize HTML để ngăn XSS từ article content
// Strip các tag/attribute nguy hiểm: <script>, onerror=, onclick=, javascript:, ...
const sanitizeHtml = (html: string): string => {
  return html
    // Xóa toàn bộ <script>...</script> block
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Xóa toàn bộ <iframe>, <object>, <embed>
    .replace(/<(iframe|object|embed|form|input|button)[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button)[^>]*\/?>/gi, '')
    // Xóa inline event handlers: onclick=, onerror=, onload=, etc.
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    // Xóa javascript: protocol
    .replace(/javascript\s*:/gi, 'blocked:')
    // Xóa data: URI (có thể chứa base64 script)
    .replace(/data\s*:[^,]*base64/gi, 'blocked:');
};


export const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Form edit states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Unpublished'>('Published');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (articleId) {
      apiService.getArticleById(articleId).then((data) => {
        setArticle(data);
        if (data) {
          setTitle(data.title);
          setCategory(data.category);
          setBodyContent(data.bodyContent.replace(/<[^>]+>/g, ''));
          setStatus(data.status);
        }
        setLoading(false);
      });
    }
  }, [articleId]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleCancelEdit = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      setIsEditing(false);
    }
  };

  const confirmDiscard = () => {
    if (article) {
      setTitle(article.title);
      setCategory(article.category);
      setBodyContent(article.bodyContent.replace(/<[^>]+>/g, ''));
      setStatus(article.status);
    }
    setIsDirty(false);
    setShowDiscardDialog(false);
    setIsEditing(false);
    toast.info('Đã hủy các thay đổi.');
  };

  const handleSave = async () => {
    if (!articleId) return;
    try {
      const updated = await apiService.updateArticle(articleId, {
        title,
        category,
        bodyContent: `<p>${bodyContent}</p>`,
        status,
      });
      setArticle(updated);
      setIsEditing(false);
      setIsDirty(false);
      toast.success('Cập nhật bài viết thành công!');
    } catch (err) {
      toast.error('Cập nhật bài viết thất bại.');
    }
  };

  if (loading) return <SkeletonLoader type="form" />;
  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy bài viết.</p>
        <button
          onClick={() => navigate('/bc/content')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isEditing && isDirty) {
                setShowDiscardDialog(true);
              } else {
                navigate('/bc/content');
              }
            }}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 truncate max-w-lg">
                {isEditing ? 'Chỉnh Sửa Bài Viết' : article.title}
              </h2>
              <StatusBadge status={isEditing ? status : article.status} />
            </div>
            <p className="text-xs text-slate-500">Mã bài viết: {article._id}</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh sửa bài viết</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {!isEditing ? (
          /* View Mode */
          <div className="space-y-6">
            <div className="h-64 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={article.imageUrls[0] || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=80'}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-4">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {article.authorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {format(new Date(article.createdAt), 'dd/MM/yyyy HH:mm')}
              </span>
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold text-slate-600">
                {article.category}
              </span>
            </div>

            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.bodyContent) }}
            />
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tiêu đề bài viết
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                >
                  <option value="Sức Khỏe">Sức Khỏe & Y Học</option>
                  <option value="Chiến Dịch">Thông Báo Chiến Dịch</option>
                  <option value="Tuyên Truyền">Tuyên Truyền Hiến Máu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                >
                  <option value="Published">Đã xuất bản (Published)</option>
                  <option value="Draft">Bản nháp (Draft)</option>
                  <option value="Unpublished">Hủy xuất bản (Unpublished)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nội dung chi tiết
              </label>
              <textarea
                rows={10}
                value={bodyContent}
                onChange={(e) => {
                  setBodyContent(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none leading-relaxed font-sans"
              />
            </div>
          </div>
        )}
      </div>

      {/* Discard Unsaved Changes Guard Dialog (BC-UC-09 AF-02) */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Hủy bỏ thay đổi?"
        message="Bạn có thay đổi chưa lưu trên bài viết này. Bạn có chắc muốn hủy bỏ các chỉnh sửa không?"
        confirmLabel="Hủy bỏ thay đổi"
        cancelLabel="Tiếp tục sửa"
        onConfirm={confirmDiscard}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </div>
  );
};
