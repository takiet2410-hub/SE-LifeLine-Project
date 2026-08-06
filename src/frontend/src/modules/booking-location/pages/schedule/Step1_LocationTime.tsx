import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import {
  MapPin,
  CalendarDays,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Info,
  Calendar,
  Layers,
  Users
} from 'lucide-react';
import { searchLocations } from '../../api/bookingApi';
import { isSlotPassed, areAllSlotsPassedOnDate, getFirstAvailableSlot } from '../../utils/timeslotUtils';
import { StatusBadge } from '../../../../components/common/StatusBadge';

interface LocationOption {
  id: string;
  name: string;
  venue?: string;
  address: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
  };
  capacity?: number;
  registeredCount?: number;
  status?: string;
  targetBloodGroups?: string[];
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
  dailyTimeslots?: Array<{
    dateStr: string;
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount?: number;
  }>;
}

const formatDateString = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const Step1_LocationTime: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedLoc, setSelectedLoc] = useState(data.locationId || '');
  const [selectedDate, setSelectedDate] = useState(data.date || todayStr);
  const [selectedTime, setSelectedTime] = useState(data.timeSlot || '');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const defaultSlots = [
    { startTime: '07:30', endTime: '09:00', capacity: 20, registeredCount: 0 },
    { startTime: '09:00', endTime: '10:30', capacity: 20, registeredCount: 0 },
    { startTime: '10:30', endTime: '12:00', capacity: 20, registeredCount: 0 },
    { startTime: '13:30', endTime: '15:00', capacity: 20, registeredCount: 0 },
    { startTime: '15:00', endTime: '16:30', capacity: 20, registeredCount: 0 },
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const res = await searchLocations(selectedDate ? { date: selectedDate } : undefined);
        let locationOptions: LocationOption[] = [];

        if (res.success && res.data && res.data.length > 0) {
          locationOptions = res.data.map((item: any) => {
            const slots = (item.timeSlots && item.timeSlots.length > 0)
              ? item.timeSlots
              : (item.timeslots && item.timeslots.length > 0)
                ? item.timeslots
                : defaultSlots;

            return {
              id: item.id || item._id,
              name: item.name,
              venue: item.venue || item.name,
              address: item.address || item.fullAddress || 'TP. Hồ Chí Minh',
              description: item.description || '',
              startDateTime: item.startDateTime || item.startDate,
              endDateTime: item.endDateTime || item.endDate,
              contactPerson: item.contactPerson,
              capacity: item.capacity || 100,
              registeredCount: item.registeredCount || 0,
              status: item.status || 'Active',
              targetBloodGroups: (item.targetBloodGroups && item.targetBloodGroups.length > 0)
                ? item.targetBloodGroups
                : ['Tất cả các nhóm máu'],
              timeSlots: slots,
              dailyTimeslots: item.dailyTimeslots,
            };
          });

          // Ensure location selected from Map is included
          if (data.locationData && data.date === selectedDate && !locationOptions.some(l => String(l.id) === String(data.locationId) || (l.name && l.name.toLowerCase().trim() === data.locationData?.name.toLowerCase().trim()))) {
            const mapSlots = (data.locationData.timeslots && data.locationData.timeslots.length > 0)
              ? data.locationData.timeslots
              : defaultSlots;

            locationOptions.unshift({
              id: data.locationId || data.locationData.id,
              name: data.locationData.name,
              venue: data.locationData.name,
              address: data.locationData.address,
              targetBloodGroups: ['Tất cả các nhóm máu'],
              timeSlots: mapSlots,
            });
          }
        }

        setLocations(locationOptions);

        if (locationOptions.length > 0) {
          let targetLocObj: LocationOption | undefined;
          if (data.locationId) {
            targetLocObj = locationOptions.find(l => String(l.id) === String(data.locationId));
          }

          if (!targetLocObj && data.locationData?.name) {
            const cleanTargetName = data.locationData.name.replace(/\(Mã:.*?\)/gi, '').toLowerCase().trim();
            targetLocObj = locationOptions.find(l => {
              const cleanName = l.name.replace(/\(Mã:.*?\)/gi, '').toLowerCase().trim();
              return cleanName === cleanTargetName || cleanName.includes(cleanTargetName) || cleanTargetName.includes(cleanName);
            });
          }

          if (!targetLocObj && selectedLoc) {
            targetLocObj = locationOptions.find(l => String(l.id) === String(selectedLoc));
          }

          if (!targetLocObj && locationOptions.length > 0) {
            targetLocObj = locationOptions[0];
          }

          const targetLocId = targetLocObj ? targetLocObj.id : '';
          setSelectedLoc(targetLocId);

          if (targetLocObj) {
            updateData({
              locationId: targetLocObj.id,
              date: selectedDate,
              locationData: {
                id: targetLocObj.id,
                name: targetLocObj.name,
                address: targetLocObj.address,
              }
            });
          }

          const isDataTimeSlotValid = data.timeSlot && data.date === selectedDate && !isSlotPassed(selectedDate, data.timeSlot.split('-')[1]?.trim() || '23:59');
          if (isDataTimeSlotValid) {
            setSelectedTime(data.timeSlot);
          } else if (targetLocObj && targetLocObj.timeSlots && targetLocObj.timeSlots.length > 0) {
            const availSlot = getFirstAvailableSlot(selectedDate, targetLocObj.timeSlots);
            setSelectedTime(availSlot ? `${availSlot.startTime} - ${availSlot.endTime}` : '');
          } else {
            setSelectedTime('');
          }
        } else {
          setLocations([]);
          setSelectedLoc('');
          setSelectedTime('');
          updateData({
            locationId: '',
            locationData: undefined,
            timeSlot: '',
            date: selectedDate,
          });
        }
      } catch (err) {
        console.error('Failed to fetch campaign locations:', err);
        setLocations([]);
        setSelectedLoc('');
        setSelectedTime('');
        updateData({
          locationId: '',
          locationData: undefined,
          timeSlot: '',
          date: selectedDate,
        });
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [selectedDate]);

  const handleSelectLocation = (locId: string) => {
    setSelectedLoc(locId);
    const targetLocObj = locations.find(l => l.id === locId);
    if (targetLocObj && targetLocObj.timeSlots && targetLocObj.timeSlots.length > 0) {
      const availSlot = getFirstAvailableSlot(selectedDate, targetLocObj.timeSlots);
      setSelectedTime(availSlot ? `${availSlot.startTime} - ${availSlot.endTime}` : '');
    } else {
      setSelectedTime('');
    }
  };

  const handleNext = () => {
    if (selectedLoc && selectedDate && selectedTime) {
      const locObj = locations.find(l => l.id === selectedLoc);
      updateData({
        locationId: selectedLoc,
        date: selectedDate,
        timeSlot: selectedTime,
        locationData: locObj ? {
          id: locObj.id,
          name: locObj.name,
          address: locObj.address,
          timeslots: locObj.timeSlots,
        } : undefined,
      });
      navigate('/my-appointments/schedule/step-2');
    }
  };

  const isFormComplete = selectedLoc && selectedDate && selectedTime;
  const currentSelectedLocationObj = locations.find(l => l.id === selectedLoc);
  const allSlotsPassedForDate = currentSelectedLocationObj ? areAllSlotsPassedOnDate(selectedDate, currentSelectedLocationObj.timeSlots) : false;

  // Compute active slots for current selected date (support dailyTimeslots if available)
  const activeTimeSlots = React.useMemo(() => {
    if (!currentSelectedLocationObj) return defaultSlots;
    if (currentSelectedLocationObj.dailyTimeslots && currentSelectedLocationObj.dailyTimeslots.length > 0) {
      const matchingDaily = currentSelectedLocationObj.dailyTimeslots.filter(
        (dt) => dt.dateStr === selectedDate
      );
      if (matchingDaily.length > 0) {
        return matchingDaily.map((dt) => ({
          startTime: dt.startTime,
          endTime: dt.endTime,
          capacity: dt.capacity || 50,
          registeredCount: dt.registeredCount || 0,
        }));
      }
    }
    return currentSelectedLocationObj.timeSlots || defaultSlots;
  }, [currentSelectedLocationObj, selectedDate]);

  return (
    <div className="flex flex-col gap-6">

      {/* TOP HERO CARD: Selected Campaign Detailed View */}
      {currentSelectedLocationObj ? (
        <div className="bg-gradient-to-br from-slate-900 via-[#4a0d0d] to-[#93000b] text-white border border-[#93000b]/30 rounded-2xl p-6 shadow-md relative overflow-hidden transition-all">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-red-600/90 text-white rounded-full uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3" />
                Chiến dịch đã chọn
              </span>
              {currentSelectedLocationObj.status && (
                <StatusBadge status={currentSelectedLocationObj.status} />
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              Xem trên bản đồ
            </button>
          </div>

          {/* Title & Venue */}
          <div className="space-y-1 mb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {currentSelectedLocationObj.name}
            </h1>
            {currentSelectedLocationObj.venue && currentSelectedLocationObj.venue !== currentSelectedLocationObj.name && (
              <p className="text-sm font-semibold text-red-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-400 shrink-0" />
                Đơn vị tổ chức: {currentSelectedLocationObj.venue}
              </p>
            )}
          </div>

          {/* Campaign Description */}
          {currentSelectedLocationObj.description && (
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-200 font-medium italic leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span>"{currentSelectedLocationObj.description}"</span>
              </p>
            </div>
          )}

          {/* Info Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Full Address */}
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
              <div className="text-red-300 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Địa chỉ tổ chức
              </div>
              <p className="font-semibold text-white leading-snug line-clamp-2">
                {currentSelectedLocationObj.address}
              </p>
            </div>

            {/* Campaign Operating Dates */}
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
              <div className="text-red-300 font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Thời gian mở cửa
              </div>
              <p className="font-bold text-white">
                {currentSelectedLocationObj.startDateTime && currentSelectedLocationObj.endDateTime ? (
                  `${formatDateString(currentSelectedLocationObj.startDateTime)} - ${formatDateString(currentSelectedLocationObj.endDateTime)}`
                ) : (
                  'Hoạt động hàng ngày'
                )}
              </p>
            </div>

            {/* Target Blood Groups */}
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
              <div className="text-red-300 font-bold mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Nhóm máu tiếp nhận
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(currentSelectedLocationObj.targetBloodGroups || ['Tất cả']).map((bg) => (
                  <span key={bg} className="px-1.5 py-0.2 text-[10px] font-extrabold bg-red-600 text-white rounded border border-red-400">
                    {bg}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Person */}
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
              <div className="text-red-300 font-bold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Người liên hệ
              </div>
              <p className="font-bold text-white flex items-center gap-1">
                {currentSelectedLocationObj.contactPerson?.name || 'Ban Tổ Chức'}
              </p>
              {currentSelectedLocationObj.contactPerson?.phone && (
                <p className="text-red-200 font-semibold flex items-center gap-1 text-[11px] mt-0.5">
                  <Phone className="w-3 h-3" /> {currentSelectedLocationObj.contactPerson.phone}
                </p>
              )}
            </div>
          </div>

          {/* Registration Progress */}
          {typeof currentSelectedLocationObj.capacity === 'number' && (
            <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-red-200 font-semibold">
                <Users className="w-4 h-4 text-red-300" />
                <span>Chỉ tiêu chiến dịch:</span>
                <span className="font-extrabold text-white">
                  {currentSelectedLocationObj.registeredCount || 0} / {currentSelectedLocationObj.capacity} lượt đăng ký
                </span>
              </div>
              <div className="w-full sm:w-48 bg-black/30 rounded-full h-2 overflow-hidden border border-white/20">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((currentSelectedLocationObj.registeredCount || 0) / (currentSelectedLocationObj.capacity || 1)) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#f1f3f5] rounded-2xl p-6 shadow-xs flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-[#93000b] shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chưa chọn chiến dịch</h3>
            <p className="text-xs text-slate-500">Vui lòng chọn một điểm hiến máu bên dưới hoặc sử dụng bản đồ tương tác.</p>
          </div>
        </div>
      )}

      {/* TWO COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Locations Selection List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#93000b]">
              <MapPin className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">Danh Sách Điểm Hiến Máu</h2>
              {loadingLocations && <Loader2 className="w-4 h-4 animate-spin text-[#93000b]" />}
            </div>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Bản đồ
            </button>
          </div>

          {/* Banner Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#93000b] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#93000b] uppercase tracking-wide flex items-center gap-1">
                Gợi ý địa điểm tiếp nhận
              </span>
              <p className="text-xs text-slate-600 font-medium leading-tight">
                Chọn điểm hiến máu phù hợp nhất với vị trí của bạn
              </p>
            </div>
          </div>

          {/* Campaign List */}
          {loadingLocations ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-[#93000b] animate-spin mb-2" />
              <p className="text-xs text-slate-500">Đang tải danh sách các điểm hiến máu...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center">
              <p className="text-xs font-medium text-slate-500">Không có chiến dịch phù hợp cho ngày đã chọn.</p>
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="mt-3 text-xs font-bold text-[#93000b] hover:underline cursor-pointer"
              >
                Xem chiến dịch hôm nay
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isSelected = selectedLoc === loc.id;
                const locAllPassed = areAllSlotsPassedOnDate(selectedDate, loc.timeSlots);
                return (
                  <div
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc.id)}
                    className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#93000b] bg-red-50/50 ring-2 ring-[#93000b]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-[#93000b]/40 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#93000b] bg-[#93000b] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#93000b] shrink-0" />
                          {loc.name}
                        </span>
                        {locAllPassed ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full shrink-0">
                            Đã hết giờ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                            Đang nhận
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{loc.address}</p>

                      {loc.targetBloodGroups && loc.targetBloodGroups.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[10px] font-bold text-slate-400">Nhóm máu:</span>
                          {loc.targetBloodGroups.slice(0, 4).map((bg) => (
                            <span key={bg} className="px-1.5 py-0.2 text-[10px] font-bold bg-red-50 text-[#93000b] rounded border border-red-100">
                              {bg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Date & Time Slot Selection */}
        <div className="flex flex-col gap-6">

          {/* Date Selector (Current or Future Dates ONLY) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#93000b]">
                <CalendarDays className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900">Chọn Ngày Hiến Máu</h2>
              </div>
              <span className="text-xs font-semibold text-[#93000b] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                Chỉ ngày hiện tại & tương lai
              </span>
            </div>

            {/* Campaign Operating Dates Info Header */}
            {currentSelectedLocationObj?.startDateTime && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Thời gian hoạt động chiến dịch: <strong className="text-blue-900">{formatDateString(currentSelectedLocationObj.startDateTime)}</strong> đến <strong className="text-blue-900">{formatDateString(currentSelectedLocationObj.endDateTime)}</strong>
                </span>
              </div>
            )}

            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/20 outline-none bg-white cursor-pointer"
            />
          </div>

          {/* Time Slot Selector with Remaining Slot Counter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#93000b]">
                <Clock className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900">Chọn Khung Giờ</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                (Số chỗ còn lại theo thời gian thực)
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {currentSelectedLocationObj ? (
                <>
                  <p className="text-xs text-slate-600">
                    Khung giờ khả dụng tại <strong className="text-slate-900">{currentSelectedLocationObj.name}</strong> ngày <strong className="text-[#93000b]">{formatDateString(selectedDate)}</strong>:
                  </p>

                  {allSlotsPassedForDate && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0" />
                      <span>
                        Đã qua khung giờ tiếp nhận cuối cùng trong ngày ({selectedDate === todayStr ? 'hôm nay' : selectedDate}). Vui lòng chọn ngày tiếp theo để đặt lịch.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTimeSlots.map((slot, index) => {
                      const slotLabel = `${slot.startTime} - ${slot.endTime}`;
                      const isSelected = selectedTime === slotLabel;
                      const cap = Number(slot.capacity) || 0;
                      const reg = Number(slot.registeredCount) || 0;
                      const remaining = Math.max(0, cap - reg);
                      const isFull = remaining <= 0;
                      const isPassed = isSlotPassed(selectedDate, slot.endTime);
                      const isDisabled = isFull || isPassed;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTime(slotLabel)}
                          disabled={isDisabled}
                          className={`p-3.5 border rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#93000b] bg-[#93000b] text-white shadow-sm ring-2 ring-[#93000b]/30'
                              : isDisabled
                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-[#93000b]/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold flex items-center gap-1.5">
                              <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#93000b]'}`} />
                              {slotLabel}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                          </div>

                          {/* Remaining Slot Counter Badge */}
                          <div className="mt-2 flex items-center justify-between text-xs">
                            {isPassed ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                Đã qua giờ
                              </span>
                            ) : isFull ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                Hết chỗ (0/{cap})
                              </span>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : remaining <= 5
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                Còn {remaining}/{cap} chỗ
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                  <MapPin className="w-8 h-8 mb-2 opacity-40 text-[#93000b]" />
                  <p className="text-xs">Vui lòng chọn một điểm hiến máu ở cột bên trái</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={() => navigate('/my-appointments')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Lịch hẹn của tôi
        </button>

        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Bước tiếp theo: Khảo sát sức khỏe
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step1_LocationTime;
