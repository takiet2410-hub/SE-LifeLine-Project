import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { FeaturedMediaUpload } from '../components/FeaturedMediaUpload';
import { TargetAudienceSelector } from '../components/TargetAudienceSelector';
import { PublishingSchedulePicker } from '../components/PublishingSchedulePicker';
import { useAutosave } from '../hooks/useAutosave';
import type { ArticleCategory, ArticleStatus, TargetAudience } from '../types/article.types';

export const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/hospital') ? '/hospital' : '/bc';

  const [draftId, setDraftId] = useState<string | null>(null);
  const draftIdRef = React.useRef<string | null>(null);
  const [title, setTitle] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('News');
  const [status, setStatus] = useState<ArticleStatus>('Draft');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(['Donors']);

  const [errors, setErrors] = useState<{ title?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const articleFormState = { title, bodyContent, category, status, coverImageUrl, scheduledAt, targetAudience };

  const { hasUnsavedChanges, lastSavedTime, isSaving, markSaved } = useAutosave({
    data: articleFormState,
    onSave: async (data) => {
      if (!data.title.trim() || isSubmitting) return;
      const payload = {
        title: data.title,
        bodyContent: data.bodyContent,
        category: data.category,
        status: 'Draft' as ArticleStatus,
        coverImageUrl: data.coverImageUrl,
        scheduledAt: data.scheduledAt,
        targetAudience: data.targetAudience
      };
      
      const currentId = draftIdRef.current || draftId;
      if (currentId) {
        await articleApi.updateArticle(currentId, payload);
      } else {
        const res = await articleApi.createArticle(payload);
        if (res.success && res.data?._id) {
          draftIdRef.current = res.data._id;
          setDraftId(res.data._id);
        }
      }
    },
    enabled: !isSubmitting
  });

  const handleBackToList = () => {
    const contentSearch = location.state?.fromContentSearch || location.state?.fromSearch || '';
    navigate(`${basePath}/content${contentSearch}`);
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      handleBackToList();
    }
  };

  const handleSave = async (targetStatus: ArticleStatus) => {
    setErrors({});
    if (!title.trim()) {
      setErrors({ title: 'Vui lòng nhập tiêu đề bài viết' });
      return;
    }

    if (targetStatus === 'Scheduled' && !scheduledAt) {
      setErrors({ general: 'Vui lòng chọn ngày và giờ lên lịch xuất bản' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        bodyContent,
        category,
        status: targetStatus,
        coverImageUrl,
        scheduledAt: targetStatus === 'Scheduled' ? scheduledAt : null,
        targetAudience
      };

      let res;
      const currentId = draftIdRef.current || draftId;
      if (currentId) {
        res = await articleApi.updateArticle(currentId, payload);
      } else {
        res = await articleApi.createArticle(payload);
        if (res.success && res.data?._id) {
          draftIdRef.current = res.data._id;
          setDraftId(res.data._id);
        }
      }

      if (res.success) {
        markSaved();
        setToastMessage(
          res.message ||
            (targetStatus === 'Published'
              ? 'Xuất bản bài viết thành công'
              : targetStatus === 'Scheduled'
              ? 'Lên lịch bài viết thành công'
              : 'Lưu bài viết thành công')
        );
        setTimeout(() => {
          handleBackToList();
        }, 1200);
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Không thể lưu bài viết' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex min-w-0 items-start sm:items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleCancelClick}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Bài Viết Mới</h1>
            <p className="text-xs text-gray-500">Soạn thảo hoặc xuất bản tin tức, cảnh báo và kiến thức hiến máu</p>
          </div>
        </div>

        {/* Autosave status indicator */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="w-full sm:w-auto text-xs text-gray-500 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {isSaving
                ? 'Đang lưu bản nháp...'
                : lastSavedTime
                ? `Tự động lưu ${Math.max(1, Math.round((Date.now() - lastSavedTime.getTime()) / 60000))} phút trước`
                : hasUnsavedChanges
                ? 'Có thay đổi chưa lưu'
                : 'Bản nháp sẵn sàng'}
            </span>
          </span>

          <button
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 text-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Bản Nháp</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(status === 'Scheduled' ? 'Scheduled' : 'Published')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 text-sm flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{status === 'Scheduled' ? 'Lên Lịch Bài Viết' : 'Xuất Bản Bài Viết'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Kế hoạch hiến máu khẩn cấp mùa hè 2026..."
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.title ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Category & Status Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên mục bài viết</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ArticleCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 cursor-pointer"
            >
              <option value="News">Tin tức & Cập nhật</option>
              <option value="Alert">Cảnh báo khẩn cấp</option>
              <option value="Educational">Kiến thức & Sức khỏe</option>
              <option value="Campaign">Thông báo chiến dịch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái & Hiển thị</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 cursor-pointer"
            >
              <option value="Draft">Bản nháp (Chỉ nội bộ xem)</option>
              <option value="Published">Xuất bản (Công khai)</option>
              <option value="Scheduled">Lên lịch (Tự động đăng)</option>
            </select>
          </div>
        </div>

        {/* Featured Media */}
        <FeaturedMediaUpload value={coverImageUrl} onChange={setCoverImageUrl} />

        {/* Target Audience */}
        <TargetAudienceSelector selected={targetAudience} onChange={setTargetAudience} />

        {/* Publishing Schedule - Only show when status is Scheduled */}
        {status === 'Scheduled' && (
          <PublishingSchedulePicker value={scheduledAt} onChange={setScheduledAt} />
        )}

        {/* Body content rich text editor */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Nội dung bài viết
          </label>
          <textarea
            rows={10}
            value={bodyContent}
            onChange={(e) => setBodyContent(e.target.value)}
            placeholder="Nhập toàn bộ nội dung chi tiết bài viết tại đây..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Thay đổi chưa lưu</h3>
            <p className="text-xs text-gray-600 mb-4">
              Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi? Các chỉnh sửa gần đây sẽ bị mất.
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
                onClick={handleBackToList}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Hủy thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
