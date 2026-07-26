import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import type { RegistrationData } from '../../../services/mockData';
import { screeningSchema } from '../schemas/campaignSchema';
import type { ScreeningInput } from '../schemas/campaignSchema';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { FormField } from '../../../components/common/FormField';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';

export const RegistrationDetailPage: React.FC = () => {
  const { campaignId, registrationId } = useParams<{ campaignId: string; registrationId: string }>();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScreeningInput>({
    resolver: zodResolver(screeningSchema),
  });

  useEffect(() => {
    if (registrationId) {
      apiService.getRegistrationById(registrationId).then((data) => {
        setRegistration(data);
        if (data) {
          reset({
            bloodPressure: data.bloodPressure || '120/80',
            weight: data.weight || 60,
            bodyTemperature: data.bodyTemperature || 36.5,
            hemoglobinLevel: data.hemoglobinLevel || 13.0,
            screeningNotes: data.screeningNotes || '',
            status: data.status,
          });
        }
        setLoading(false);
      });
    }
  }, [registrationId, reset]);

  const onSubmit = async (data: ScreeningInput) => {
    if (!registrationId) return;
    try {
      const updated = await apiService.updateRegistration(registrationId, {
        bloodPressure: data.bloodPressure,
        weight: data.weight,
        bodyTemperature: data.bodyTemperature,
        hemoglobinLevel: data.hemoglobinLevel,
        screeningNotes: data.screeningNotes,
        status: data.status,
      });
      setRegistration(updated);
      toast.success('Cập nhật kết quả sàng lọc và trạng thái thành công!');
    } catch (err) {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  if (loading) return <SkeletonLoader type="form" />;
  if (!registration) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy thông tin lượt đăng ký.</p>
        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId}/registrations`)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId}/registrations`)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Chi Tiết Sàng Lọc & Khám Sức Khỏe</h2>
            <StatusBadge status={registration.status} />
          </div>
          <p className="text-xs text-slate-500">Mã đăng ký: {registration._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Donor Profile Info (Masked CCCD) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold text-lg flex items-center justify-center border border-red-200">
              {registration.donorBloodType}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{registration.donorName}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-red-600 text-white rounded-full">
                Nhóm máu {registration.donorBloodType}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Số CCCD / Định danh</span>
              <span className="font-mono text-slate-800 font-semibold">
                {registration.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Ngày sinh</span>
              <span className="text-slate-800 font-medium">{registration.donorDob}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Số điện thoại</span>
              <span className="text-slate-800 font-medium">{registration.donorPhone}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Medical Screening Form & Status Update */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6"
        >
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-red-600" />
            <span>Kết quả khám lâm sàng & Đánh giá thể trạng</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Huyết áp (mmHg)" required error={errors.bloodPressure?.message}>
              <input
                type="text"
                {...register('bloodPressure')}
                placeholder="120/80"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>

            <FormField label="Cân nặng (kg)" required error={errors.weight?.message}>
              <input
                type="number"
                step="0.1"
                {...register('weight', { valueAsNumber: true })}
                placeholder="60"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>

            <FormField label="Thân nhiệt (°C)" required error={errors.bodyTemperature?.message}>
              <input
                type="number"
                step="0.1"
                {...register('bodyTemperature', { valueAsNumber: true })}
                placeholder="36.5"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>

            <FormField label="Hemoglobin (g/dL)" required error={errors.hemoglobinLevel?.message}>
              <input
                type="number"
                step="0.1"
                {...register('hemoglobinLevel', { valueAsNumber: true })}
                placeholder="13.0"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Ghi chú bác sĩ khám" error={errors.screeningNotes?.message}>
                <textarea
                  rows={3}
                  {...register('screeningNotes')}
                  placeholder="Ghi chú chi tiết về tình trạng sức khỏe..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Quyết định đủ điều kiện & Trạng thái" required error={errors.status?.message}>
                <select
                  {...register('status')}
                  className="w-full px-3.5 py-2 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                >
                  <option value="Eligible">🟢 Đủ điều kiện hiến máu (Eligible)</option>
                  <option value="Ineligible">🔴 Không đủ điều kiện (Ineligible)</option>
                  <option value="Completed">✨ Đã hoàn tất hiến máu (Completed)</option>
                  <option value="CheckedIn">🟡 Đã điểm danh (CheckedIn)</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang cập nhật...' : 'Cập nhật kết quả khám'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
