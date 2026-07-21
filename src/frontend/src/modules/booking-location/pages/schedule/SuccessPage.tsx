import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useScheduleContext } from '../../context/ScheduleContext';

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useScheduleContext();

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center max-w-[600px] mx-auto animate-in fade-in zoom-in duration-500">
      
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>

      <h1 className="text-[28px] font-bold text-[#271816] tracking-tight mb-2">
        Booking Confirmed!
      </h1>
      <p className="text-[15px] text-[#6c757d] mb-8 max-w-[400px]">
        Your appointment has been successfully scheduled. Thank you for your commitment to saving lives.
      </p>

      <div className="bg-[#f8f9fa] border border-[#f1f3f5] rounded-xl p-6 w-full mb-8">
        <div className="flex items-center gap-3 mb-4 text-[#271816]">
          <FileText className="w-5 h-5 text-[#93000b]" />
          <span className="font-bold text-[15px]">Next Steps</span>
        </div>
        <ul className="text-left text-[14px] text-[#5b403d] flex flex-col gap-3">
          <li className="flex gap-2">
            <span className="text-[#93000b]">•</span>
            Please arrive at the location 10 minutes prior to your time slot ({data.timeSlot || '09:00 - 10:00'}).
          </li>
          <li className="flex gap-2">
            <span className="text-[#93000b]">•</span>
            Bring a valid photo ID (Citizen ID card).
          </li>
          <li className="flex gap-2">
            <span className="text-[#93000b]">•</span>
            Have a light meal and drink plenty of water before arriving.
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <button
          onClick={() => navigate('/my-appointments')}
          className="flex-1 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all"
        >
          View My Appointments
        </button>
        <button
          onClick={() => navigate('/my-appointments/schedule')}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          Schedule Another
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
