import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, MapPin, Users, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createCampaignSchema } from '../schemas/campaignSchema';
import type { CreateCampaignInput } from '../schemas/campaignSchema';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { apiService } from '../../../services/apiClient';

const BLOOD_GROUPS = ['All Types', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CreateCampaignPage: React.FC = () => {
  useTranslation();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      fullAddress: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      targetBloodGroups: ['O+', 'A+', 'B+'],
      capacity: 100,
      targetUnitsGoal: 100,
      contactPerson: {
        name: '',
        phone: '',
      },
      status: 'Active',
      timeslots: [
        { startTime: '07:30', endTime: '11:30', capacity: 50, registeredCount: 0 },
        { startTime: '13:30', endTime: '16:30', capacity: 50, registeredCount: 0 }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'timeslots',
  });

  const selectedBloodGroups = watch('targetBloodGroups') || [];

  const toggleBloodGroup = (group: string) => {
    if (group === 'All Types') {
      if (selectedBloodGroups.includes('All Types')) {
        setValue('targetBloodGroups', [], { shouldValidate: true, shouldDirty: true });
      } else {
        setValue('targetBloodGroups', ['All Types'], { shouldValidate: true, shouldDirty: true });
      }
      return;
    }

    if (selectedBloodGroups.includes(group)) {
      setValue(
        'targetBloodGroups',
        selectedBloodGroups.filter((g) => g !== group),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      const newGroups = selectedBloodGroups.filter((g) => g !== 'All Types');
      setValue('targetBloodGroups', [...newGroups, group], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Auto calculate total capacity
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('timeslots') || name === 'startDate' || name === 'endDate') {
        const slots = value.timeslots || [];
        const start = value.startDate ? new Date(value.startDate as string) : null;
        const end = value.endDate ? new Date(value.endDate as string) : null;
        
        let days = 1;
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = Math.abs(end.getTime() - start.getTime());
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const dailyCapacity = slots.reduce((total, slot) => total + (Number(slot?.capacity) || 0), 0);
        const totalCapacity = dailyCapacity * days;
        
        setValue('capacity', totalCapacity, { shouldValidate: true, shouldDirty: true });
        
        // Auto update targetUnitsGoal to keep it at 80%
        setValue('targetUnitsGoal', Math.round(totalCapacity * 0.8), { shouldValidate: true, shouldDirty: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = async (data: CreateCampaignInput) => {
    try {
      await apiService.createCampaign({
        bloodCenterId: 'bc-01',
        name: data.name,
        description: data.description || data.name,
        venue: data.venue,
        fullAddress: data.fullAddress,
        startDate: data.startDate,
        endDate: data.endDate,
        targetBloodGroups: data.targetBloodGroups,
        capacity: data.capacity,
        targetUnitsGoal: data.targetUnitsGoal,
        contactPerson: data.contactPerson,
        timeslots: data.timeslots,
        status: data.status,
      });
      toast.success('Tạo chiến dịch hiến máu thành công!');
      navigate('/bc/campaigns');
    } catch (err) {
      toast.error('Tạo chiến dịch thất bại. Vui lòng thử lại.');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate('/bc/campaigns');
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900">Tạo Chiến Dịch Mới</h2>
          <p className="text-xs text-slate-500">
            Điền đầy đủ thông tin để tổ chức đợt hiến máu lưu động
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

          {/* Description */}
          <div className="md:col-span-2">
            <FormField label="Mô tả chi tiết chiến dịch" error={errors.description?.message}>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Nhập nội dung mô tả, mục đích và lưu ý dành cho người tham gia hiến máu..."
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
                  placeholder="VD: Ủy ban Nhân dân Quận 1"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </div>
            </FormField>
          </div>

          {/* Full Address */}
          <div className="md:col-span-2">
            <FormField label="Địa chỉ chi tiết" required error={errors.fullAddress?.message}>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  {...register('fullAddress')}
                  placeholder="VD: 47 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </div>
            </FormField>
          </div>

          {/* Start Date */}
          <FormField label="NGÀY BẮT ĐẦU" required error={errors.startDate?.message}>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* End Date */}
          <FormField label="NGÀY KẾT THÚC" required error={errors.endDate?.message}>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* Capacity */}
          <FormField label="Tổng chỉ tiêu (Tự động tính)" required error={errors.capacity?.message}>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                readOnly
                {...register('capacity', { valueAsNumber: true })}
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 outline-none cursor-not-allowed font-medium"
              />
            </div>
          </FormField>

          {/* Target Units Goal */}
          <FormField label="Mục tiêu đơn vị máu" required error={errors.targetUnitsGoal?.message}>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                {...register('targetUnitsGoal', { valueAsNumber: true })}
                placeholder="100"
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </div>
          </FormField>

          {/* Contact Person Name */}
          <FormField label="Tên người liên hệ" required error={errors.contactPerson?.name?.message}>
            <input
              type="text"
              {...register('contactPerson.name')}
              placeholder="Nguyễn Văn A"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* Contact Person Phone */}
          <FormField label="SĐT người liên hệ" required error={errors.contactPerson?.phone?.message}>
            <input
              type="text"
              {...register('contactPerson.phone')}
              placeholder="0901234567"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
            />
          </FormField>

          {/* Initial Status */}
          <FormField label="Trạng thái khởi tạo" required error={errors.status?.message}>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
            >
              <option value="Draft">Bản nháp (Draft)</option>
              <option value="Upcoming">Sắp diễn ra (Upcoming)</option>
              <option value="Registration Pending">Chờ đăng ký (Registration Pending)</option>
              <option value="Active">Đang mở (Active)</option>
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
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
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

          {/* Timeslots */}
          <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">Cấu hình khung giờ (Timeslots)</label>
              <button
                type="button"
                onClick={() => append({ startTime: '07:30', endTime: '11:30', capacity: 50, registeredCount: 0 })}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm khung giờ
              </button>
            </div>
            
            {errors.timeslots && !Array.isArray(errors.timeslots) && (
              <p className="text-xs text-red-600">{errors.timeslots.message as string}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <FormField label="Giờ bắt đầu" required error={errors.timeslots?.[index]?.startTime?.message}>
                    <input
                      type="time"
                      {...register(`timeslots.${index}.startTime` as const)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                    />
                  </FormField>
                  
                  <FormField label="Giờ kết thúc" required error={errors.timeslots?.[index]?.endTime?.message}>
                    <input
                      type="time"
                      {...register(`timeslots.${index}.endTime` as const)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                    />
                  </FormField>
                  
                  <FormField label="Chỉ tiêu" required error={errors.timeslots?.[index]?.capacity?.message}>
                    <input
                      type="number"
                      {...register(`timeslots.${index}.capacity` as const, { valueAsNumber: true })}
                      placeholder="50"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white"
                    />
                  </FormField>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors sm:mb-1"
                    title="Xóa khung giờ này"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit & Cancel Actions */}
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
            <span>{isSubmitting ? 'Đang lưu...' : 'Lưu chiến dịch'}</span>
          </button>
        </div>
      </form>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy bỏ tạo chiến dịch?"
        message="Thông tin bạn đã nhập sẽ không được lưu lại. Bạn có chắc chắn muốn hủy không?"
        confirmLabel="Hủy bỏ"
        cancelLabel="Tiếp tục chỉnh sửa"
        onConfirm={() => navigate('/bc/campaigns')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
