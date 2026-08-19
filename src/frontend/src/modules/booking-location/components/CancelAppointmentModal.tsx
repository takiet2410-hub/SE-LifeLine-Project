import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  error: string | null;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isProcessing && onClose()}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-[400px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-1 text-[#a3a3a3] hover:text-[#271816] transition-colors rounded-lg disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-6 md:p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>

          <h3 className="text-[20px] font-bold text-[#271816] mb-2 tracking-tight">
            Cancel Appointment?
          </h3>
          
          <p className="text-[14px] text-[#6c757d] mb-6">
            Are you sure you want to cancel this appointment? This action cannot be undone and your slot will be given to someone else.
          </p>

          {/* Error Message Display */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left animate-in fade-in flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-[#93000b]">Không thể hủy lịch hẹn</p>
                <p className="text-[12px] text-red-800 leading-relaxed mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="w-full flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 bg-white border border-[#dee2e6] text-[#271816] text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Keep It
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 bg-[#93000b] text-white text-[14px] font-semibold rounded-lg hover:bg-[#7a0009] transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
            >
              {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
