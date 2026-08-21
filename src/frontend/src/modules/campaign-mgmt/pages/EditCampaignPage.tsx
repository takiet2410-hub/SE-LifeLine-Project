import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, MapPin, Users, Plus, Trash2, Calendar, Copy, AlertTriangle, Building2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createCampaignSchema } from '../schemas/campaignSchema';
import type { CreateCampaignInput } from '../schemas/campaignSchema';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { apiService } from '../../../services/apiClient';

const BLOOD_GROUPS = ['All Types', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface DailySlot {
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount?: number;
  isInitiallyLocked?: boolean;
}

const formatDateToYYYYMMDD = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return '';
  }
};

const formatSlotTime = (timeVal: any, defaultVal: string = '07:30'): string => {
  if (!timeVal) return defaultVal;
  if (typeof timeVal === 'string' && !timeVal.includes('T')) {
    return timeVal;
  }
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return defaultVal;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return defaultVal;
  }
};

const getSlotDiffMinutes = (sTime: string, eTime: string) => {
  if (!sTime || !eTime) return 0;
  const [h1, m1] = sTime.split(':').map(Number);
  const [h2, m2] = eTime.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

export const EditCampaignPage: React.FC = () => {
  useTranslation();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCampaignEnded, setIsCampaignEnded] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<string>('Upcoming');

  // Today string for past-date detection
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

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
      description: '',
      venue: '',
      fullAddress: '',
      startDate: todayStr,
      endDate: todayStr,
      targetBloodGroups: ['O+', 'A+', 'B+'],
      capacity: 100,
      targetUnitsGoal: 8000,
      contactPerson: { name: '', phone: '' },
      isDraft: false,
    },
  });

  const startDateWatch = watch('startDate');
  const endDateWatch = watch('endDate');
  const selectedBloodGroups = watch('targetBloodGroups') || [];
  const isDraftWatch = watch('isDraft');

  // Compute array of dates between startDate and endDate in local time
  const dateList = useMemo(() => {
    if (!startDateWatch || !endDateWatch) return [todayStr];
    const list: string[] = [];
    try {
      const [sY, sM, sD] = startDateWatch.split('-').map(Number);
      const [eY, eM, eD] = endDateWatch.split('-').map(Number);
      if (isNaN(sY) || isNaN(sM) || isNaN(sD) || isNaN(eY) || isNaN(eM) || isNaN(eD)) {
        return [startDateWatch];
      }
      const cur = new Date(sY, sM - 1, sD);
      const end = new Date(eY, eM - 1, eD);
      if (end < cur) return [startDateWatch];

      const pad = (n: number) => n.toString().padStart(2, '0');
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = pad(cur.getMonth() + 1);
        const d = pad(cur.getDate());
        list.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
    } catch {
      return [startDateWatch || todayStr];
    }
    return list.length > 0 ? list : [startDateWatch || todayStr];
  }, [startDateWatch, endDateWatch, todayStr]);

  // Selected date tab for timeslot configuration
  const [activeDateTab, setActiveDateTab] = useState<string>(todayStr);

  // Per-date timeslot storage: Record<dateStr, DailySlot[]>
  const [slotsByDate, setSlotsByDate] = useState<Record<string, DailySlot[]>>({
    [todayStr]: [
      { startTime: '07:30', endTime: '11:30', capacity: 50 },
      { startTime: '13:30', endTime: '16:30', capacity: 50 },
    ],
  });

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      apiService.getCampaignById(campaignId).then((campaign) => {
        if (campaign) {
          const finalSDate = formatDateToYYYYMMDD(campaign.startDateTime || (campaign as any).startDate) || todayStr;
          const finalEDate = formatDateToYYYYMMDD(campaign.endDateTime || (campaign as any).endDate) || finalSDate;

          const ended =
            campaign.status === 'Completed' ||
            campaign.status === 'Cancelled' ||
            Boolean(campaign.status !== 'Draft' && campaign.endDateTime && new Date(campaign.endDateTime).getTime() < new Date().getTime());
          setIsCampaignEnded(ended);
          setOriginalStatus(campaign.status || 'Upcoming');

          // Normalize loaded blood groups
          let loadedBloodGroups: string[] = campaign.targetBloodGroups || ['O+', 'A+'];
          if (loadedBloodGroups.includes('ALL TYPES') || loadedBloodGroups.includes('ALL') || loadedBloodGroups.includes('All')) {
            loadedBloodGroups = ['All Types'];
          }

          reset({
            name: campaign.name || '',
            description: campaign.description || '',
            venue: campaign.venue || '',
            fullAddress: campaign.fullAddress || campaign.venue || '',
            startDate: finalSDate,
            endDate: finalEDate,
            targetBloodGroups: loadedBloodGroups,
            capacity: campaign.capacity || 100,
            targetUnitsGoal: campaign.targetUnitsGoal || 8000,
            contactPerson: campaign.contactPerson || { name: '', phone: '' },
            isDraft: campaign.status === 'Draft',
          });

          // Build slotsByDate from dailyTimeslots or timeslots
          const initialSlots: Record<string, DailySlot[]> = {};
          const nowLoad = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const nowLoadTime = `${pad(nowLoad.getHours())}:${pad(nowLoad.getMinutes())}`;

          if (campaign.dailyTimeslots && campaign.dailyTimeslots.length > 0) {
            campaign.dailyTimeslots.forEach((dt: any) => {
              const dKey = dt.dateStr || (dt.startTime && typeof dt.startTime === 'string' && dt.startTime.includes('T') ? dt.startTime.split('T')[0] : finalSDate);
              if (!initialSlots[dKey]) initialSlots[dKey] = [];
              
              const sTime = formatSlotTime(dt.startTime, '07:30');
              const eTime = formatSlotTime(dt.endTime, '11:30');
              const isPastDate = dKey < todayStr;
              const isPastTime = dKey === todayStr && sTime <= nowLoadTime;

              initialSlots[dKey].push({
                startTime: sTime,
                endTime: eTime,
                capacity: dt.capacity || 50,
                registeredCount: dt.registeredCount || 0,
                isInitiallyLocked: isPastDate || isPastTime,
              });
            });
          } else if (campaign.timeslots && campaign.timeslots.length > 0) {
            initialSlots[finalSDate] = campaign.timeslots.map((s: any) => {
              const sTime = formatSlotTime(s.startTime, '07:30');
              const isPastDate = finalSDate < todayStr;
              const isPastTime = finalSDate === todayStr && sTime <= nowLoadTime;
              return {
                startTime: sTime,
                endTime: formatSlotTime(s.endTime, '11:30'),
                capacity: Number(s.capacity) || 50,
                isInitiallyLocked: isPastDate || isPastTime,
              };
            });
          } else {
            initialSlots[finalSDate] = [
              { startTime: '07:30', endTime: '11:30', capacity: 50 },
              { startTime: '13:30', endTime: '16:30', capacity: 50 },
            ];
          }

          if (Object.keys(initialSlots).length > 0) {
            setSlotsByDate(initialSlots);
            setActiveDateTab(finalSDate);
          }
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
  }, [campaignId, reset, navigate, todayStr]);

  // Ensure active date tab is within dateList
  useEffect(() => {
    if (dateList.length > 0 && !dateList.includes(activeDateTab)) {
      setActiveDateTab(dateList[0]);
    }
  }, [dateList, activeDateTab]);

  // Initialize slots for new dates independently when date range changes
  useEffect(() => {
    if (loading) return;
    setSlotsByDate((prev) => {
      let changed = false;
      const next = { ...prev };
      dateList.forEach((d) => {
        if (!next[d]) {
          changed = true;
          next[d] = [
            { startTime: '07:30', endTime: '11:30', capacity: 50 },
            { startTime: '13:30', endTime: '16:30', capacity: 50 },
          ];
        }
      });
      return changed ? next : prev;
    });
  }, [dateList, loading]);

  // Calculate total capacity from all dates & slots (Do NOT overwrite targetUnitsGoal!)
  useEffect(() => {
    let totalCap = 0;
    dateList.forEach((d) => {
      const slots = slotsByDate[d] || [];
      slots.forEach((s) => {
        totalCap += Number(s.capacity) || 0;
      });
    });

    const finalCap = Math.max(1, totalCap);
    setValue('capacity', finalCap, { shouldValidate: true, shouldDirty: true });
  }, [slotsByDate, dateList, setValue]);

  const toggleBloodGroup = (group: string) => {
    if (isCampaignEnded) return;
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

  const currentActiveSlots = slotsByDate[activeDateTab] || [
    { startTime: '07:30', endTime: '11:30', capacity: 50 },
    { startTime: '13:30', endTime: '16:30', capacity: 50 },
  ];

  const isCurrentActiveTabPast = activeDateTab < todayStr || isCampaignEnded;

  const getNowTimeString = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const isIndividualSlotPast = (dateStr: string, slot?: DailySlot) => {
    if (isCampaignEnded) return true;
    if (dateStr < todayStr) return true;
    return Boolean(slot?.isInitiallyLocked);
  };

  const handleUpdateSlot = (index: number, field: keyof DailySlot, value: any) => {
    const slot = (slotsByDate[activeDateTab] || [])[index];
    if (isCampaignEnded || isCurrentActiveTabPast || (slot && slot.isInitiallyLocked)) return;

    setSlotsByDate((prev) => {
      const list = [...(prev[activeDateTab] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [activeDateTab]: list };
    });
  };

  const handleAddSlot = () => {
    if (isCampaignEnded || isCurrentActiveTabPast) return;
    setSlotsByDate((prev) => {
      const list = [...(prev[activeDateTab] || [])];
      const lastSlot = list[list.length - 1];
      let newStart = '13:30';
      let newEnd = '16:30';
      
      const nowTime = getNowTimeString();
      if (activeDateTab === todayStr && newStart < nowTime) {
        newStart = nowTime;
        const [h, m] = nowTime.split(':').map(Number);
        const endH = Math.min(23, h + 2);
        const pad = (n: number) => n.toString().padStart(2, '0');
        newEnd = `${pad(endH)}:${pad(m)}`;
      }

      if (lastSlot && lastSlot.endTime) {
        newStart = lastSlot.endTime;
        const [h, m] = lastSlot.endTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const endH = Math.min(23, h + 2);
          const pad = (n: number) => n.toString().padStart(2, '0');
          newEnd = `${pad(endH)}:${pad(m)}`;
        }
      }
      list.push({ startTime: newStart, endTime: newEnd, capacity: 50 });
      return { ...prev, [activeDateTab]: list };
    });
  };

  const handleRemoveSlot = (index: number) => {
    const slot = (slotsByDate[activeDateTab] || [])[index];
    if (isCampaignEnded || isCurrentActiveTabPast || (slot && slot.isInitiallyLocked)) return;
    setSlotsByDate((prev) => {
      const list = [...(prev[activeDateTab] || [])];
      if (list.length <= 1) {
        toast.warning('Mỗi ngày phải có ít nhất 1 khung giờ!');
        return prev;
      }
      list.splice(index, 1);
      return { ...prev, [activeDateTab]: list };
    });
  };

  const handleApplyToAllDates = () => {
    if (isCampaignEnded) return;
    const curSlots = slotsByDate[activeDateTab] || [];
    setSlotsByDate((prev) => {
      const next = { ...prev };
      dateList.forEach((d) => {
        // Only apply to current or future dates
        if (d >= todayStr) {
          next[d] = JSON.parse(JSON.stringify(curSlots));
        }
      });
      return next;
    });
    toast.success(`Đã áp dụng khung giờ ngày ${activeDateTab} cho các ngày chưa diễn ra!`);
  };

  const onSubmit = async (data: CreateCampaignInput) => {
    if (!campaignId) return;
    if (isCampaignEnded) {
      toast.error('Không thể chỉnh sửa chiến dịch đã kết thúc hoặc đã bị hủy!');
      return;
    }
    try {
      const nowTimeStr = getNowTimeString();

      // Validate timeslots min 30 minutes duration & non-overlap for future/current dates
      for (const d of dateList) {
        const slots = slotsByDate[d] || [];
        if (slots.length === 0) {
          toast.error(`Ngày ${d} phải có ít nhất 1 khung giờ tiếp nhận!`);
          return;
        }
        for (let i = 0; i < slots.length; i++) {
          const s = slots[i];
          const isSlotLocked = d < todayStr || Boolean(s.isInitiallyLocked);

          // Only validate startTime >= nowTimeStr for UNLOCKED / EDITABLE slots on today's date!
          if (d === todayStr && !isSlotLocked && s.startTime < nowTimeStr) {
            toast.error(`Khung giờ chỉnh sửa (${s.startTime}) ngày hôm nay (${d}) không được sớm hơn giờ hiện tại (${nowTimeStr})! Vui lòng chỉnh lại.`);
            return;
          }

          const diff = getSlotDiffMinutes(s.startTime, s.endTime);
          if (diff < 30) {
            toast.error(`Khung giờ (${s.startTime} - ${s.endTime}) ngày ${d} phải có thời lượng trễ hơn ít nhất 30 phút!`);
            return;
          }

          if (i > 0) {
            const prevEnd = slots[i - 1].endTime;
            const [ph2, pm2] = prevEnd.split(':').map(Number);
            const [ch1, cm1] = s.startTime.split(':').map(Number);
            const prevMins = ph2 * 60 + pm2;
            const curMins = ch1 * 60 + cm1;
            if (curMins < prevMins) {
              toast.error(`Khung giờ ${s.startTime} ngày ${d} phải bắt đầu sau hoặc bằng giờ kết thúc khung giờ trước (${prevEnd})!`);
              return;
            }
          }
        }
      }

      const dailyTimeslots: Array<{ dateStr: string; startTime: string; endTime: string; capacity: number; registeredCount: number }> = [];
      const patternSlots: Array<{ startTime: string; endTime: string; capacity: number; registeredCount: number }> = [];

      dateList.forEach((d) => {
        const slots = slotsByDate[d] || [];
        slots.forEach((s) => {
          dailyTimeslots.push({
            dateStr: d,
            startTime: s.startTime,
            endTime: s.endTime,
            capacity: Number(s.capacity) || 50,
            registeredCount: Number(s.registeredCount) || 0,
          });
        });
      });

      (slotsByDate[activeDateTab] || []).forEach((s) => {
        patternSlots.push({
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: Number(s.capacity) || 50,
          registeredCount: Number(s.registeredCount) || 0,
        });
      });

      const campaignStatus = data.isDraft
        ? 'Draft'
        : (originalStatus === 'Draft' ? 'Upcoming' : originalStatus);

      await apiService.updateCampaign(campaignId, {
        name: data.name,
        description: data.description || data.name,
        venue: data.venue,
        fullAddress: data.fullAddress,
        startDateTime: data.startDate,
        endDateTime: data.endDate,
        targetBloodGroups: data.targetBloodGroups,
        capacity: data.capacity,
        targetUnitsGoal: data.targetUnitsGoal,
        contactPerson: {
          name: data.contactPerson?.name || '',
          phone: data.contactPerson?.phone || '',
        },
        timeslots: patternSlots,
        dailyTimeslots,
        status: campaignStatus as any,
      });

      toast.success('Cập nhật thông tin chiến dịch thành công!');
      navigate(`/bc/campaigns/${campaignId}`);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Cập nhật chiến dịch thất bại. Vui lòng kiểm tra lại.';
      toast.error(errMsg);
    }
  };

  const handleCancel = () => {
    const targetPath = campaignId ? `/bc/campaigns/${campaignId}` : '/bc/campaigns';
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate(targetPath);
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
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chỉnh Sửa Chiến Dịch</h2>
          <p className="text-xs text-slate-500">
            Cập nhật thông tin chi tiết (Chỉ cho phép gia hạn ngày kết thúc)
          </p>
        </div>
      </div>

      {/* Alert Banner when Campaign is Ended */}
      {isCampaignEnded && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Chiến dịch đã kết thúc hoặc đã bị hủy</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Chiến dịch này đã hoàn thành hoặc đã qua thời gian tiếp nhận. Toàn bộ thông tin chiến dịch (bao gồm nhóm máu ưu tiên và khung giờ) đã bị khóa và không thể chỉnh sửa.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Name */}
          <div className="md:col-span-2">
            <FormField label="Tên chiến dịch" required error={errors.name?.message}>
              <input
                type="text"
                disabled={isCampaignEnded}
                {...register('name')}
                placeholder="VD: Ngày Hội Hiến Máu Tình Nguyện Mùa Hè 2026"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </FormField>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <FormField label="Mô tả chi tiết chiến dịch" error={errors.description?.message}>
              <textarea
                rows={3}
                disabled={isCampaignEnded}
                {...register('description')}
                placeholder="Nhập nội dung mô tả, mục đích và lưu ý dành cho người tham gia hiến máu..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </FormField>
          </div>

          {/* Venue (RENAMED TO ĐƠN VỊ TỔ CHỨC) */}
          <div className="md:col-span-2">
            <FormField label="ĐƠN VỊ TỔ CHỨC" required error={errors.venue?.message}>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={isCampaignEnded}
                  {...register('venue')}
                  placeholder="VD: Ủy ban Nhân dân Quận 1 / Bệnh viện Chợ Rẫy"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={isCampaignEnded}
                  {...register('fullAddress')}
                  placeholder="VD: 47 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </FormField>
          </div>

          {/* Start Date (DISABLED / READONLY) */}
          <FormField label="NGÀY BẮT ĐẦU" required error={errors.startDate?.message}>
            <div className="relative">
              <input
                type="date"
                readOnly
                disabled
                {...register('startDate')}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed outline-none font-bold"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </FormField>

          {/* End Date (EDITABLE ONLY) */}
          <FormField label="NGÀY KẾT THÚC" required error={errors.endDate?.message}>
            <input
              type="date"
              disabled={isCampaignEnded}
              min={startDateWatch || todayStr}
              {...register('endDate')}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </FormField>

          {/* Capacity */}
          <FormField label="Tổng chỉ tiêu người đăng ký (Tự động tính từ các ngày)" required error={errors.capacity?.message}>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                readOnly
                {...register('capacity', { valueAsNumber: true })}
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-700 outline-none cursor-not-allowed font-bold"
              />
            </div>
          </FormField>

          {/* Target Units Goal (MANUAL INPUT IN ML) */}
          <FormField label="Mục tiêu đơn vị máu (ml)" required error={errors.targetUnitsGoal?.message}>
            <div className="relative">
              <input
                type="number"
                disabled={isCampaignEnded}
                {...register('targetUnitsGoal', { valueAsNumber: true })}
                placeholder="VD: 8000 (ml)"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none font-bold text-red-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
          </FormField>

          {/* Contact Person Name */}
          <FormField label="Tên người liên hệ" required error={errors.contactPerson?.name?.message}>
            <input
              type="text"
              disabled={isCampaignEnded}
              {...register('contactPerson.name')}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </FormField>

          {/* Contact Person Phone */}
          <FormField label="Số điện thoại liên hệ" required error={errors.contactPerson?.phone?.message}>
            <input
              type="text"
              disabled={isCampaignEnded}
              {...register('contactPerson.phone')}
              placeholder="0901234567"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
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
                      disabled={isCampaignEnded}
                      onClick={() => toggleBloodGroup(group)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        isCampaignEnded
                          ? isChecked
                            ? 'bg-slate-300 text-slate-700 border-slate-300 cursor-not-allowed opacity-80'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isChecked
                            ? 'bg-red-600 text-white border-red-600 shadow-xs cursor-pointer'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>

          {/* Per-Date Timeslots Configuration */}
          <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-red-600" />
                  Cấu hình khung giờ và chỉ tiêu theo từng ngày
                </label>
                <p className="text-xs text-slate-500">
                  Chọn ngày ở trên, sau đó tùy chỉnh khung giờ và số lượng người nhận ở phía dưới.
                </p>
              </div>
              {!isCurrentActiveTabPast && (
                <button
                  type="button"
                  onClick={handleApplyToAllDates}
                  className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  title="Sao chép khung giờ ngày hiện tại sang tất cả các ngày khác"
                >
                  <Copy className="w-3.5 h-3.5" /> Áp dụng cho tất cả ngày
                </button>
              )}
            </div>

            {/* Date Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-600 shrink-0">Chọn ngày:</span>
              {dateList.map((d) => {
                const isSelected = activeDateTab === d;
                const isPast = d < todayStr;
                const slotCount = (slotsByDate[d] || []).length;
                const dayCap = (slotsByDate[d] || []).reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDateTab(d)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : isPast
                        ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{d}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {dayCap} chỗ ({slotCount} slot)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Date Slot Editor List */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  Khung giờ ngày: <span className="text-red-600 font-extrabold">{activeDateTab}</span>
                </span>

                {!isCurrentActiveTabPast && (
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-white border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm khung giờ
                  </button>
                )}
              </div>

              {/* Slots List */}
              <div className={`space-y-3 ${isCurrentActiveTabPast ? 'opacity-60 pointer-events-none' : ''}`}>
                {currentActiveSlots.map((slot, idx) => {
                  const diffMins = getSlotDiffMinutes(slot.startTime, slot.endTime);
                  const isMin30Valid = diffMins >= 30;
                  const prevSlot = idx > 0 ? currentActiveSlots[idx - 1] : null;
                  const prevEndMins = prevSlot ? getSlotDiffMinutes('00:00', prevSlot.endTime) : 0;
                  const curStartMins = getSlotDiffMinutes('00:00', slot.startTime);
                  const isOrderValid = idx === 0 || curStartMins >= prevEndMins;
                  const isSlotLocked = isCurrentActiveTabPast || isIndividualSlotPast(activeDateTab, slot);
                  const isTodayStartTooEarly = !isSlotLocked && activeDateTab === todayStr && slot.startTime < getNowTimeString();

                  return (
                    <div key={idx} className={`p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 ${isSlotLocked ? 'bg-slate-50/80 border-slate-200' : ''}`}>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Giờ bắt đầu</label>
                          <input
                            type="time"
                            disabled={isSlotLocked}
                            value={slot.startTime}
                            onChange={(e) => handleUpdateSlot(idx, 'startTime', e.target.value)}
                            className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                              isTodayStartTooEarly ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Giờ kết thúc</label>
                          <input
                            type="time"
                            disabled={isSlotLocked}
                            value={slot.endTime}
                            onChange={(e) => handleUpdateSlot(idx, 'endTime', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Số lượng/Chỉ tiêu</label>
                          <input
                            type="number"
                            disabled={isSlotLocked}
                            value={slot.capacity}
                            onChange={(e) => handleUpdateSlot(idx, 'capacity', Math.max(1, parseInt(e.target.value, 10) || 0))}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                          />
                        </div>

                        {!isSlotLocked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer sm:mb-0.5"
                            title="Xóa khung giờ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* INLINE ERROR MESSAGES */}
                      {isTodayStartTooEarly && (
                        <p className="text-xs font-semibold text-red-600 flex items-center gap-1 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Giờ bắt đầu cho ngày hôm nay ({slot.startTime}) không được sớm hơn giờ hiện tại ({getNowTimeString()})! Vui lòng chỉnh lại.
                        </p>
                      )}

                      {/* INLINE ERROR MESSAGES */}
                      {!isMin30Valid && !isCurrentActiveTabPast && (
                        <p className="text-xs font-semibold text-red-600 flex items-center gap-1 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Giờ kết thúc phải trễ hơn giờ bắt đầu ít nhất 30 phút! (Ví dụ: 07:30 - 08:00)
                        </p>
                      )}
                      {!isOrderValid && !isCurrentActiveTabPast && (
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Giờ bắt đầu khung giờ này ({slot.startTime}) phải trễ hơn hoặc bằng giờ kết thúc khung giờ trước ({prevSlot?.endTime})!
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Checkbox Save as Draft at the bottom */}
          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="isDraft"
                disabled={isCampaignEnded}
                {...register('isDraft')}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="isDraft" className={`text-sm font-semibold select-none ${isCampaignEnded ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 cursor-pointer'}`}>
                Lưu ở bản nháp (Draft)
              </label>
              <span className="text-xs text-slate-500 ml-auto">
                {isDraftWatch ? 'Chiến dịch sẽ ở trạng thái Bản nháp và chưa công khai' : 'Chiến dịch sẽ tự động ở trạng thái Sắp diễn ra / Đang diễn ra'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCampaignEnded}
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
              isCampaignEnded
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-red-600 hover:bg-red-700 disabled:opacity-70 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy chỉnh sửa"
        message="Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất."
        confirmLabel="Đồng ý hủy"
        cancelLabel="Tiếp tục chỉnh sửa"
        onConfirm={() => navigate(campaignId ? `/bc/campaigns/${campaignId}` : '/bc/campaigns')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};

export default EditCampaignPage;
