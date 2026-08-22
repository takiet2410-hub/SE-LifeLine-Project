import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { BagStatus } from '../types/inventory.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: BagStatus;
  onSave: (newStatus: BagStatus, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const StatusEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentStatus,
  onSave,
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<BagStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTerminal = ['Expired', 'Used', 'Discarded'].includes(currentStatus);

  const getValidTransitions = (st: BagStatus): BagStatus[] => {
    switch (st) {
      case 'Available':
        return ['Reserved', 'Used', 'Expired', 'Discarded'];
      case 'Reserved':
        return ['Available', 'Used', 'Discarded'];
      default:
        return [];
    }
  };

  const allowedStatuses = getValidTransitions(currentStatus);

  const getStatusLabel = (st: BagStatus) => {
    switch (st) {
      case 'Available':
        return 'Khả dụng';
      case 'Reserved':
        return 'Đã đặt trước';
      case 'Used':
        return 'Đã sử dụng';
      case 'Expired':
        return 'Đã hết hạn';
      case 'Discarded':
        return 'Đã hủy';
      default:
        return st;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do thay đổi trạng thái');
      return;
    }
    setError(null);
    await onSave(selectedStatus, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Chỉnh Sửa Trạng Thái Túi Máu</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isTerminal ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Túi máu hiện đang ở trạng thái <strong>{getStatusLabel(currentStatus)}</strong> (trạng thái kết thúc). Không thể thay đổi trạng thái.
              </span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trạng Thái Mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BagStatus)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value={currentStatus}>{getStatusLabel(currentStatus)} (Hiện tại)</option>
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      {getStatusLabel(st)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lý do thay đổi trạng thái <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="VD: Cấp phát cho phẫu thuật cấp cứu tại Bệnh viện Chợ Rẫy"
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            {!isTerminal && (
              <button
                type="submit"
                disabled={isLoading || selectedStatus === currentStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
