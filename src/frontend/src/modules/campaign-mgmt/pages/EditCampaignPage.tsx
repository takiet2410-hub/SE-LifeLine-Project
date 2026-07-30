import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createCampaignSchema } from '../schemas/campaignSchema';
import type { CreateCampaignInput } from '../schemas/campaignSchema';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { apiService } from '../../../services/apiClient';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const formatForDateTimeInput = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export const EditCampaignPage: React.FC = () => {
  useTranslation();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      venue: '',
      startDateTime: '',
      endDateTime: '',
      targetBloodGroups: ['O+', 'A+', 'B+'],
      capacity: 100,
      status: 'Active',
    },
  });

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      apiService.getCampaignById(campaignId).then((campaign) => {
        if (campaign) {
          reset({
            name: campaign.name || '',
            venue: campaign.venue || (campaign as any).fullAddress || '',
            startDateTime: formatForDateTimeInput(campaign.startDateTime),
            endDateTime: formatForDateTimeInput(campaign.endDateTime),
            targetBloodGroups: campaign.targetBloodGroups || ['O+', 'A+'],
            capacity: campaign.capacity || 100,
            status: (campaign.status as any) || 'Active',
          });
        } else {
          toast.error('Không tìm thấy thông tin chiến dịch');
          navigate('/bc/campaigns');
        }
        setLoading(false);
      }).catch((err) => {
        console.error(err);
        toast.error('Lỗi khi tải thông tin chiến dịch');
        setLoading(false);
      });
    }
  }, [campaignId, reset, navigate]);

  const selectedBloodGroups = watch('targetBloodGroups') || [];

  const toggleBloodGroup = (group: string) => {
    if (selectedBloodGroups.includes(group)) {
      setValue(
        'targetBloodGroups',
        selectedBloodGroups.filter((g) => g !== group),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      setValue('targetBloodGroups', [...selectedBloodGroups, group], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const onSubmit = async (data: CreateCampaignInput) => {
    if (!campaignId) return;
    try {
      await apiService.updateCampaign(campaignId, {
        name: data.name,
        venue: data.venue,
        startDateTime: new Date(data.startDateTime).toISOString(),
        endDateTime: new Date(data.endDateTime).toISOString(),
        targetBloodGroups: data.targetBloodGroups,
        capacity: data.capacity,
        status: data.status,
      });
      toast.success('Cập nhật thông tin chiến dịch thành công!');
      navigate(`/bc/campaigns/${campaignId}`);
    } catch (err) {
      toast.error('Cập nhật chiến dịch thất bại. Vui lòng kiểm tra lại.');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate('/bc/campaigns');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SkeletonLoader type="form" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chỉnh Sửa Chiến Dịch</h2>
          <p className="text-xs text-slate-500">
            Cập nhật thông tin chi tiết của đợt hiến máu lưu động
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Name */}
          <div className="md:col-span-2">
            <FormField label="Tên chiến dịch" required error={errors.name?.message}>
              <input
                type="text"
                {...register('name')}
                placeholder="VD: Ngày Hội Hiến Máu Tình Nguyện Mùa Hè 2026"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>
          </div>

          {/* Venue */}
          <div className="md:col-span-2">
            <FormField label="Địa điểm tổ chức" required error={errors.venue?.message}>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  {...register('venue')}
                  placeholder="VD: Ủy ban Nhân dân Quận 1, 47 Lê Duẩn..."
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </div>
            </FormField>
          </div>

          {/* Start Date */}
          <FormField label="Thời gian bắt đầu" required error={errors.startDateTime?.message}>
            <input
              type="datetime-local"
              {...register('startDateTime')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* End Date */}
          <FormField label="Thời gian kết thúc" required error={errors.endDateTime?.message}>
            <input
              type="datetime-local"
              {...register('endDateTime')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* Capacity */}
          <FormField label="Chỉ tiêu người đăng ký" required error={errors.capacity?.message}>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                placeholder="100"
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </div>
          </FormField>

          {/* Status */}
          <FormField label="Trạng thái chiến dịch" required error={errors.status?.message}>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
            >
              <option value="Active">Đang mở (Active)</option>
              <option value="Draft">Bản nháp (Draft)</option>
              <option value="Full">Đã đủ (Full)</option>
              <option value="Completed">Đã hoàn thành (Completed)</option>
              <option value="Cancelled">Đã hủy (Cancelled)</option>
            </select>
          </FormField>

          {/* Target Blood Groups Multi-Select */}
          <div className="md:col-span-2">
            <FormField label="Nhóm máu ưu tiên tiếp nhận" required error={errors.targetBloodGroups?.message}>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                {BLOOD_GROUPS.map((group) => {
                  const isChecked = selectedBloodGroups.includes(group);
                  return (
                    <button
                      type="button"
                      key={group}
                      onClick={() => toggleBloodGroup(group)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang lưu...' : 'Cập nhật chiến dịch'}</span>
          </button>
        </div>
      </form>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy bỏ chỉnh sửa?"
        message="Những thay đổi chưa lưu sẽ bị hủy. Bạn có chắc chắn muốn thoát không?"
        confirmLabel="Rời khỏi"
        cancelLabel="Tiếp tục chỉnh sửa"
        onConfirm={() => navigate('/bc/campaigns')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};

export default EditCampaignPage;
