import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createArticleSchema } from '../schemas/articleSchema';
import type { CreateArticleInput } from '../schemas/articleSchema';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { apiService } from '../../../services/apiClient';

export const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: '',
      category: 'Sức Khỏe',
      bodyContent: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=80',
      status: 'Published',
    },
  });

  const onSubmit = async (data: CreateArticleInput) => {
    try {
      await apiService.createArticle({
        title: data.title,
        category: data.category,
        bodyContent: `<p>${data.bodyContent}</p>`,
        imageUrls: [data.thumbnailUrl],
        status: data.status,
        publishedAt: data.status === 'Published' ? new Date().toISOString() : null,
      });
      toast.success('Đã xuất bản bài viết thành công!');
      navigate('/bc/content');
    } catch (err) {
      toast.error('Đăng bài thất bại. Vui lòng thử lại.');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate('/bc/content');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tạo Bài Viết Truyền Thông Mới</h2>
          <p className="text-xs text-slate-500">Soạn thảo bài viết tuyên truyền sức khỏe và thông báo</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <FormField label="Tiêu đề bài viết" required error={errors.title?.message}>
          <input
            type="text"
            {...register('title')}
            placeholder="VD: Những Lưu Ý Quan Trọng Trước Và Sau Khi Hiến Máu"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Danh mục bài viết" required error={errors.category?.message}>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
            >
              <option value="Sức Khỏe">Sức Khỏe & Y Học</option>
              <option value="Chiến Dịch">Thông Báo Chiến Dịch</option>
              <option value="Tuyên Truyền">Tuyên Truyền Hiến Máu</option>
            </select>
          </FormField>

          <FormField label="Trạng thái xuất bản" required error={errors.status?.message}>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
            >
              <option value="Published">Xuất bản ngay (Published)</option>
              <option value="Draft">Lưu bản nháp (Draft)</option>
            </select>
          </FormField>
        </div>

        <FormField label="Link ảnh đại diện (Thumbnail URL)" required error={errors.thumbnailUrl?.message}>
          <div className="relative">
            <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              {...register('thumbnailUrl')}
              placeholder="https://images.unsplash.com/..."
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </div>
        </FormField>

        {/* Content Body Editor Textarea */}
        <FormField label="Nội dung chi tiết bài viết" required error={errors.bodyContent?.message}>
          <textarea
            rows={10}
            {...register('bodyContent')}
            placeholder="Nhập nội dung bài viết chi tiết tại đây..."
            className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none leading-relaxed font-sans"
          />
        </FormField>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang xuất bản...' : 'Xuất bản bài viết'}</span>
          </button>
        </div>
      </form>

      {/* Discard Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy bài viết?"
        message="Nội dung bài viết chưa lưu sẽ bị mất. Bạn có chắc muốn hủy bỏ không?"
        onConfirm={() => navigate('/bc/content')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
