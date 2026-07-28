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

  const formatDateSafe = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'dd/MM/yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

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
      toast.success('Đã xóa thông báo khỏi danh sách!');
    } catch (err) {
      toast.error('Xóa thông báo thất bại.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#f1f3f5] p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
              Thông Báo System & Yêu Cầu SOS
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#93000b] text-white rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-[13px] font-normal text-[#6c757d] mt-1">
            Tiếp nhận yêu cầu cấp cứu khẩn cấp (SOS) từ các bệnh viện đối tác và cảnh báo vận hành kho máu.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Loại thông báo:</span>
          {['All', 'SOS', 'Campaign', 'Routine'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                typeFilter === type
                  ? type === 'SOS'
                    ? 'bg-[#93000b] text-white shadow-2xs'
                    : 'bg-[#1a1a2e] text-white shadow-2xs'
                  : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
              }`}
            >
              {type === 'All' ? 'Tất cả' : type === 'SOS' ? '🚨 Cấp cứu (SOS)' : type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-[#6c757d] mr-1">Trạng thái:</span>
          {['All', 'Unread'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1a1a2e] text-white shadow-2xs'
                  : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
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
        <EmptyState message="Không tìm thấy thông báo nào." />
      ) : (
        <div className="space-y-3.5">
          {notifications.map((item) => {
            const isSOS = item.type === 'SOS';
            const isUnread = item.readAt === null;

            return (
              <div
                key={item._id}
                onClick={() => navigate(`/bc/notifications/${item._id}`)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer relative group ${
                  isSOS
                    ? 'bg-red-50/70 border-red-300 border-l-4 border-l-[#93000b] shadow-xs hover:bg-red-100/70'
                    : isUnread
                    ? 'bg-white border-[#f1f3f5] border-l-4 border-l-[#1a1a2e] shadow-2xs hover:bg-slate-50'
                    : 'bg-white border-[#f1f3f5] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSOS
                          ? 'bg-[#93000b] text-white shadow-sm animate-pulse'
                          : 'bg-slate-100 text-[#1a1a2e]'
                      }`}
                    >
                      {isSOS ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* Notification Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-[15px] ${
                            isSOS
                              ? 'text-[#93000b] font-bold'
                              : isUnread
                              ? 'text-[#271816] font-bold'
                              : 'text-[#271816] font-medium'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isSOS
                              ? 'bg-[#93000b] text-white shadow-2xs'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {isSOS ? '🚨 SOS EMERGENCY' : item.type}
                        </span>
                      </div>

                      <p
                        className={`text-[13px] ${
                          isSOS ? 'text-[#93000b] font-medium' : 'text-[#5b403d]'
                        } leading-relaxed`}
                      >
                        {item.body}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#6c757d] pt-1">
                        <span className="flex items-center gap-1 font-semibold text-[#271816]">
                          <Hospital className="w-3.5 h-3.5 text-[#93000b]" />
                          {item.senderName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#6c757d]" />
                          {formatDateSafe(item.createdAt)}
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
                    className="p-2 text-[#a3a3a3] hover:text-[#93000b] hover:bg-white rounded-lg transition-colors cursor-pointer"
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
        message="Bạn có chắc chắn muốn xóa thông báo này khỏi hệ thống không?"
        confirmLabel="Xóa Ngay"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default NotificationListPage;
