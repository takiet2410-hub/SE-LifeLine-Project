import React, { useState } from 'react';
import { AlertTriangle, X, Lock } from 'lucide-react';
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
  const [reason, setReason] = useState('Account Violation');
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
    } catch (err: any) {
      setError(err.message || 'Failed to soft delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Deactivate User Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Soft-delete & session revocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <strong>Warning:</strong> Deactivating account for <strong>{user.fullName}</strong> ({user.email}) will set status to <em>Suspended</em>, invalidate active JWT tokens, and preserve medical records for compliance.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Deactivation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              <option value="Account Violation">Account Policy Violation</option>
              <option value="Inactivity Timeout">Prolonged Inactivity</option>
              <option value="Requested by User">Requested by Account Holder (Data Privacy)</option>
              <option value="Security Lockdown">Emergency Security Lockdown</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              To confirm, type account email <code className="text-red-600 bg-red-50 dark:bg-red-950/50 px-1 py-0.5 rounded">{user.email}</code>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={user.email}
                value={confirmationUsername}
                onChange={(e) => setConfirmationUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmationUsername.toLowerCase() !== user.email.toLowerCase()}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition shadow-md"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Deactivation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
