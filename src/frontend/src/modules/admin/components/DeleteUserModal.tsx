import React, { useState } from 'react';
import { AlertTriangle, X, Lock, ChevronDown, Trash2, ShieldOff } from 'lucide-react';
import type { UserItem } from '../types/admin.types';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onConfirm: (reason: string, confirmationUsername: string, isPermanent: boolean) => Promise<void>;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
}) => {
  const [deleteMode, setDeleteMode] = useState<'suspend' | 'permanent'>('suspend');
  const [reason, setReason] = useState('Account Policy Violation');
  const [confirmationUsername, setConfirmationUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const isPermanent = deleteMode === 'permanent';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      setError('Confirmation email does not match account email.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(reason, confirmationUsername, isPermanent);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process account deletion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isPermanent ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isPermanent ? 'Delete User Account Permanently' : 'Suspend User Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isPermanent ? 'Permanent hard-delete from Database' : 'Lock login & preserve database record'}
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

        {/* Action Mode Switcher */}
        <div className="mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDeleteMode('suspend')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              !isPermanent
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldOff className="w-4 h-4" />
            <span>1. Khóa / Suspend (Giữ dữ liệu)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteMode('permanent')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              isPermanent
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>2. Xóa hẳn khỏi DB (Hard Delete)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!isPermanent ? (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
              <p><strong>Cảnh báo (Suspend):</strong> Khóa tài khoản của <strong>{user.fullName}</strong> ({user.email}).</p>
              <p>• Người dùng <strong>KHÔNG THỂ đăng nhập</strong> vào hệ thống.</p>
              <p>• Thông tin Email, CCCD và hồ sơ vẫn được giữ nguyên trong cơ sở dữ liệu (chống đăng ký trùng).</p>
            </div>
          ) : (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-900 dark:text-red-200 leading-relaxed space-y-1">
              <p><strong>CẢNH BÁO NGUY HIỂM (Hard Delete):</strong> Xóa hoàn toàn bản ghi tài khoản <strong>{user.fullName}</strong> ({user.email}) khỏi Database.</p>
              <p>• Hành động này <strong>KHÔNG THỂ KHÔI PHỤC</strong>.</p>
              <p>• Email và CCCD cũ sẽ được <strong>giải phóng hoàn toàn</strong> (người dùng có thể đăng ký tài khoản mới với Gmail/CCCD này).</p>
            </div>
          )}

          {!isPermanent && (
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
          )}

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
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 ${
                isPermanent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : isPermanent
                ? 'Xóa vĩnh viễn khỏi DB (Hard Delete)'
                : 'Xác nhận Đình chỉ (Suspend)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
