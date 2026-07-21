import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { CalendarDays, Clock, MapPin, CheckCircle2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

const mockLocations = {
  'L-1': { name: 'Cho Ray Hospital', address: '201B Nguyen Chi Thanh, Ward 12' },
  'L-2': { name: 'Blood Transfusion Hematology Hospital', address: '118 Hong Bang, Ward 12' },
  'L-3': { name: 'Tu Du Hospital', address: '284 Cong Quynh, District 1' },
};

export const Step3_Summary: React.FC = () => {
  const navigate = useNavigate();
  const { data, resetData } = useScheduleContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loc = data.locationId ? mockLocations[data.locationId as keyof typeof mockLocations] : null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      resetData();
      navigate('/my-appointments/schedule/success');
    }, 1500);
  };

  // Check if they answered YES to any risky questions
  const hasRiskyAnswers = data.healthAnswers && Object.values(data.healthAnswers).some(val => val === true);

  if (!data.date || !data.locationId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[14px] text-[#6c757d] mb-4">Incomplete information. Please start over.</p>
        <button 
          onClick={() => navigate('/my-appointments/schedule')}
          className="px-6 py-2 bg-[#93000b] text-white rounded-lg text-[14px] font-semibold"
        >
          Back to Start
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
      {/* Top Banner */}
      <div className="bg-[#fff8f7] border border-[#f1f3f5] rounded-xl p-6 shadow-sm text-center">
        <CheckCircle2 className="w-12 h-12 text-[#93000b] mx-auto mb-3" />
        <h2 className="text-[20px] font-bold text-[#271816] mb-1">Almost Done!</h2>
        <p className="text-[14px] text-[#5b403d]">Please review your booking details before confirming.</p>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: Date & Time */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] border-b border-[#f1f3f5] px-5 py-4">
            <h3 className="text-[14px] font-bold text-[#271816]">Date & Time</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-[#93000b]" />
              </div>
              <div>
                <p className="text-[12px] text-[#6c757d] uppercase font-bold tracking-wide">Date</p>
                <p className="text-[15px] font-semibold text-[#271816]">{data.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#93000b]" />
              </div>
              <div>
                <p className="text-[12px] text-[#6c757d] uppercase font-bold tracking-wide">Time Slot</p>
                <p className="text-[15px] font-semibold text-[#271816]">{data.timeSlot}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Location */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] border-b border-[#f1f3f5] px-5 py-4">
            <h3 className="text-[14px] font-bold text-[#271816]">Location</h3>
          </div>
          <div className="p-5 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#93000b]" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#271816] mb-1">{loc?.name}</p>
              <p className="text-[13px] text-[#6c757d] leading-snug">{loc?.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Review Section */}
      <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm p-6 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-[#93000b] shrink-0" />
        <div>
          <h3 className="text-[15px] font-bold text-[#271816] mb-1">Health Screening Review</h3>
          {hasRiskyAnswers ? (
            <p className="text-[13px] text-amber-700 font-medium">
              You answered YES to some screening questions. A medical professional will consult with you on-site before proceeding.
            </p>
          ) : (
            <p className="text-[13px] text-[#6c757d]">
              All screening questions passed. Please maintain a healthy diet before your appointment.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => navigate('/my-appointments/schedule/step-2')}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Answers
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Appointment'
          )}
        </button>
      </div>
    </div>
  );
};
