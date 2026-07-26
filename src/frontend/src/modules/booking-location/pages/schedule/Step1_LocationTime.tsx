import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { MapPin, CalendarDays, Clock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { searchLocations } from '../../api/bookingApi';
import { toast } from 'sonner';

// Extended location interface to include timeSlots
interface LocationOption {
  id: string;
  name: string;
  address: string;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    capacity: number;
    registeredCount: number;
  }>;
}

const fallbackLocations: LocationOption[] = [
  { 
    id: 'L-1', 
    name: 'Cho Ray Hospital', 
    address: '201B Nguyen Chi Thanh, Ward 12',
    timeSlots: [
      { startTime: '08:00', endTime: '09:00', capacity: 10, registeredCount: 0 },
      { startTime: '09:00', endTime: '10:00', capacity: 10, registeredCount: 0 },
      { startTime: '10:00', endTime: '11:00', capacity: 10, registeredCount: 0 },
      { startTime: '13:00', endTime: '14:00', capacity: 10, registeredCount: 0 },
      { startTime: '14:00', endTime: '15:00', capacity: 10, registeredCount: 0 },
      { startTime: '15:00', endTime: '16:00', capacity: 10, registeredCount: 0 }
    ]
  },
  { 
    id: 'L-2', 
    name: 'Blood Transfusion Hematology Hospital', 
    address: '118 Hong Bang, Ward 12',
    timeSlots: [
      { startTime: '08:00', endTime: '09:00', capacity: 10, registeredCount: 0 },
      { startTime: '09:00', endTime: '10:00', capacity: 10, registeredCount: 0 },
      { startTime: '10:00', endTime: '11:00', capacity: 10, registeredCount: 0 },
      { startTime: '13:00', endTime: '14:00', capacity: 10, registeredCount: 0 },
      { startTime: '14:00', endTime: '15:00', capacity: 10, registeredCount: 0 },
      { startTime: '15:00', endTime: '16:00', capacity: 10, registeredCount: 0 }
    ]
  },
  { 
    id: 'L-3', 
    name: 'Tu Du Hospital', 
    address: '284 Cong Quynh, District 1',
    timeSlots: [
      { startTime: '08:00', endTime: '09:00', capacity: 10, registeredCount: 0 },
      { startTime: '09:00', endTime: '10:00', capacity: 10, registeredCount: 0 },
      { startTime: '10:00', endTime: '11:00', capacity: 10, registeredCount: 0 },
      { startTime: '13:00', endTime: '14:00', capacity: 10, registeredCount: 0 },
      { startTime: '14:00', endTime: '15:00', capacity: 10, registeredCount: 0 },
      { startTime: '15:00', endTime: '16:00', capacity: 10, registeredCount: 0 }
    ]
  }
];

export const Step1_LocationTime: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();

  const [selectedLoc, setSelectedLoc] = useState(data.locationId || '');
  const [selectedDate, setSelectedDate] = useState(data.date || '');
  const [selectedTime, setSelectedTime] = useState(data.timeSlot || '');
  const [locations, setLocations] = useState<LocationOption[]>(fallbackLocations);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const res = await searchLocations(selectedDate ? { date: selectedDate } : undefined);
        if (res.success && res.data && res.data.length > 0) {
          // Convert backend campaign data to our location format
          const locationOptions: LocationOption[] = res.data.map((campaign: any) => ({
            id: campaign._id,
            name: campaign.name,
            // For now, we'll use coordinates as address since backend doesn't provide formatted address
            // In a real app, we'd use reverse geocoding or store address in the campaign
            address: campaign.location.coordinates
              ? `Lat: ${campaign.location.coordinates[1]}, Lng: ${campaign.location.coordinates[0]}`
              : 'Address not available',
            timeSlots: campaign.timeSlots || []
          }));
          
          setLocations(locationOptions);
          toast.success(`Tìm thấy ${locationOptions.length} địa điểm hiến máu`);
        } else {
          setLocations(fallbackLocations);
          toast.warning('Không tìm thấy chiến dịch nào, hiển thị địa điểm mặc định');
        }
      } catch {
        setLocations(fallbackLocations);
        toast.error('Không thể tải địa điểm, hiển thị địa điểm mặc định');
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [selectedDate]);

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
          address: locObj.address
        } : undefined
      });
      navigate('/my-appointments/schedule/step-2');
    }
  };

  const isFormComplete = selectedLoc && selectedDate && selectedTime;

  return (
    <div className="flex flex-col gap-6">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Locations */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#93000b]">
            <MapPin className="w-5 h-5" />
            <h2 className="text-[16px] font-bold text-[#271816]">Select Location</h2>
            {loadingLocations && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          {locations.length === 0 && !loadingLocations ? (
            <p className="text-sm text-slate-500">No campaigns available for the selected date.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedLoc === loc.id
                      ? 'border-[#93000b] bg-[#fff8f7] ring-1 ring-[#93000b]'
                      : 'border-[#dee2e6] bg-white hover:border-[#a3a3a3]'
                  }`}
                >
                  <input
                    type="radio"
                    name="location"
                    value={loc.id}
                    checked={selectedLoc === loc.id}
                    onChange={(e) => setSelectedLoc(e.target.value)}
                    className="mt-1 w-4 h-4 text-[#93000b] border-gray-300 focus:ring-[#93000b]"
                  />
                  <div className="ml-3">
                    <p className="text-[14px] font-bold text-[#271816]">{loc.name}</p>
                    <p className="text-[12px] text-[#6c757d] mt-1">{loc.address}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Date & Time */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#93000b]">
              <CalendarDays className="w-5 h-5" />
              <h2 className="text-[16px] font-bold text-[#271816]">Select Date</h2>
            </div>
            {/* Simple Mock Calendar Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#dee2e6] rounded-xl text-[14px] font-medium text-[#271816] focus:border-[#93000b] focus:ring-1 focus:ring-[#93000b] outline-none"
            />
          </div>

          <div className="bg-white border border-[#f1f3f5] rounded-xl p-6 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4 text-[#93000b]">
              <Clock className="w-5 h-5" />
              <h2 className="text-[16px] font-bold text-[#271816]">Select Time Slot</h2>
            </div>

            {/* Dynamic time slots based on selected location */}
            <div className="space-y-4">
              {selectedLoc ? (
                <>
                  <p className="text-[12px] text-[#6c757d] mb-2">Available time slots for selected location:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {locations
                      .find(loc => loc.id === selectedLoc)?.timeSlots
                        .map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => 
                              setSelectedTime(`${slot.startTime} - ${slot.endTime}`)}
                            disabled={slot.registeredCount >= slot.capacity}
                            className={`py-2 px-3 border rounded-lg text-[13px] font-semibold transition-all ${
                              selectedTime === `${slot.startTime} - ${slot.endTime}`
                                ? 'border-[#93000b] bg-[#93000b] text-white'
                                : slot.registeredCount >= slot.capacity
                                  ? 'border-[#dee2e6] bg-[#f8f9fa] text-[#6c757d] cursor-not-allowed'
                                  : 'border-[#dee2e6] bg-white text-[#271816] hover:border-[#a3a3a3]'
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                            {slot.registeredCount >= slot.capacity && (
                              <span className="text-[10px] text-[#dc3545] ml-1">(Full)</span>
                            )}
                          </button>
                        )) || []
                  }
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Please select a location first</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => navigate('/my-appointments')}
          className="flex items-center gap-2 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Appointments
        </button>

        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
