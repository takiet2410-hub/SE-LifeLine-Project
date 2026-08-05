import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { MapPin, CalendarDays, Clock, ArrowRight, ArrowLeft, Loader2, Sparkles, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { searchLocations } from '../../api/bookingApi';
import { isSlotPassed, areAllSlotsPassedOnDate, getFirstAvailableSlot } from '../../utils/timeslotUtils';

interface LocationOption {
  id: string;
  name: string;
  venue?: string;
  address: string;
  targetBloodGroups?: string[];
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
}

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
              targetBloodGroups: (item.targetBloodGroups && item.targetBloodGroups.length > 0) ? item.targetBloodGroups : ['Tất cả các nhóm máu'],
              timeSlots: slots,
            };
          });

          // Ensure location selected from Map is included ONLY IF date matches
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
          // 1. Determine location to select (by exact ID or campaign name matching from Map)
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

          // 2. Determine time slot to select: prioritize valid, non-passed, non-full slots!
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

  // When selected location changes, update time slots if necessary
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

  return (
    <div className="flex flex-col gap-6">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Locations Selection */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#93000b]">
              <MapPin className="w-5 h-5" />
              <h2 className="text-[16px] font-bold text-[#271816]">Chọn Địa Điểm Hiến Máu</h2>
              {loadingLocations && <Loader2 className="w-4 h-4 animate-spin text-[#93000b]" />}
            </div>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff8f7] border border-[#f9dcd8] text-[#93000b] hover:bg-[#ffe9e6] rounded-xl text-[12px] font-bold transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Bản đồ tương tác
            </button>
          </div>

          {/* Suggested Nearby Campaigns Banner */}
          <div className="bg-[#fff8f7] border border-[#f9dcd8] rounded-xl p-3.5 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#93000b] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#93000b] uppercase tracking-wide flex items-center gap-1">
                Gợi ý chiến dịch gần bạn
              </span>
              <p className="text-[12px] text-[#5b403d] font-medium leading-tight">
                Danh sách các điểm hiến máu chính thức tại bệnh viện và trung tâm y tế TP.HCM
              </p>
            </div>
          </div>

          {/* Campaign List */}
          {loadingLocations ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-[#93000b] animate-spin mb-2" />
              <p className="text-[13px] text-[#6c757d]">Đang tải danh sách các điểm hiến máu...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-8 border border-dashed border-[#dee2e6] rounded-xl text-center">
              <p className="text-[14px] font-medium text-[#6c757d]">Không có chiến dịch phù hợp cho ngày đã chọn.</p>
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="mt-3 text-[13px] font-bold text-[#93000b] hover:underline cursor-pointer"
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
                        ? 'border-[#93000b] bg-[#fff8f7] ring-1 ring-[#93000b] shadow-sm'
                        : 'border-[#dee2e6] bg-white hover:border-[#93000b]/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#93000b] bg-[#93000b] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[14px] font-bold text-[#271816] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#93000b] shrink-0" />
                          {loc.name}
                        </span>
                        {locAllPassed ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full shrink-0">
                            Đã hết giờ nhận
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                            Gần bạn
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#6c757d] leading-snug">{loc.address}</p>

                      {loc.targetBloodGroups && loc.targetBloodGroups.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[10px] font-bold text-[#6c757d]">Nhóm máu cần:</span>
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
          {/* Date Selector */}
          <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#93000b]">
              <CalendarDays className="w-5 h-5" />
              <h2 className="text-[16px] font-bold text-[#271816]">Chọn Ngày Hiến Máu</h2>
            </div>
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#dee2e6] rounded-xl text-[14px] font-medium text-[#271816] focus:border-[#93000b] focus:ring-1 focus:ring-[#93000b] outline-none bg-white cursor-pointer"
            />
          </div>

          {/* Time Slot Selector */}
          <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-[#93000b]">
              <Clock className="w-5 h-5" />
              <h2 className="text-[16px] font-bold text-[#271816]">Chọn Khung Giờ</h2>
            </div>

            <div className="space-y-4 flex-1">
              {currentSelectedLocationObj ? (
                <>
                  <p className="text-[12px] text-[#6c757d]">
                    Khung giờ có sẵn tại <span className="font-bold text-[#271816]">{currentSelectedLocationObj.name}</span>:
                  </p>

                  {allSlotsPassedForDate && (
                    <div className="p-3.5 bg-[#fff1f2] border border-[#fecdd3] rounded-xl text-[13px] text-[#991b1b] font-medium flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0" />
                      <span>
                        Đã qua khung giờ tiếp nhận cuối cùng trong ngày ({selectedDate === todayStr ? 'hôm nay' : selectedDate}). Vui lòng chọn ngày tiếp theo để đặt lịch.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {(currentSelectedLocationObj.timeSlots || defaultSlots).map((slot, index) => {
                      const slotLabel = `${slot.startTime} - ${slot.endTime}`;
                      const isSelected = selectedTime === slotLabel;
                      const isFull = slot.registeredCount >= slot.capacity;
                      const isPassed = isSlotPassed(selectedDate, slot.endTime);
                      const isDisabled = isFull || isPassed;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTime(slotLabel)}
                          disabled={isDisabled}
                          className={`py-3 px-3 border rounded-xl text-[13px] font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'border-[#93000b] bg-[#93000b] text-white shadow-sm'
                              : isDisabled
                                ? 'border-[#dee2e6] bg-[#f8f9fa] text-[#a3a3a3] cursor-not-allowed opacity-60'
                                : 'border-[#dee2e6] bg-white text-[#271816] hover:border-[#93000b]/50'
                          }`}
                        >
                          {slotLabel}
                          {isPassed ? (
                            <span className="block text-[10px] text-amber-700 font-normal mt-0.5">(Đã qua giờ)</span>
                          ) : isFull ? (
                            <span className="block text-[10px] text-red-600 font-normal mt-0.5">(Hết chỗ)</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-[#6c757d]">
                  <MapPin className="w-8 h-8 mb-2 opacity-40 text-[#93000b]" />
                  <p className="text-[13px]">Vui lòng chọn một điểm hiến máu ở cột bên trái</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => navigate('/my-appointments')}
          className="flex items-center gap-2 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Lịch hẹn của tôi
        </button>

        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Bước tiếp theo: Khảo sát sức khỏe
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
