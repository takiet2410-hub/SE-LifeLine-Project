import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessToastProps {
  isVisible?: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  isVisible = true,
  title = 'Success',
  message = 'Your password has been updated.',
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="w-[min(320px,calc(100vw-2rem))] bg-white border border-[#16a34a] rounded-lg p-4 shadow-lg flex items-center gap-4">
        {/* Green Icon Box */}
        <div className="w-10 h-10 rounded-lg bg-[#16a34a]/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold text-[#271816] leading-none mb-1">
            {title}
          </h4>
          <p className="text-[12px] font-medium text-[#6c757d] leading-[16.8px] truncate">
            {message}
          </p>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="text-[#a3a3a3] hover:text-[#271816] p-1 rounded transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessToast;
