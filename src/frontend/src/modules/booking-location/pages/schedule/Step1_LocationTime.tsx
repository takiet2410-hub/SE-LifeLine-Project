import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { MapPin, CalendarDays, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

const mockLocations = [
  { id: 'L-1', name: 'Cho Ray Hospital', address: '201B Nguyen Chi Thanh, Ward 12' },
  { id: 'L-2', name: 'Blood Transfusion Hematology Hospital', address: '118 Hong Bang, Ward 12' },
  { id: 'L-3', name: 'Tu Du Hospital', address: '284 Cong Quynh, District 1' },
];

const mockTimeSlots = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', 
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'
];

export const Step1_LocationTime: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();

  const [selectedLoc, setSelectedLoc] = useState(data.locationId || '');
  const [selectedDate, setSelectedDate] = useState(data.date || '');
  const [selectedTime, setSelectedTime] = useState(data.timeSlot || '');

  const handleNext = () => {
    if (selectedLoc && selectedDate && selectedTime) {
      updateData({ locationId: selectedLoc, date: selectedDate, timeSlot: selectedTime });
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
          </div>
          
          <div className="flex flex-col gap-3">
            {mockLocations.map((loc) => (
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
            
            <div className="grid grid-cols-2 gap-3">
              {mockTimeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-3 border rounded-lg text-[13px] font-semibold transition-all ${
                    selectedTime === slot 
                      ? 'border-[#93000b] bg-[#93000b] text-white' 
                      : 'border-[#dee2e6] bg-white text-[#271816] hover:border-[#a3a3a3]'
                  }`}
                >
                  {slot}
                </button>
              ))}
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
