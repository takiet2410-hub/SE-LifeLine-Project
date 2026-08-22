import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
  Activity,
  Calendar,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Droplet,
  Thermometer,
  Scale,
  Sparkles,
  History,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import { formatDateToDDMMYYYY } from '../../booking-location/api/bookingApi';
import type { RegistrationData, CampaignData } from '../../../services/mockData';
import { screeningSchema } from '../schemas/campaignSchema';
import type { ScreeningInput } from '../schemas/campaignSchema';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { FormField } from '../../../components/common/FormField';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export const RegistrationDetailPage: React.FC = () => {
  const { campaignId, registrationId } = useParams<{ campaignId: string; registrationId: string }>();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ isOpen: boolean; targetStatus: string | null }>({
    isOpen: false,
    targetStatus: null,
  });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; reason: string; targetStatus: string }>({
    isOpen: false,
    reason: '',
    targetStatus: 'Rejected',
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ScreeningInput>({
    resolver: zodResolver(screeningSchema),
  });

  const watchWeight = watch('weight');
  const watchBp = watch('bloodPressure');
  const watchHgb = watch('hemoglobinLevel');
  const watchTemp = watch('bodyTemperature');

  useEffect(() => {
    if (registrationId) {
      apiService.getRegistrationById(registrationId).then((data) => {
        setRegistration(data);
        if (data) {
          reset({
            bloodPressure: data.bloodPressure || '',
            weight: data.weight || undefined,
            bodyTemperature: data.bodyTemperature || undefined,
            hemoglobinLevel: data.hemoglobinLevel || undefined,
            screeningNotes: data.screeningNotes || '',
            status: (data.status as any) || 'Confirmed',
          });
          const targetCId = data.campaignId || campaignId;
          if (targetCId && targetCId !== 'all') {
            apiService.getCampaignById(targetCId).then((c) => setCampaign(c)).catch(() => {});
          }
        }
        setLoading(false);
      });
    }
  }, [registrationId, campaignId, reset]);

  const [editBloodType, setEditBloodType] = useState<string>('Unknown');
  const [donationVolume, setDonationVolume] = useState<number>(350);
  const [vitalsError, setVitalsError] = useState<string | null>(null);
  const [showExaminingModal, setShowExaminingModal] = useState<boolean>(false);

  useEffect(() => {
    if (registration?.donationVolume) {
      setDonationVolume(registration.donationVolume);
    }
  }, [registration]);

  const isCheckedInOrLater = registration
    ? ['CheckedIn', 'Eligible', 'Examining', 'Ineligible', 'Completed'].includes(registration.status)
    : false;

  const isVitalsLocked = registration
    ? ['Eligible', 'Examining', 'Completed', 'Ineligible', 'Ineligible for Donation', 'Donation Completed'].includes(registration.status)
    : false;

  const canSave = isDirty && !isSubmitting && !isVitalsLocked;

  const isUnknownBloodType = registration
    ? !registration.donorBloodType ||
      registration.donorBloodType === 'Unknown' ||
      registration.donorBloodType === 'Chưa biết' ||
      registration.donorBloodType === 'Chưa xác định' ||
      registration.donorBloodType === '?'
    : false;

  const isBloodTypeValid = (reg: RegistrationData | null, selectedBloodType: string) => {
    if (!reg) return false;
    const currentBt = reg.donorBloodType;
    const isCurrentKnown =
      currentBt &&
      currentBt !== 'Unknown' &&
      currentBt !== 'Chưa biết' &&
      currentBt !== 'Chưa xác định' &&
      currentBt !== '?';

    if (isCurrentKnown) return true;

    const isSelectedKnown =
      selectedBloodType &&
      selectedBloodType !== 'Unknown' &&
      selectedBloodType !== 'Chưa biết' &&
      selectedBloodType !== 'Chưa xác định' &&
      selectedBloodType !== '?';

    return !!isSelectedKnown;
  };

  const areVitalsComplete = () => {
    const bp = watchBp || registration?.bloodPressure;
    const weight = watchWeight !== undefined && watchWeight !== null && !isNaN(watchWeight) ? watchWeight : registration?.weight;
    const temp = watchTemp !== undefined && watchTemp !== null && !isNaN(watchTemp) ? watchTemp : registration?.bodyTemperature;
    const hgb = watchHgb !== undefined && watchHgb !== null && !isNaN(watchHgb) ? watchHgb : registration?.hemoglobinLevel;

    return Boolean(
      bp && String(bp).trim() !== '' &&
      weight !== undefined && weight !== null && Number(weight) > 0 &&
      temp !== undefined && temp !== null && Number(temp) > 0 &&
      hgb !== undefined && hgb !== null && Number(hgb) > 0
    );
  };

  useEffect(() => {
    if (areVitalsComplete()) {
      setVitalsError(null);
    }
  }, [watchBp, watchWeight, watchTemp, watchHgb]);

  const handleUpdateStatus = async (newStatus: string, testResult?: 'Pass' | 'Rejected') => {
    if (!registrationId || !registration) return;

    if (['CheckedIn', 'Examining', 'Eligible', 'Completed'].includes(newStatus)) {
      if (campaign && campaign.status !== 'Active' && campaign.status !== 'Completed') {
        toast.error('Chiến dịch chưa diễn ra (chưa mở).');
        setConfirmStatusModal({ isOpen: false, targetStatus: null });
        return;
      }
    }

    if (newStatus === 'Eligible') {
      if (!areVitalsComplete()) {
        setVitalsError('⚠️ Vui lòng điền đầy đủ 4 chỉ số sinh tồn (Huyết áp, Cân nặng, Thân nhiệt, Hemoglobin) trong khung bên dưới trước khi chuyển sang trạng thái Đủ Điều Kiện.');
        setConfirmStatusModal({ isOpen: false, targetStatus: null });
        const formEl = document.getElementById('clinical-vitals-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (newStatus === 'Completed') {
      if (!isBloodTypeValid(registration, editBloodType)) {
        toast.error('⚠️ Chưa thể Hoàn Thành! Vui lòng chọn & cập nhật nhóm máu cho người hiến (khác Unknown) trước khi hoàn tất.');
        setConfirmStatusModal({ isOpen: false, targetStatus: null });
        return;
      }
    }

    try {
      const shouldUpdateBloodType =
        isUnknownBloodType &&
        editBloodType &&
        editBloodType !== 'Unknown' &&
        editBloodType !== 'Chưa biết' &&
        editBloodType !== 'Chưa xác định' &&
        editBloodType !== '?';

      const updated = await apiService.updateRegistration(registrationId, {
        bloodPressure: watchBp || undefined,
        weight: watchWeight || undefined,
        bodyTemperature: watchTemp || undefined,
        hemoglobinLevel: watchHgb || undefined,
        screeningNotes: watch('screeningNotes') || '',
        status: newStatus as any,
        donationVolume,
        ...(testResult ? { testResult } : {}),
        ...(shouldUpdateBloodType ? { donorBloodType: editBloodType } : {}),
      });
      setRegistration(updated);
      setValue('status', newStatus as any);
      setConfirmStatusModal({ isOpen: false, targetStatus: null });

      const statusLabels: Record<string, string> = {
        Confirmed: '🟢 Đã xác nhận đơn (Confirmed)',
        Eligible: '🟢 Đủ điều kiện hiến máu (Eligible)',
        Examining: '🟣 Đang xét nghiệm máu (Examining)',
        Ineligible: '🔴 Không đủ điều kiện (Ineligible)',
        Rejected: '🔴 Đã từ chối đơn (Rejected)',
        Completed: '✨ Đã hoàn tất hiến máu (Completed)',
        CheckedIn: '🟡 Đã điểm danh (CheckedIn)',
      };

      if (newStatus === 'Completed') {
        if (testResult === 'Rejected') {
          toast.error(`🔴 Đã ghi nhận MẪU MÁU BẤT THƯỜNG & gửi thông báo hướng dẫn sức khỏe tới người hiến!`);
        } else {
          toast.success(`✨ Đã xác nhận mẫu máu ĐẠT TIÊU CHUẨN & gửi thông báo cảm ơn (hẹn 84 ngày hiến lại) tới người hiến!`);
        }
      } else if (newStatus === 'Ineligible for Donation' || newStatus === 'Ineligible') {
        toast.error(`🔴 Đã ghi nhận KHÔNG ĐỦ ĐIỀU KIỆN & gửi thông báo hướng dẫn sức khỏe tới người hiến!`);
      } else {
        toast.success(
          shouldUpdateBloodType
            ? `Đã cập nhật nhóm máu (${editBloodType}) & hoàn tất trạng thái: ${statusLabels[newStatus] || newStatus}`
            : `Đã cập nhật trạng thái phiếu sàng lọc: ${statusLabels[newStatus] || newStatus}`
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Cập nhật trạng thái thất bại. Vui lòng thử lại.';
      toast.error(msg);
    }
  };

  const onSubmit = async (data: ScreeningInput) => {
    if (!registrationId) return;

    if (isVitalsLocked) {
      toast.info('Thông tin khám lâm sàng đã khóa khi hồ sơ đạt trạng thái Đủ điều kiện.');
      return;
    }

    if (data.status === 'Completed' && !isBloodTypeValid(registration, editBloodType)) {
      toast.error('⚠️ Chưa thể Hoàn Thành! Vui lòng chọn & cập nhật nhóm máu cho người hiến (khác Unknown) trước khi hoàn tất.');
      return;
    }

    try {
      const shouldUpdateBloodType =
        isUnknownBloodType &&
        isCheckedInOrLater &&
        editBloodType &&
        editBloodType !== 'Unknown' &&
        editBloodType !== 'Chưa biết' &&
        editBloodType !== 'Chưa xác định' &&
        editBloodType !== '?';

      const updated = await apiService.updateRegistration(registrationId, {
        bloodPressure: data.bloodPressure,
        weight: data.weight,
        bodyTemperature: data.bodyTemperature,
        hemoglobinLevel: data.hemoglobinLevel,
        screeningNotes: data.screeningNotes,
        status: data.status as any,
        ...(shouldUpdateBloodType ? { donorBloodType: editBloodType } : {}),
      });
      setRegistration(updated);
      reset({
        bloodPressure: updated.bloodPressure || '',
        weight: updated.weight || undefined,
        bodyTemperature: updated.bodyTemperature || undefined,
        hemoglobinLevel: updated.hemoglobinLevel || undefined,
        screeningNotes: updated.screeningNotes || '',
        status: (updated.status as any) || 'Confirmed',
      });
      toast.success(
        shouldUpdateBloodType
          ? 'Đã lưu kết quả khám lâm sàng & cập nhật nhóm máu vào hồ sơ người hiến!'
          : 'Đã lưu kết quả khám lâm sàng!'
      );
    } catch (err) {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  if (loading) return <SkeletonLoader type="form" />;
  if (!registration) {
    return (
      <div className="text-center py-16 bg-white border border-[#f1f3f5] rounded-2xl p-8">
        <p className="text-[14px] text-[#6c757d]">Không tìm thấy hồ sơ đăng ký sàng lọc.</p>
        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId}/registrations`)}
          className="mt-4 px-4 py-2 bg-[#93000b] text-white rounded-xl text-[13px] font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const codeId = registration._id ? `#REG-${registration._id.slice(-6).toUpperCase()}` : '#REG-8821';

  return (
    <div className="space-y-6">
      {/* Navigation & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#f1f3f5] p-4 sm:p-5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/bc/campaigns/${campaignId || 'all'}/registrations`)}
            className="h-10 w-10 rounded-xl bg-white border border-[#f1f3f5] text-[#6c757d] hover:text-[#271816] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="Quay lại danh sách đăng ký"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#1a1a2e] text-white rounded-md shrink-0">
                {codeId}
              </span>
              <span className="text-sm font-bold text-[#271816]">
                Hồ sơ: {registration.donorName || 'Người hiến máu'}
              </span>
              <div className="ml-1 inline-flex items-center">
                <StatusBadge status={registration.status as any} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons for Doctor based on Registration Status Flow */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {(registration.status === 'Pending' || (registration.status as string) === 'Registered') && (
            <>
              <button
                type="button"
                onClick={() => setConfirmStatusModal({ isOpen: true, targetStatus: 'Confirmed' })}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Xác Nhận (Confirmed)</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: true, reason: '', targetStatus: 'Rejected' })}
                className="h-10 px-4 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <XCircle className="w-4 h-4 text-white" />
                <span>Từ Chối (Rejected)</span>
              </button>
            </>
          )}

          {registration.status === 'Confirmed' && (
            <button
              type="button"
              disabled={campaign ? (campaign.status !== 'Active' && campaign.status !== 'Completed') : false}
              onClick={() => {
                if (campaign && campaign.status !== 'Active' && campaign.status !== 'Completed') {
                  toast.error('Chiến dịch chưa diễn ra (chưa mở).');
                  return;
                }
                setConfirmStatusModal({ isOpen: true, targetStatus: 'CheckedIn' });
              }}
              className={`h-10 px-4 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap ${
                campaign && campaign.status !== 'Active' && campaign.status !== 'Completed'
                  ? 'bg-amber-600 opacity-40 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
              }`}
              title={
                campaign && campaign.status !== 'Active'
                  ? 'Chiến dịch chưa mở'
                  : 'Điểm Danh (CheckIn)'
              }
            >
              <Clock className="w-4 h-4 text-white" />
              <span>Điểm Danh (CheckIn)</span>
            </button>
          )}

          {registration.status === 'CheckedIn' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!areVitalsComplete()) {
                    setVitalsError('⚠️ Vui lòng điền đầy đủ 4 chỉ số sinh tồn (Huyết áp, Cân nặng, Thân nhiệt, Hemoglobin) ở khung Khám lâm sàng bên dưới trước khi chuyển sang trạng thái Đủ Điều Kiện.');
                    const formEl = document.getElementById('clinical-vitals-form');
                    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                    return;
                  }
                  setConfirmStatusModal({ isOpen: true, targetStatus: 'Eligible' });
                }}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Đủ Điều Kiện (Eligible)</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: true, reason: '', targetStatus: 'Ineligible' })}
                className="h-10 px-4 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <XCircle className="w-4 h-4 text-white" />
                <span>Không Đủ Điều Kiện (Ineligible)</span>
              </button>
            </>
          )}

          {registration.status === 'Eligible' && (
            <button
              type="button"
              onClick={() => setConfirmStatusModal({ isOpen: true, targetStatus: 'Examining' })}
              className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Activity className="w-4 h-4 text-white" />
              <span>Khám & Xét Nghiệm</span>
            </button>
          )}

          {registration.status === 'Examining' && (
            <button
              type="button"
              onClick={() => setShowExaminingModal(true)}
              className="h-10 px-4 bg-[#1a1a2e] hover:bg-slate-900 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hoàn Tất Hiến Máu</span>
            </button>
          )}

          {registration.status === 'Completed' && (
            (registration as any).testResult === 'Rejected' || (registration as any).screeningForm?.testResult === 'Rejected' ? (
              <span className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-[12px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Đã khám xong (Máu không đạt)</span>
              </span>
            ) : (
              <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[12px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Đã hoàn thành hiến máu</span>
              </span>
            )
          )}

          {(registration.status as string) === 'Rejected' && (
            <span className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 text-[12px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Đã từ chối đơn</span>
            </span>
          )}

          {(registration.status as string) === 'Ineligible' && (
            <span className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-[12px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Không đủ điều kiện hiến máu</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Container: Full Width when not CheckedIn (Pending / Confirmed), 2-Column Grid when CheckedIn or later */}
      {!isCheckedInOrLater ? (
        /* Full Screen Width Layout for Pending / Confirmed Status */
        <div className="space-y-6 w-full">
          {/* Card 1: Donor Personal Information Profile */}
          <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 md:p-8 shadow-2xs space-y-5 w-full">
            <div className="flex items-center gap-4 border-b border-[#f1f3f5] pb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#93000b] font-black text-[20px] flex items-center justify-center border border-red-200 shrink-0 shadow-2xs">
                {registration.donorBloodType && registration.donorBloodType !== 'Unknown' && registration.donorBloodType !== 'Chưa biết' && registration.donorBloodType !== 'Chưa xác định' && registration.donorBloodType !== '?'
                  ? registration.donorBloodType
                  : '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#271816] text-[18px] md:text-[20px] truncate">{registration.donorName}</h3>
                </div>
                {registration.donorBloodType && registration.donorBloodType !== 'Unknown' && registration.donorBloodType !== 'Chưa biết' && registration.donorBloodType !== 'Chưa xác định' && registration.donorBloodType !== '?' ? (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#93000b] text-white rounded-md block w-fit mt-1">
                    Nhóm máu {registration.donorBloodType}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md border border-slate-200 block w-fit mt-1">
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    <span>Chưa biết nhóm máu</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px] pt-1">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#6c757d] font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#93000b]" /> Số CCCD / Định danh
                </span>
                <p className="font-mono text-[#271816] font-bold text-[14px]">
                  {registration.donorIdCard
                    ? registration.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2')
                    : '079099000123'}
                </p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#6c757d] font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-[#6c757d]" /> Ngày sinh
                </span>
                <p className="text-[#271816] font-semibold text-[14px]">
                  {registration.donorDob
                    ? String(registration.donorDob).split('T')[0].split(' ')[0].replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1')
                    : '15/08/1995'}
                </p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#6c757d] font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-[#6c757d]" /> Số điện thoại
                </span>
                <p className="text-[#271816] font-semibold text-[14px]">{registration.donorPhone || '0901234567'}</p>
              </div>

              <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 space-y-1">
                <span className="text-[#93000b] font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#93000b]" /> Giờ hẹn tiếp nhận
                </span>
                <p className="text-[#93000b] font-bold text-[14px]">
                  {registration.timeSlot || (registration as any).appointmentTime || '07:30 - 11:30'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 (Nổi bật nhất): Donor Pre-screening Self-Report (Screening Survey Form) */}
          <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 md:p-8 shadow-2xs space-y-4 w-full">
            <div className="flex items-center justify-between gap-2 border-b border-[#f1f3f5] pb-4 flex-nowrap">
              <h4 className="text-[15px] md:text-[16px] font-bold text-[#271816] flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-[#93000b] shrink-0" />
                <span>Phiếu khảo sát sàng lọc sức khỏe</span>
              </h4>
              {(() => {
                const sf = (registration as any)?.screeningForm || (registration as any)?.screening;
                if (!sf) {
                  return (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      CHƯA TỰ KHAI
                    </span>
                  );
                }
                const outcome = sf.outcome || 'PASS';
                if (outcome === 'PASS') {
                  return (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      ĐẠT (PASS)
                    </span>
                  );
                }
                if (outcome === 'REJECT') {
                  return (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      KHÔNG ĐẠT (REJECT)
                    </span>
                  );
                }
                return (
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    CẦN XEM XÉT (REVIEW)
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
              {(() => {
                const questionTitles: Record<string, string> = {
                  '1': '1. Đã từng hiến máu bao giờ chưa?',
                  '2': '2. Đang mắc bệnh mãn tính hoặc bệnh cấp tính?',
                  '3': '3. Tiền sử bệnh truyền nhiễm (Viêm gan B, C, HIV...)',
                  '4': '4. Tiền sử mắc bệnh / truyền máu (12 tháng qua)',
                  '5': '5. Các yếu tố nguy cơ (6 tháng qua)',
                  '6': '6. Đi vùng dịch / mắc bệnh (1 tháng qua)',
                  '7': '7. Triệu chứng cảm cúm / sốt / ho (14 ngày qua)',
                  '8': '8. Dùng thuốc kháng sinh / điều trị (7 ngày qua)',
                };

                const responses = (registration as any)?.screeningForm?.responses;
                if (Array.isArray(responses) && responses.length > 0) {
                  return responses.map((item: any, idx: number) => {
                    const qKey = String(item.questionId || idx + 1).replace(/^Q/i, '');
                    const qTitle = questionTitles[qKey] || `${idx + 1}. Câu hỏi #${item.questionId || idx + 1}`;
                    const opts: string[] = Array.isArray(item.selectedOptions) ? item.selectedOptions : [];
                    const isWarning = opts.some(o => 
                      o !== 'Không' && o !== 'Chưa' && o !== 'Không có' && o !== 'None' && !(qKey === '1' && o === 'Có')
                    );

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border space-y-1 ${
                          isWarning ? 'bg-red-50/60 border-red-200' : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-[#271816] leading-snug">
                            {qTitle}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                              isWarning
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            {opts.length > 0 ? opts.join(', ') : 'Đã khai'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-[#6c757d] italic">Ghi chú bổ sung: {item.description}</p>
                        )}
                      </div>
                    );
                  });
                }

                const defaultSurveyItems = [
                  { q: '1. Đã từng hiến máu bao giờ chưa?', a: 'CÓ' },
                  { q: '2. Đang mắc bệnh mãn tính hoặc bệnh cấp tính?', a: 'KHÔNG' },
                  { q: '3. Tiền sử bệnh truyền nhiễm (Viêm gan B, C, HIV...)?', a: 'KHÔNG' },
                  { q: '4. Tiền sử mắc bệnh / truyền máu (12 tháng qua)?', a: 'KHÔNG CÓ' },
                  { q: '5. Tiêm vắc xin / xăm mình / phẫu thuật (6 tháng qua)?', a: 'KHÔNG CÓ' },
                  { q: '6. Đi từ vùng có dịch / mắc bệnh nhiễm trùng (1 tháng qua)?', a: 'KHÔNG' },
                  { q: '7. Triệu chứng sốt, ho, khó thở, nhức mỏi (14 ngày qua)?', a: 'KHÔNG CÓ' },
                  { q: '8. Dùng thuốc kháng sinh, aspirin, thuốc điều trị (7 ngày qua)?', a: 'KHÔNG' },
                ];

                return (
                  <>
                    {defaultSurveyItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-[#271816]">{item.q}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded shrink-0">{item.a}</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Card 3: Donation History Table (Completed ONLY) */}
          {(() => {
            const completedHistory = (registration.donationHistory || []).filter(
              (item) => item.status === 'Completed' || (item.status as string) === 'Donation Completed'
            );

            return (
              <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 md:p-8 shadow-2xs space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
                  <h3 className="text-[16px] font-bold text-[#271816] flex items-center gap-2">
                    <History className="w-5 h-5 text-[#93000b]" />
                    <span>Lịch Sử Hiến Máu Thành Công</span>
                  </h3>
                  <span className="px-3 py-1 text-[11px] font-bold bg-[#1a1a2e] text-white rounded-full">
                    Tổng cộng: {completedHistory.length} lần hiến máu thành công
                  </span>
                </div>

                {completedHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-[13px]">
                    Chưa ghi nhận lịch sử hiến máu thành công (Completed) nào cho người dùng này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-[13px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[#f1f3f5] text-[#6c757d] font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">Ngày hiến</th>
                          <th className="px-4 py-3">Loại hiến</th>
                          <th className="px-4 py-3">Thể tích</th>
                          <th className="px-4 py-3">Địa điểm</th>
                          <th className="px-4 py-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f3f5]">
                        {completedHistory.map((item, idx) => {
                          const formattedDate = item.appointmentDate
                            ? formatDateToDDMMYYYY(item.appointmentDate)
                            : '---';
                          return (
                            <tr key={item._id || idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3.5 font-semibold text-[#271816]">{formattedDate}</td>
                              <td className="px-4 py-3.5 text-[#5b403d]">{item.donationType || 'Máu toàn phần'}</td>
                              <td className="px-4 py-3.5 font-bold text-[#93000b]">{item.volume || '350 ml'}</td>
                              <td className="px-4 py-3.5 text-[#6c757d]">{item.locationName || 'Điểm hiến máu LifeLine'}</td>
                              <td className="px-4 py-3.5 text-right">
                                <StatusBadge status={item.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* 2-Column Grid Layout for CheckedIn or Later Statuses */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Donor Profile & Screening Form (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Donor Card */}
            <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-4 border-b border-[#f1f3f5] pb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#93000b] font-black text-[20px] flex items-center justify-center border border-red-200 shrink-0 shadow-2xs">
                  {registration.donorBloodType && registration.donorBloodType !== 'Unknown' && registration.donorBloodType !== 'Chưa biết' && registration.donorBloodType !== 'Chưa xác định' && registration.donorBloodType !== '?'
                    ? registration.donorBloodType
                    : '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#271816] text-[17px] truncate">{registration.donorName}</h3>
                  </div>
                  {registration.donorBloodType && registration.donorBloodType !== 'Unknown' && registration.donorBloodType !== 'Chưa biết' && registration.donorBloodType !== 'Chưa xác định' && registration.donorBloodType !== '?' ? (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#93000b] text-white rounded-md block w-fit mt-1">
                      Nhóm máu {registration.donorBloodType}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md border border-slate-200 block w-fit mt-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      <span>Chưa biết nhóm máu</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6c757d] font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#93000b]" /> Số CCCD / Định danh
                  </span>
                  <span className="font-mono text-[#271816] font-bold">
                    {registration.donorIdCard
                      ? registration.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2')
                      : '079099000123'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6c757d] font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#6c757d]" /> Ngày sinh
                  </span>
                    <span className="text-[#271816] font-semibold">
                    {registration.donorDob
                      ? String(registration.donorDob).split('T')[0].split(' ')[0].replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1')
                      : '15/08/1995'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6c757d] font-medium flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#6c757d]" /> Số điện thoại
                  </span>
                  <span className="text-[#271816] font-semibold">{registration.donorPhone || '0901234567'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6c757d] font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#6c757d]" /> Giờ hẹn tiếp nhận
                  </span>
                  <span className="text-[#93000b] font-bold">
                    {registration.timeSlot || (registration as any).appointmentTime || '07:30 - 11:30'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Screening Survey Form Card */}
            <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#f1f3f5] pb-3 flex-nowrap">
                <h4 className="text-[13px] md:text-[14px] font-bold text-[#271816] flex items-center gap-2 min-w-0 whitespace-nowrap truncate">
                  <FileText className="w-4 h-4 text-[#93000b] shrink-0" />
                  <span className="truncate">Phiếu khảo sát sàng lọc sức khỏe</span>
                </h4>
                {(() => {
                  const sf = (registration as any)?.screeningForm || (registration as any)?.screening;
                  if (!sf) {
                    return (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        CHƯA TỰ KHAI
                      </span>
                    );
                  }
                  const outcome = sf.outcome || 'PASS';
                  if (outcome === 'PASS') {
                    return (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        ĐẠT (PASS)
                      </span>
                    );
                  }
                  if (outcome === 'REJECT') {
                    return (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        KHÔNG ĐẠT
                      </span>
                    );
                  }
                  return (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      CẦN BÁC SĨ KHÁM
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-3 text-[12px]">
                {(() => {
                  const questionTitles: Record<string, string> = {
                    '1': '1. Đã từng hiến máu bao giờ chưa?',
                    '2': '2. Đang mắc bệnh mãn tính hoặc bệnh cấp tính?',
                    '3': '3. Tiền sử bệnh truyền nhiễm (Viêm gan B, C, HIV...)',
                    '4': '4. Tiền sử mắc bệnh / truyền máu (12 tháng qua)',
                    '5': '5. Tiêm vắc xin / xăm mình / phẫu thuật (6 tháng qua)',
                    '6': '6. Đi từ vùng có dịch / mắc bệnh nhiễm trùng (1 tháng qua)',
                    '7': '7. Triệu chứng sốt, ho, khó thở, nhức mỏi (14 ngày qua)',
                    '8': '8. Dùng thuốc kháng sinh, aspirin, thuốc điều trị (7 ngày qua)',
                  };

                  const responses = (registration as any)?.screeningForm?.responses;
                  if (Array.isArray(responses) && responses.length > 0) {
                    return responses.map((item: any, idx: number) => {
                      const qKey = String(item.questionId || idx + 1).replace(/^Q/i, '');
                      const qTitle = questionTitles[qKey] || `${idx + 1}. Câu hỏi #${item.questionId || idx + 1}`;
                      const opts: string[] = Array.isArray(item.selectedOptions) ? item.selectedOptions : [];
                      const isWarning = opts.some(o => 
                        o !== 'Không' && o !== 'Chưa' && o !== 'Không có' && o !== 'None' && !(qKey === '1' && o === 'Có')
                      );

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border space-y-1 ${
                            isWarning ? 'bg-red-50/60 border-red-200' : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-[#271816] leading-snug">
                              {qTitle}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                                isWarning
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}
                            >
                              {opts.length > 0 ? opts.join(', ') : 'Đã khai'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-[#6c757d] italic">Ghi chú bổ sung: {item.description}</p>
                          )}
                        </div>
                      );
                    });
                  }

                  const defaultSurveyItems = [
                    { q: '1. Đã từng hiến máu bao giờ chưa?', a: 'CÓ' },
                    { q: '2. Đang mắc bệnh mãn tính hoặc bệnh cấp tính?', a: 'KHÔNG' },
                    { q: '3. Tiền sử bệnh truyền nhiễm (Viêm gan B, C, HIV...)?', a: 'KHÔNG' },
                    { q: '4. Tiền sử mắc bệnh / truyền máu (12 tháng qua)?', a: 'KHÔNG CÓ' },
                    { q: '5. Tiêm vắc xin / xăm mình / phẫu thuật (6 tháng qua)?', a: 'KHÔNG CÓ' },
                    { q: '6. Đi từ vùng có dịch / mắc bệnh nhiễm trùng (1 tháng qua)?', a: 'KHÔNG' },
                    { q: '7. Triệu chứng sốt, ho, khó thở, nhức mỏi (14 ngày qua)?', a: 'KHÔNG CÓ' },
                    { q: '8. Dùng thuốc kháng sinh, aspirin, thuốc điều trị (7 ngày qua)?', a: 'KHÔNG' },
                  ];

                  return (
                    <>
                      {defaultSurveyItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-[#271816]">{item.q}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded shrink-0">{item.a}</span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right Column: Clinical Vitals & Approval Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <form
              id="clinical-vitals-form"
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white border border-[#f1f3f5] rounded-2xl p-6 md:p-8 shadow-2xs space-y-6 scroll-mt-24"
            >
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
                <h3 className="text-[17px] font-bold text-[#271816] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#93000b]" />
                  <span>Kết Quả Khám Lâm Sàng & Chỉ Số Sinh Tồn</span>
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#93000b] bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  Bác sĩ kiểm tra
                </span>
              </div>

              {/* Blood Donation Volume Selector (Đầu Nội Dung Khám Lâm Sàng) */}
              {['Eligible', 'Examining', 'Completed'].includes(registration.status) && (
                <div className="p-4 bg-[#fff8f7] border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#93000b] text-white flex items-center justify-center shrink-0">
                      <Droplet className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-[#271816]">Thể Tích Máu Đăng Ký Hiến</h4>
                      <p className="text-[11px] font-semibold text-[#6c757d]">Chọn hoặc nhập số ml máu tiếp nhận của người hiến</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[250, 350, 450].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDonationVolume(v)}
                        className={`px-3.5 py-1.5 text-[12px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                          donationVolume === v
                            ? 'bg-[#93000b] text-white border-[#93000b] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {v} ml
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Error Warning Banner for Missing Vitals */}
              {vitalsError && (
                <div className="p-4 bg-red-50 border-2 border-red-300 text-[#93000b] rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-[14px] leading-tight">Yêu Cầu Điền Đầy Đủ Thông Tin Lâm Sàng</h4>
                    <p className="text-[12.5px] font-medium leading-relaxed mt-0.5 text-red-900">{vitalsError}</p>
                  </div>
                </div>
              )}

              {/* Vitals Bento Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Blood Pressure */}
                <div className="p-4 bg-[#fff8f7] border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#93000b] text-white flex items-center justify-center mb-2 shadow-2xs">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Huyết áp (mmHg)</p>
                  <p className="text-[18px] font-extrabold text-[#271816] mt-1">{watchBp ? watchBp : 'Chưa khám'}</p>
                  <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    watchBp ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {watchBp ? 'Đã đo' : 'Chưa nhập'}
                  </span>
                </div>

                {/* Metric 2: Weight */}
                <div className="p-4 bg-[#fff8f7] border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#93000b] text-white flex items-center justify-center mb-2 shadow-2xs">
                    <Scale className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Cân nặng (kg)</p>
                  <p className="text-[18px] font-extrabold text-[#271816] mt-1">{watchWeight ? `${watchWeight} kg` : 'Chưa khám'}</p>
                  <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    watchWeight ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {watchWeight ? 'Đã cân' : 'Chưa nhập'}
                  </span>
                </div>

                {/* Metric 3: Body Temperature */}
                <div className="p-4 bg-[#fff8f7] border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#93000b] text-white flex items-center justify-center mb-2 shadow-2xs">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">Thân nhiệt (°C)</p>
                  <p className="text-[18px] font-extrabold text-[#271816] mt-1">{watchTemp ? `${watchTemp} °C` : 'Chưa khám'}</p>
                  <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    watchTemp ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {watchTemp ? 'Đã đo' : 'Chưa nhập'}
                  </span>
                </div>

                {/* Metric 4: Hemoglobin Level */}
                <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#93000b] text-white flex items-center justify-center mb-2 shadow-2xs">
                    <Droplet className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-[11px] font-bold text-[#93000b] uppercase tracking-wider">Hemoglobin (g/dL)</p>
                  <p className="text-[18px] font-extrabold text-[#93000b] mt-1">{watchHgb ? `${watchHgb} g/dL` : 'Chưa khám'}</p>
                  <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    watchHgb ? 'text-white bg-[#93000b]' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {watchHgb ? 'Đã xét nghiệm' : 'Chưa nhập'}
                  </span>
                </div>
              </div>

              {/* Editable Vitals Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField label="Huyết áp (mmHg) *" error={errors.bloodPressure?.message}>
                  <input
                    type="text"
                    disabled={isVitalsLocked}
                    {...register('bloodPressure')}
                    placeholder={isVitalsLocked ? 'Chưa có thông tin' : 'Chưa nhập (VD: 120/80)...'}
                    className={`w-full px-3.5 py-2 text-[13px] border rounded-xl text-[#271816] outline-none transition-all ${
                      isVitalsLocked
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : vitalsError && (!watchBp || String(watchBp).trim() === '')
                        ? 'border-red-500 bg-red-50/40 ring-2 ring-red-200'
                        : 'border-[#f1f3f5] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10 bg-white'
                    }`}
                  />
                </FormField>

                <FormField label="Cân nặng (kg) *" error={errors.weight?.message}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    disabled={isVitalsLocked}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }}
                    {...register('weight', { valueAsNumber: true })}
                    placeholder={isVitalsLocked ? 'Chưa có thông tin' : 'Chưa nhập (VD: 62)...'}
                    className={`w-full px-3.5 py-2 text-[13px] border rounded-xl text-[#271816] outline-none transition-all ${
                      isVitalsLocked
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : vitalsError && (watchWeight === undefined || watchWeight === null || isNaN(watchWeight) || Number(watchWeight) <= 0)
                        ? 'border-red-500 bg-red-50/40 ring-2 ring-red-200'
                        : 'border-[#f1f3f5] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10 bg-white'
                    }`}
                  />
                </FormField>

                <FormField label="Thân nhiệt (°C) *" error={errors.bodyTemperature?.message}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    disabled={isVitalsLocked}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }}
                    {...register('bodyTemperature', { valueAsNumber: true })}
                    placeholder={isVitalsLocked ? 'Chưa có thông tin' : 'Chưa nhập (VD: 36.6)...'}
                    className={`w-full px-3.5 py-2 text-[13px] border rounded-xl text-[#271816] outline-none transition-all ${
                      isVitalsLocked
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : vitalsError && (watchTemp === undefined || watchTemp === null || isNaN(watchTemp) || Number(watchTemp) <= 0)
                        ? 'border-red-500 bg-red-50/40 ring-2 ring-red-200'
                        : 'border-[#f1f3f5] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10 bg-white'
                    }`}
                  />
                </FormField>

                <FormField label="Hemoglobin (g/dL) *" error={errors.hemoglobinLevel?.message}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    disabled={isVitalsLocked}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }}
                    {...register('hemoglobinLevel', { valueAsNumber: true })}
                    placeholder={isVitalsLocked ? 'Chưa có thông tin' : 'Chưa nhập (VD: 13.5)...'}
                    className={`w-full px-3.5 py-2 text-[13px] border rounded-xl text-[#271816] outline-none transition-all ${
                      isVitalsLocked
                        ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                        : vitalsError && (watchHgb === undefined || watchHgb === null || isNaN(watchHgb) || Number(watchHgb) <= 0)
                        ? 'border-red-500 bg-red-50/40 ring-2 ring-red-200'
                        : 'border-[#f1f3f5] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10 bg-white'
                    }`}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Ghi chú khám lâm sàng & Kết luận của Bác sĩ" error={errors.screeningNotes?.message}>
                    <textarea
                      rows={3}
                      disabled={isVitalsLocked}
                      {...register('screeningNotes')}
                      placeholder={isVitalsLocked ? 'Không có ghi chú thêm.' : 'Ghi chú chi tiết về tình trạng sức khỏe...'}
                      className={`w-full px-3.5 py-2 text-[13px] border rounded-xl text-[#271816] outline-none transition-all ${
                        isVitalsLocked
                          ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                          : 'border-[#f1f3f5] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10 bg-white'
                      }`}
                    />
                  </FormField>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f1f3f5] flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={!canSave}
                  className={`px-6 py-2.5 text-[13px] font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                    canSave
                      ? 'bg-[#93000b] hover:bg-[#7a0009] text-white cursor-pointer active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
                  title={!canSave ? (isVitalsLocked ? 'Thông tin lâm sàng đã khóa' : 'Không có thay đổi để lưu') : 'Lưu thay đổi'}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
              </div>
            </form>

            {/* Donation History Table */}
            <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <h3 className="text-[15px] font-bold text-[#271816] flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-[#93000b]" />
                  <span>Lịch Sử Hiến Máu Của Người Dùng</span>
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#1a1a2e] text-white rounded-full">
                  Tổng cộng: {registration.donationHistory?.length || 0} lượt hiến / đăng ký
                </span>
              </div>

              {(!registration.donationHistory || registration.donationHistory.length === 0) ? (
                <div className="text-center py-6 text-slate-500 text-[13px]">
                  Chưa ghi nhận lịch sử hiến máu nào cho người dùng này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#f1f3f5] text-[#6c757d] font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Ngày hiến</th>
                        <th className="px-4 py-2.5">Loại hiến</th>
                        <th className="px-4 py-2.5">Thể tích</th>
                        <th className="px-4 py-2.5">Địa điểm</th>
                        <th className="px-4 py-2.5 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f5]">
                      {registration.donationHistory.map((item, idx) => {
                        const formattedDate = item.appointmentDate
                          ? formatDateToDDMMYYYY(item.appointmentDate)
                          : '---';
                        return (
                          <tr key={item._id || idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-semibold text-[#271816]">{formattedDate}</td>
                            <td className="px-4 py-2.5 text-[#5b403d]">{item.donationType || 'Máu toàn phần'}</td>
                            <td className="px-4 py-2.5 font-bold text-[#93000b]">{item.volume || '350 ml'}</td>
                            <td className="px-4 py-2.5 text-[#6c757d]">{item.locationName || 'Điểm hiến máu LifeLine'}</td>
                            <td className="px-4 py-2.5 text-right">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmStatusModal.isOpen}
        title="Xác nhận phê duyệt đơn sàng lọc?"
        message={`Bạn có chắc chắn muốn chuyển trạng thái hồ sơ của người hiến ${registration.donorName} sang '${confirmStatusModal.targetStatus}' không?`}
        confirmLabel="Xác Nhận Ngay"
        cancelLabel="Hủy"
        variant={confirmStatusModal.targetStatus === 'Ineligible' ? 'danger' : 'info'}
        onConfirm={() => {
          if (confirmStatusModal.targetStatus) {
            handleUpdateStatus(confirmStatusModal.targetStatus);
          }
        }}
        onCancel={() => setConfirmStatusModal({ isOpen: false, targetStatus: null })}
      />

      {/* Rejection / Ineligible Modal with Required Reason Input */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0 text-red-600" />
              <h3 className="text-[18px] font-bold text-[#271816]">
                {rejectModal.targetStatus === 'Ineligible'
                  ? 'Không đủ điều kiện hiến máu (Ineligible)'
                  : 'Từ chối đơn đăng ký (Rejected)'}
              </h3>
            </div>
            
            <p className="text-[13px] text-[#6c757d] leading-relaxed">
              {rejectModal.targetStatus === 'Ineligible'
                ? 'Vui lòng nhập nguyên nhân người hiến không đủ điều kiện sức khỏe khám lâm sàng (bắt buộc). Lý do sẽ được lưu vào hồ sơ và thông báo tới người hiến.'
                : 'Vui lòng nhập nguyên nhân từ chối đơn đăng ký này (bắt buộc). Lý do sẽ được lưu vào hồ sơ và thông báo tới người hiến.'}
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#271816] mb-1.5 uppercase tracking-wider">
                {rejectModal.targetStatus === 'Ineligible' ? 'Lý do không đủ điều kiện *' : 'Nguyên nhân từ chối *'}
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={
                  rejectModal.targetStatus === 'Ineligible'
                    ? 'Ví dụ: Huyết áp quá cao (150/100 mmHg), Cân nặng dưới 45kg, Chỉ số Hemoglobin thấp (11.0 g/dL)...'
                    : 'Nhập nguyên nhân từ chối (VD: Huyết áp chưa đạt chuẩn, Hemoglobin thấp, Tiền sử dùng thuốc...)...'
                }
                rows={3}
                className={`w-full p-3 text-[13px] border rounded-xl focus:outline-none focus:ring-2 ${
                  !rejectModal.reason.trim()
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                    : 'border-gray-300 focus:ring-red-500 focus:border-red-500 bg-white'
                }`}
              />
              {!rejectModal.reason.trim() && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  {rejectModal.targetStatus === 'Ineligible'
                    ? '⚠️ Bắt buộc phải nhập lý do không đủ điều kiện.'
                    : '⚠️ Bắt buộc phải nhập nguyên nhân từ chối.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, reason: '', targetStatus: 'Rejected' })}
                className="px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!rejectModal.reason.trim()}
                onClick={async () => {
                  if (!registrationId) return;
                  const reason = rejectModal.reason.trim();
                  if (!reason) {
                    toast.error(
                      rejectModal.targetStatus === 'Ineligible'
                        ? 'Vui lòng nhập lý do không đủ điều kiện trước khi xác nhận!'
                        : 'Vui lòng nhập nguyên nhân từ chối trước khi xác nhận!'
                    );
                    return;
                  }
                  const targetStatus = rejectModal.targetStatus || 'Rejected';
                  const toastId = toast.loading('Đang xử lý cập nhật trạng thái...');
                  try {
                    const updated = await apiService.updateRegistration(registrationId, {
                      bloodPressure: watchBp || undefined,
                      weight: watchWeight || undefined,
                      bodyTemperature: watchTemp || undefined,
                      hemoglobinLevel: watchHgb || undefined,
                      screeningNotes: reason,
                      status: targetStatus as any,
                    });
                    setRegistration(updated);
                    setValue('status', targetStatus as any);
                    setRejectModal({ isOpen: false, reason: '', targetStatus: 'Rejected' });
                    toast.dismiss(toastId);
                    toast.success(
                      targetStatus === 'Ineligible'
                        ? 'Đã ghi nhận người hiến Không đủ điều kiện (Ineligible) & lưu lý do.'
                        : 'Đã từ chối đơn đăng ký và lưu nguyên nhân từ chối.'
                    );
                  } catch (err) {
                    toast.dismiss(toastId);
                    toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
                  }
                }}
                className={`px-5 py-2 text-[13px] font-bold text-white rounded-xl transition-all shadow-2xs ${
                  rejectModal.reason.trim()
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer active:scale-98'
                    : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                {rejectModal.targetStatus === 'Ineligible' ? 'Xác Nhận Không Đủ ĐK' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Examining Quality Verification Modal */}
      {showExaminingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#271816] text-[17px]">Xác Nhận Kết Quả Xét Nghiệm</h3>
                  <p className="text-[12px] text-slate-500">Mẫu máu: {donationVolume}ml ({registration?.donorName || 'Người hiến'})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExaminingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                Vui lòng xác nhận kết quả kiểm tra chất lượng mẫu máu trước khi hoàn tất hồ sơ:
              </p>

              {isUnknownBloodType && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="text-[12px] font-bold text-amber-900">Cập nhật nhóm máu người hiến</p>
                  <select
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="w-full p-2.5 text-[13px] font-extrabold bg-white text-[#93000b] border border-amber-300 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Unknown">❓ Chọn nhóm máu...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!isBloodTypeValid(registration, editBloodType)) {
                    toast.error('⚠️ Chưa thể Hoàn Thành! Vui lòng cập nhật nhóm máu cho người hiến.');
                    return;
                  }
                  setShowExaminingModal(false);
                  await handleUpdateStatus('Completed', 'Pass');
                }}
                className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[14px]">1. Đạt tiêu chuẩn an toàn (Passed)</p>
                    <p className="text-[11.5px] text-emerald-700 mt-0.5">Mẫu máu đạt yêu cầu an toàn, hệ thống sẽ tự động nhập kho (Stock In).</p>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowExaminingModal(false);
                  await handleUpdateStatus('Completed', 'Rejected');
                }}
                className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 rounded-2xl flex items-center justify-between transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[14px]">2. Không đạt tiêu chuẩn (Từ chối)</p>
                    <p className="text-[11.5px] text-red-700 mt-0.5">Ghi nhận mẫu máu có bất thường. Hệ thống sẽ KHÔNG nhập kho túi máu này.</p>
                  </div>
                </div>
                <span className="text-red-700 font-bold group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowExaminingModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationDetailPage;
