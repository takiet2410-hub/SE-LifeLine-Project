import React, { useState } from 'react';
import { AlertTriangle, Lock, RotateCcw, ShieldCheck, UserRoundX, X } from 'lucide-react';
import type { UserItem } from '../types/admin.types';

interface AccountLifecycleModalProps {
  user: UserItem;
  mode: 'restore' | 'purge';
  onClose: () => void;
  onConfirm: (reason: string, confirmationUsername: string, adminPassword: string) => Promise<void>;
}

export const AccountLifecycleModal: React.FC<AccountLifecycleModalProps> = ({
  user,
  mode,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Người dùng yêu cầu xóa dữ liệu cá nhân để đăng ký lại.');
  const [confirmationUsername, setConfirmationUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isPurge = mode === 'purge';
  const emailMatches = confirmationUsername.trim().toLowerCase() === user.email.toLowerCase();
  const canSubmit = emailMatches && (!isPurge || (reason.trim().length >= 10 && adminPassword.length > 0)) && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError('');
      await onConfirm(reason.trim(), confirmationUsername.trim(), adminPassword);
      onClose();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể hoàn tất thao tác.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${isPurge ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isPurge ? <UserRoundX className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {isPurge ? 'Xóa dữ liệu cá nhân' : 'Khôi phục tài khoản'}
              </h3>
              <p className="text-xs text-slate-500">{user.fullName} · {user.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isPurge ? (
            <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
              <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Thao tác không thể hoàn tác</p>
              <p>Email và CCCD sẽ được giải phóng để đăng ký tài khoản mới.</p>
              <p>Hồ sơ cá nhân sẽ được ẩn danh; thiết bị, thông báo, badge và hội thoại chatbot sẽ bị xóa.</p>
              <p>Lịch sử appointment, donation và SOS vẫn được giữ dưới định danh ẩn danh.</p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" /> Giữ nguyên toàn bộ lịch sử</p>
              <p>Tài khoản sẽ được kích hoạt lại và người dùng có thể tiếp tục sử dụng email hiện tại.</p>
            </div>
          )}

          {isPurge && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Lý do xóa dữ liệu</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={10}
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {isPurge && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mật khẩu hiện tại của Administrator</label>
              <input
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Nhập chính xác email <code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-red-700">{user.email}</code> để xác nhận
            </label>
            <div className="relative">
              <input
                type="email"
                value={confirmationUsername}
                onChange={(event) => setConfirmationUsername(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm outline-hidden focus:ring-2 focus:ring-red-500"
              />
              <Lock className="absolute top-3.5 left-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                isPurge ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {submitting ? 'Đang xử lý...' : isPurge ? 'Xóa dữ liệu & giải phóng định danh' : 'Khôi phục tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
