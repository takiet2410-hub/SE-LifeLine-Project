import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Trash2, Clock, Hospital } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import type { NotificationData } from '../../../services/mockData';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import { format } from 'date-fns';

export const NotificationListPage: React.FC = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotifications(typeFilter, statusFilter);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await apiService.removeNotification(deleteTargetId);
      setNotifications((prev) => prev.filter((n) => n._id !== deleteTargetId));
      toast.success('Đã xóa thông báo!');
    } catch (err) {
      toast.error('Xóa thông báo thất bại.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Thông Báo Hệ Thống</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cập nhật các yêu cầu máu cấp cứu (SOS) từ bệnh viện và cảnh báo hệ thống
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Loại thông báo:</span>
          {['All', 'SOS', 'Campaign', 'Routine'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                typeFilter === type
                  ? type === 'SOS'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'All' ? 'Tất cả' : type === 'SOS' ? '🚨 Cấp cứu (SOS)' : type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
          {['All', 'Unread'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'Tất cả' : 'Chưa đọc'}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <SkeletonLoader type="table" rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState message="Không có thông báo nào" />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const isSOS = item.type === 'SOS';
            const isUnread = item.readAt === null;

            return (
              <div
                key={item._id}
                onClick={() => navigate(`/bc/notifications/${item._id}`)}
                className={`rounded-xl p-5 border transition-all cursor-pointer relative group ${
                  isSOS
                    ? 'bg-red-50 border-red-300 border-l-4 border-l-red-600 shadow-xs shadow-red-100 hover:bg-red-100/80'
                    : isUnread
                    ? 'bg-white border-slate-300 border-l-4 border-l-blue-600 shadow-xs hover:bg-slate-50'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className={`p-2.5 rounded-full shrink-0 mt-0.5 ${
                        isSOS
                          ? 'bg-red-600 text-white shadow-xs animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isSOS ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* Notification Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm ${
                            isSOS
                              ? 'text-red-950 font-bold text-base'
                              : isUnread
                              ? 'text-slate-900 font-bold'
                              : 'text-slate-800 font-medium'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                            isSOS
                              ? 'bg-red-600 text-white font-extrabold uppercase tracking-wide shadow-2xs'
                              : 'bg-blue-100 text-blue-700 font-semibold'
                          }`}
                        >
                          {isSOS ? '🔴 SOS Emergency' : item.type}
                        </span>
                      </div>

                      <p
                        className={`text-xs ${
                          isSOS ? 'text-red-800 font-medium' : 'text-slate-600'
                        } line-clamp-2 leading-relaxed`}
                      >
                        {item.body}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Hospital className="w-3.5 h-3.5" />
                          {item.senderName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(item._id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Xóa thông báo?"
        message="Bạn có chắc chắn muốn xóa thông báo này khỏi danh sách không?"
        confirmLabel="Xóa ngay"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
