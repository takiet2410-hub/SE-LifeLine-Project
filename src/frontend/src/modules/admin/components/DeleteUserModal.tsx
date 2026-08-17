import React, { useState } from 'react';
import { AlertTriangle, X, Lock, ChevronDown, ShieldOff } from 'lucide-react';
import type { UserItem } from '../types/admin.types';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onConfirm: (reason: string, confirmationUsername: string) => Promise<void>;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Account Policy Violation');
  const [confirmationUsername, setConfirmationUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      setError('Confirmation email does not match account email.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(reason, confirmationUsername);
      onClose();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to process account suspension.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Suspend User Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lock login and preserve historical records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
            <p className="flex items-center gap-1"><ShieldOff className="w-4 h-4" /><strong>Cảnh báo:</strong> Khóa tài khoản của <strong>{user.fullName}</strong> ({user.email}).</p>
            <p>• Người dùng <strong>không thể đăng nhập</strong> vào hệ thống.</p>
            <p>• Email, CCCD và dữ liệu lịch sử được giữ nguyên để bảo toàn audit.</p>
          </div>

          <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lý do khóa tài khoản (Reason for Deactivation)
              </label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden appearance-none cursor-pointer pr-10"
                >
                  <option value="Account Policy Violation" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Account Policy Violation
                  </option>
                  <option value="Prolonged Inactivity" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Prolonged Inactivity
                  </option>
                  <option value="Requested by Account Holder" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Requested by Account Holder (Data Privacy)
                  </option>
                  <option value="Emergency Security Lockdown" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Emergency Security Lockdown
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nhập chính xác email <code className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded font-mono font-bold">{user.email}</code> để xác nhận:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={user.email}
                value={confirmationUsername}
                onChange={(e) => setConfirmationUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmationUsername.toLowerCase() !== user.email.toLowerCase()}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đình chỉ (Suspend)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
