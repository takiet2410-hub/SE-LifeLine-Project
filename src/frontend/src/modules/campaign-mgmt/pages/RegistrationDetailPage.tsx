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
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import { formatDateToDDMMYYYY } from '../../booking-location/api/bookingApi';
import type { RegistrationData } from '../../../services/mockData';
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
  const [loading, setLoading] = useState(true);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ isOpen: boolean; targetStatus: string | null }>({
    isOpen: false,
    targetStatus: null,
  });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; reason: string }>({
    isOpen: false,
    reason: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
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
        }
        setLoading(false);
      });
    }
  }, [registrationId, reset]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!registrationId || !registration) return;
    try {
      const updated = await apiService.updateRegistration(registrationId, {
        bloodPressure: watchBp || undefined,
        weight: watchWeight || undefined,
        bodyTemperature: watchTemp || undefined,
        hemoglobinLevel: watchHgb || undefined,
        screeningNotes: watch('screeningNotes') || '',
        status: newStatus as any,
      });
      setRegistration(updated);
      setValue('status', newStatus as any);
      setConfirmStatusModal({ isOpen: false, targetStatus: null });

      const statusLabels: Record<string, string> = {
        Confirmed: '🟢 Đã xác nhận đơn (Confirmed)',
        Eligible: '🟢 Đủ điều kiện hiến máu (Eligible)',
        Ineligible: '🔴 Không đủ điều kiện (Ineligible)',
        Rejected: '🔴 Đã từ chối đơn (Rejected)',
        Completed: '✨ Đã hoàn tất hiến máu (Completed)',
        CheckedIn: '🟡 Đã điểm danh (CheckedIn)',
      };

      toast.success(`Đã cập nhật trạng thái phiếu sàng lọc: ${statusLabels[newStatus] || newStatus}`);
    } catch (err) {
      toast.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    }
  };

  const onSubmit = async (data: ScreeningInput) => {
    if (!registrationId) return;
    try {
      const updated = await apiService.updateRegistration(registrationId, {
        bloodPressure: data.bloodPressure,
        weight: data.weight,
        bodyTemperature: data.bodyTemperature,
        hemoglobinLevel: data.hemoglobinLevel,
        screeningNotes: data.screeningNotes,
        status: data.status as any,
      });
      setRegistration(updated);
      toast.success('Đã lưu kết quả khám lâm sàng & đơn sàng lọc!');
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/bc/campaigns/${campaignId || 'all'}/registrations`)}
            className="p-2 rounded-xl text-[#6c757d] hover:text-[#271816] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách đăng ký"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-[#1a1a2e] text-white rounded-md shrink-0">
                {codeId}
              </span>
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#271816] tracking-tight whitespace-nowrap">
                Xác Nhận & Phê Duyệt Đơn Sàng Lọc
              </h2>
              <StatusBadge status={registration.status as any} />
            </div>
            <p className="text-[12px] text-[#6c757d] mt-0.5">
              Hồ sơ đăng ký hiến máu — Trung tâm Truyền máu TP.HCM
            </p>
          </div>
        </div>

        {/* Action Buttons for Doctor aligned neatly on the right */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => setConfirmStatusModal({ isOpen: true, targetStatus: 'Confirmed' })}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Xác nhận (Confirmed)</span>
          </button>
          <button
            type="button"
            onClick={() => setRejectModal({ isOpen: true, reason: '' })}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối (Rejected)</span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmStatusModal({ isOpen: true, targetStatus: 'Completed' })}
            className="px-3.5 py-2 bg-[#1a1a2e] hover:bg-slate-900 text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Đã hiến thành công (Completed)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Donor Overview & Clinical Vitals Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donor Personal Information Profile (4 cols) */}
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
                <span className="text-[#271816] font-semibold">{registration.donorDob || '15/08/1995'}</span>
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
                <span className="text-[#93000b] font-bold">08:30 - 10:00 AM</span>
              </div>
            </div>
          </div>

          {/* Card 2: Donor Pre-screening Self-Report (Tờ khai tiền sử bệnh lý từ collection screening_forms) */}
          {/* Screening Survey Form Card (4 cols) */}
          <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#f1f3f5] pb-3 flex-nowrap">
              <h4 className="text-[13px] md:text-[14px] font-bold text-[#271816] flex items-center gap-2 min-w-0 whitespace-nowrap truncate">
                <FileText className="w-4 h-4 text-[#93000b] shrink-0" />
                <span className="truncate">Đơn khảo sát sàng lọc (Screening Survey Form)</span>
              </h4>
              {(() => {
                const sf = (registration as any)?.screeningForm || (registration as any)?.screening;
                if (!sf) {
                  return (
                    <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                      CHƯA TỰ KHAI
                    </span>
                  );
                }
                const outcome = sf.outcome || 'PASS';
                if (outcome === 'PASS') {
                  return (
                    <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                      ĐẠT (PASS)
                    </span>
                  );
                }
                if (outcome === 'REJECT') {
                  return (
                    <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0 whitespace-nowrap">
                      KHÔNG ĐẠT (REJECT)
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap">
                    CẦN XEM XÉT (REVIEW)
                  </span>
                );
              })()}
            </div>

            <div className="space-y-2.5 text-[12px]">
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

                // Fallback default sample form entries if responses array is absent
                return (
                  <>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-[#271816]">1. Đã từng hiến máu bao giờ chưa?</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">CÓ</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-[#271816]">2. Đang mắc bệnh mãn tính hoặc bệnh cấp tính?</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">KHÔNG</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-[#271816]">3. Tiền sử bệnh truyền nhiễm (Viêm gan B, C, HIV...)?</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">KHÔNG</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-[#271816]">4. Tiền sử mắc bệnh / truyền máu (12 tháng qua)?</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">KHÔNG CÓ</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Clinical Vitals & Approval Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border border-[#f1f3f5] rounded-2xl p-6 md:p-8 shadow-2xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
              <h3 className="text-[17px] font-bold text-[#271816] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#93000b]" />
                <span>Kết Quả Khám Lâm Sàng & Chỉ Số Sinh Tồn (Clinical Vitals)</span>
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#93000b] bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Bác sĩ kiểm tra
              </span>
            </div>

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
              <FormField label="Huyết áp (mmHg)" error={errors.bloodPressure?.message}>
                <input
                  type="text"
                  {...register('bloodPressure')}
                  placeholder="Chưa nhập (VD: 120/80)..."
                  className="w-full px-3.5 py-2 text-[13px] border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[#271816] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10 bg-white"
                />
              </FormField>

              <FormField label="Cân nặng (kg)" error={errors.weight?.message}>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight', { valueAsNumber: true })}
                  placeholder="Chưa nhập (VD: 62)..."
                  className="w-full px-3.5 py-2 text-[13px] border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[#271816] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10 bg-white"
                />
              </FormField>

              <FormField label="Thân nhiệt (°C)" error={errors.bodyTemperature?.message}>
                <input
                  type="number"
                  step="0.1"
                  {...register('bodyTemperature', { valueAsNumber: true })}
                  placeholder="Chưa nhập (VD: 36.6)..."
                  className="w-full px-3.5 py-2 text-[13px] border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[#271816] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10 bg-white"
                />
              </FormField>

              <FormField label="Hemoglobin (g/dL)" error={errors.hemoglobinLevel?.message}>
                <input
                  type="number"
                  step="0.1"
                  {...register('hemoglobinLevel', { valueAsNumber: true })}
                  placeholder="Chưa nhập (VD: 13.5)..."
                  className="w-full px-3.5 py-2 text-[13px] border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[#271816] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10 bg-white"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Ghi chú khám lâm sàng & Kết luận của Bác sĩ" error={errors.screeningNotes?.message}>
                  <textarea
                    rows={3}
                    {...register('screeningNotes')}
                    placeholder="Ghi chú chi tiết về tình trạng sức khỏe..."
                    className="w-full px-3.5 py-2 text-[13px] border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[#271816] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10 bg-white"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Quyết định & Trạng thái phiếu" required error={errors.status?.message}>
                  <select
                    {...register('status')}
                    className="w-full px-3.5 py-2.5 text-[13px] font-bold border border-[#f1f3f5] focus:border-[#93000b] rounded-xl outline-none bg-white text-[#271816]"
                  >
                    <option value="Confirmed">🟢 Xác nhận đơn (Confirmed)</option>
                    <option value="Eligible">🟢 Đủ điều kiện hiến máu (Eligible)</option>
                    <option value="Ineligible">🔴 Không đủ điều kiện (Ineligible)</option>
                    <option value="Rejected">🔴 Từ chối đơn (Rejected)</option>
                    <option value="Completed">✨ Đã hoàn tất hiến máu (Completed)</option>
                    <option value="CheckedIn">🟡 Đã điểm danh (CheckedIn)</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f1f3f5] flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Đơn Sàng Lọc'}</span>
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
                <table className="w-full text-left text-[12px]">
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
                          <td className="px-4 py-3 font-semibold text-[#271816]">{formattedDate}</td>
                          <td className="px-4 py-3 text-[#5b403d]">{item.donationType || 'Máu toàn phần'}</td>
                          <td className="px-4 py-3 font-bold text-[#93000b]">{item.volume || '350 ml'}</td>
                          <td className="px-4 py-3 text-[#6c757d]">{item.locationName || 'Điểm hiến máu LifeLine'}</td>
                          <td className="px-4 py-3 text-right">
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

      {/* Rejection Modal with Optional Reason Input */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0 text-red-600" />
              <h3 className="text-[18px] font-bold text-[#271816]">Từ chối đơn hiến máu (Rejected)</h3>
            </div>
            
            <p className="text-[13px] text-[#6c757d] leading-relaxed">
              Vui lòng nhập lý do từ chối (không bắt buộc). Lý do này sẽ được gửi tới email của người hiến và hiển thị khi họ xem chi tiết lịch hẹn.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#271816] mb-1.5 uppercase tracking-wider">
                Lý do từ chối (Tùy chọn)
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ví dụ: Huyết áp chưa đạt chuẩn (145/95 mmHg), Chỉ số Hemoglobin thấp, Tiền sử dùng thuốc gần đây..."
                rows={3}
                className="w-full p-3 text-[13px] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, reason: '' })}
                className="px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!registrationId) return;
                  const toastId = toast.loading('Đang xử lý từ chối đơn...');
                  try {
                    const reason = rejectModal.reason.trim() || 'Chưa đủ điều kiện sức khỏe hoặc đơn bị từ chối.';
                    const updated = await apiService.updateRegistration(registrationId, {
                      bloodPressure: watchBp || undefined,
                      weight: watchWeight || undefined,
                      bodyTemperature: watchTemp || undefined,
                      hemoglobinLevel: watchHgb || undefined,
                      screeningNotes: reason,
                      status: 'Rejected' as any,
                    });
                    setRegistration(updated);
                    setValue('status', 'Rejected' as any);
                    setRejectModal({ isOpen: false, reason: '' });
                    toast.dismiss(toastId);
                    toast.success('Đã từ chối đơn đăng ký và gửi thông báo lý do tới người hiến.');
                  } catch (err) {
                    toast.dismiss(toastId);
                    toast.error('Có lỗi xảy ra khi từ chối đơn.');
                  }
                }}
                className="px-5 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationDetailPage;
