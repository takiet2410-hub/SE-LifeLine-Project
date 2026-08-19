import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.noData');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center my-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-slate-700">{displayMessage}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem kết quả khác.
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
