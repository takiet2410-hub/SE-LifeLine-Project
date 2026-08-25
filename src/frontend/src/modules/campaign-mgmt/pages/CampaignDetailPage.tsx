import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  ListChecks,
  Edit,
  Clock,
  Phone,
  User,
  FileText,
  CheckCircle2,
  Droplet,
  Target,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';
import { apiService } from '../../../services/apiClient';
import type { CampaignData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format } from 'date-fns';

export const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackToList = () => {
    const campaignSearch = location.state?.fromCampaignSearch || location.state?.fromSearch || '';
    navigate(`/bc/campaigns${campaignSearch}`);
  };

  const [campaign, setCampaign] = useState<CampaignData | any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDateTab, setActiveDateTab] = useState<string>('');

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      apiService.getCampaignById(campaignId).then((data) => {
        setCampaign(data);
        if (data) {
          // Determine initial active date tab for dailyTimeslots
          if (data.dailyTimeslots && data.dailyTimeslots.length > 0) {
            const firstDate = data.dailyTimeslots[0].dateStr || (data.dailyTimeslots[0].startTime?.split('T')[0]);
            if (firstDate) setActiveDateTab(firstDate);
          }
        }
        setLoading(false);
      });
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="form" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy thông tin chiến dịch</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Chiến dịch bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <button
          onClick={handleBackToList}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  // Format Helper
  const safeFormatDate = (dateVal: any, fmt: string) => {
    if (!dateVal) return '---';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '---';
      return format(d, fmt);
    } catch {
      return '---';
    }
  };

  const formatSlotTime = (timeVal: any, fallback: string = '07:30'): string => {
    if (!timeVal) return fallback;
    if (typeof timeVal === 'string' && timeVal.includes('T')) {
      return timeVal.split('T')[1].substring(0, 5);
    }
    return String(timeVal).substring(0, 5);
  };

  // Group dailyTimeslots by date string
  const groupedDailySlots: Record<string, any[]> = {};
  if (campaign.dailyTimeslots && Array.isArray(campaign.dailyTimeslots) && campaign.dailyTimeslots.length > 0) {
    campaign.dailyTimeslots.forEach((slot: any) => {
      const dKey = slot.dateStr || (slot.startTime && typeof slot.startTime === 'string' && slot.startTime.includes('T') ? slot.startTime.split('T')[0] : safeFormatDate(campaign.startDateTime, 'yyyy-MM-dd'));
      if (!groupedDailySlots[dKey]) groupedDailySlots[dKey] = [];
      groupedDailySlots[dKey].push(slot);
    });
  }

  const dateTabs = Object.keys(groupedDailySlots);
  const currentTabDate = activeDateTab || (dateTabs.length > 0 ? dateTabs[0] : '');
  const activeSlotsForTab = groupedDailySlots[currentTabDate] || [];

  // Capacity calculations
  const totalCap = Number(campaign.capacity) || 100;
  const regCount = Number(campaign.registeredCount) || 0;
  const fillPercent = Math.min(100, Math.round((regCount / totalCap) * 100));
  const remainingSlots = Math.max(0, totalCap - regCount);

  const unitsGoal = Number(campaign.targetUnitsGoal) || Math.round(totalCap * 0.8 * 350);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <button
            onClick={handleBackToList}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            {campaign.campaignCode && (
              <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-slate-700 font-bold">
                  {campaign.campaignCode}
                </span>
                <span>• Khởi tạo ngày {safeFormatDate(campaign.createdAt, 'dd/MM/yyyy HH:mm')}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(() => {
            const isEnded =
              campaign.status === 'Completed' ||
              campaign.status === 'Cancelled' ||
              (campaign.status !== 'Draft' && campaign.endDateTime && new Date(campaign.endDateTime).getTime() < new Date().getTime());
            return (
              <button
                disabled={isEnded}
                onClick={() =>
                  !isEnded &&
                  navigate(`/bc/campaigns/${campaign._id}/edit`, {
                    state: { fromCampaignSearch: location.state?.fromCampaignSearch || location.state?.fromSearch },
                  })
                }
                className={`px-4 py-2.5 border text-sm font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors ${
                  isEnded
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer'
                }`}
                title={isEnded ? 'Chiến dịch đã kết thúc hoặc đã bị hủy, không thể chỉnh sửa' : 'Chỉnh sửa'}
              >
                <Edit className={`w-4 h-4 ${isEnded ? 'text-slate-400' : 'text-blue-600'}`} />
                <span>Chỉnh sửa</span>
              </button>
            );
          })()}

          <button
            onClick={() =>
              navigate(`/bc/campaigns/${campaign._id}/registrations`, {
                state: { fromCampaignSearch: location.state?.fromCampaignSearch || location.state?.fromSearch },
              })
            }
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <ListChecks className="w-4 h-4" />
            <span>Danh sách đăng ký ({regCount})</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Registration Capacity Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-red-600" />
              Chỉ tiêu tiếp nhận
            </span>
            <span className="text-xs font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              {fillPercent}% lấp đầy
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{regCount}</span>
              <span className="text-sm font-bold text-slate-500">/ {totalCap} người</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Còn trống <strong className="text-emerald-700 font-bold">{remainingSlots}</strong> suất đăng ký
            </p>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fillPercent >= 100 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Blood Units Goal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-red-600" />
              Mục tiêu đơn vị máu
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Dự kiến
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {unitsGoal.toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-bold text-slate-500">ml</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Tương đương ~<strong className="text-slate-800 font-bold">{Math.round(unitsGoal / 350)}</strong> đơn vị máu tiêu chuẩn (350ml)
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Droplet className="w-3.5 h-3.5 text-red-600" />
            <span>Phục vụ dự trữ máu toàn tỉnh/thành phố</span>
          </div>
        </div>

        {/* Metric 3: Time Range */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-600" />
              Thời gian tổ chức
            </span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {dateTabs.length > 0 ? `${dateTabs.length} ngày tổ chức` : '1 ngày'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Bắt đầu — Kết thúc:</div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600 shrink-0" />
              <span>{safeFormatDate(campaign.startDateTime, 'dd/MM/yyyy HH:mm')}</span>
              <span>—</span>
              <span>{safeFormatDate(campaign.endDateTime, 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã xác thực thông tin đơn vị tổ chức</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Daily Timeslots Breakdown (Left/Top) & Campaign Information (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daily Timeslots Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Per-Date Timeslots Detailed Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span>Danh sách khung giờ & Chỉ tiêu theo ngày</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết từng khung giờ tiếp nhận và số lượng đăng ký cho từng ngày tổ chức
                </p>
              </div>
            </div>

            {/* Date Selector Tabs (If multiple dates exist) */}
            {dateTabs.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 shrink-0">Chọn ngày:</span>
                {dateTabs.map((dStr) => {
                  const isSelected = currentTabDate === dStr;
                  const slots = groupedDailySlots[dStr] || [];
                  const dayCapacity = slots.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
                  const dayReg = slots.reduce((acc, curr) => acc + (Number(curr.registeredCount) || 0), 0);

                  return (
                    <button
                      key={dStr}
                      onClick={() => setActiveDateTab(dStr)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{dStr}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {dayReg}/{dayCapacity} người
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Timeslot Cards List for Active Date Tab */}
            {activeSlotsForTab.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeSlotsForTab.map((slot: any, idx: number) => {
                  const sTime = formatSlotTime(slot.startTime, '07:30');
                  const eTime = formatSlotTime(slot.endTime, '11:30');
                  const sCap = Number(slot.capacity) || 50;
                  const sReg = Number(slot.registeredCount) || 0;
                  const slotPercent = Math.min(100, Math.round((sReg / sCap) * 100));
                  const isFull = sReg >= sCap;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span>
                            {sTime} — {eTime}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                            isFull
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isFull ? 'Đã kín chỗ' : 'Còn nhận'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600">Đã đăng ký: {sReg} người</span>
                          <span className="text-slate-900 font-bold">
                            Chỉ tiêu: {sCap} người ({slotPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slotPercent >= 100 ? 'bg-amber-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${slotPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : campaign.timeslots && campaign.timeslots.length > 0 ? (
              /* Fallback to generic timeslots pattern if dailyTimeslots is empty */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {campaign.timeslots.map((slot: any, idx: number) => {
                  const sTime = formatSlotTime(slot.startTime, '07:30');
                  const eTime = formatSlotTime(slot.endTime, '11:30');
                  const sCap = Number(slot.capacity) || 50;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span>
                            {sTime} — {eTime}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-slate-200 text-slate-700">
                          Khung giờ chung
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">
                        Chỉ tiêu tiếp nhận: <strong className="text-slate-900">{sCap} người</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Chưa có cấu hình khung giờ chi tiết cho chiến dịch này.
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              <span>Mô tả chi tiết chiến dịch</span>
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1">
              {campaign.description || 'Không có thông tin mô tả chi tiết cho chiến dịch này.'}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info Grid & Contact Person */}
        <div className="space-y-6">
          {/* Target Blood Groups Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Droplet className="w-4 h-4 text-red-600" />
              <span>Nhóm máu ưu tiên tiếp nhận</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {(campaign.targetBloodGroups || []).map((group: string) => (
                <span
                  key={group}
                  className="px-3 py-1.5 text-xs font-extrabold bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-2xs flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  <span>{group}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Venue & Location Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>Đơn vị & Địa điểm tổ chức</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đơn vị tổ chức</p>
                <p className="mt-1 font-bold text-slate-900 flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{campaign.venue}</span>
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ chi tiết</p>
                <p className="mt-1 font-medium text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{campaign.fullAddress || campaign.venue || 'TP. Hồ Chí Minh'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Person Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-red-600" />
              <span>Cán bộ phụ trách liên hệ</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên cán bộ</p>
                <p className="mt-1 font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{campaign.contactPerson?.name || 'Cán bộ Kho máu'}</span>
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại liên hệ</p>
                <a
                  href={`tel:${campaign.contactPerson?.phone || '0909123456'}`}
                  className="mt-1 font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{campaign.contactPerson?.phone || '0909123456'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Internal Remarks Card (If any) */}
          {campaign.internalRemarks && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Ghi chú nội bộ</span>
              </h3>
              <p className="text-xs font-medium text-amber-800 leading-relaxed">
                {campaign.internalRemarks}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
