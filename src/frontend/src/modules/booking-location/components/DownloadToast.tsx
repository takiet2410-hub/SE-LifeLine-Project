import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface DownloadToastProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const DownloadToast: React.FC<DownloadToastProps> = ({
  isVisible,
  message,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border border-[#16a34a]/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 flex items-center gap-3 w-[min(320px,calc(100vw-2rem))]">
        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
        </div>
        <p className="flex-1 text-[14px] font-medium text-[#271816]">
          {message}
        </p>
        <button
          onClick={onClose}
          className="p-1 text-[#a3a3a3] hover:text-[#271816] transition-colors rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
