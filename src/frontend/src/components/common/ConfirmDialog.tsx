import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'warning',
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const titleText = title || t('common.discardTitle');
  const messageText = message || t('common.discardMessage');
  const confirmText = confirmLabel || t('common.discard');
  const cancelText = cancelLabel || t('common.cancel');

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${variantStyles.iconBg}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{titleText}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed pl-12">
            {messageText}
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs ${variantStyles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
