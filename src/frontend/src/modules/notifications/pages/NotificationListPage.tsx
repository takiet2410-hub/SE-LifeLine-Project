import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Bell, Trash2, Clock, Hospital, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import type { NotificationData } from '../../../services/mockData';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import { format } from 'date-fns';
import { getArticleIdFromNotification, getArticleRouteForRole } from '../../../utils/notificationHelpers';
import { useAuth } from '../../../shared/contexts/AuthContext';

export const NotificationListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isHospitalPage = location.pathname.startsWith('/hospital') || user?.role === 'hospital' || user?.role === 'HospitalStaff';
  const isAdminPage = location.pathname.startsWith('/admin') || user?.role === 'admin' || user?.role === 'Administrator';
  const isBcPage = location.pathname.startsWith('/bc') || user?.role === 'staff' || user?.role === 'BloodCenterStaff' || (!isHospitalPage && !isAdminPage);

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getNotifications({
        type: typeFilter === 'All' ? undefined : typeFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        page,
        limit: 20,
      });
      
      setNotifications(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await apiService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const handleUpdate = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await apiService.removeNotification(deleteTargetId);
      setNotifications((prev) => prev.filter((n) => n._id !== deleteTargetId));
      toast.success('Đã xóa thông báo khỏi danh sách!');
      fetchUnreadCount();
    } catch (err) {
      toast.error('Xóa thông báo thất bại.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markMultipleNotificationsAsRead([]);
      // Pass empty array with markAllAsRead=true handled server-side
      // Re-fetch to get updated state
      await fetchNotifications();
      await fetchUnreadCount();
      toast.success('Đã đánh dấu tất cả là đã đọc!');
    } catch (err) {
      toast.error('Không thể đánh dấu tất cả là đã đọc.');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, readAt: new Date().toISOString() } : n));
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const extractSOSId = (item: NotificationData): string | null => {
    if (item.payload?.sosRequestId) return String(item.payload.sosRequestId);
    if (item.payload?.sourceRefId) return String(item.payload.sourceRefId);
    if ((item as any).sourceRefId) return String((item as any).sourceRefId);
    if (item.payload?.deepLink) {
      const m = item.payload.deepLink.match(/sos-requests\/([a-f0-9]{24})/i);
      if (m && m[1]) return m[1];
    }
    const bodyMatch = item.body?.match(/([a-f0-9]{24})/i);
    if (bodyMatch && bodyMatch[1]) return bodyMatch[1];
    return null;
  };

  const handleNotificationClick = async (item: NotificationData) => {
    if (item.readAt === null) {
      await handleMarkAsRead(item._id);
    }
    const articleId = getArticleIdFromNotification(item);
    if (articleId) {
      navigate(getArticleRouteForRole(articleId, location.pathname));
      return;
    }

    if (item.type === 'SOS') {
      const sosId = extractSOSId(item);
      if (isBcPage) {
        navigate(sosId ? `/bc/sos-requests/${sosId}` : `/bc/sos-requests`);
        return;
      }
      if (isHospitalPage) {
        navigate(sosId ? `/hospital/sos-requests/${sosId}` : `/hospital/sos-requests`);
        return;
      }
    }

    const isHospital = location.pathname.startsWith('/hospital');
    const isAdmin = location.pathname.startsWith('/admin');
    const basePath = isAdmin ? '/admin' : isHospital ? '/hospital' : '/bc';
    navigate(`${basePath}/notifications/${item._id}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };



  const clearFilters = () => {
    setTypeFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  const hasFilters = typeFilter !== 'All' || statusFilter !== 'All';

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
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-[13px] font-semibold text-[#93000b] border border-[#93000b]/30 bg-[#93000b]/5 hover:bg-[#93000b]/10 rounded-xl transition-colors shrink-0"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Loại:</span>
          {['All', 'SOS', 'Campaign', 'Routine', 'Appointment'].map((type) => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(1); }}
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
          {['All', 'Unread', 'Read'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1a1a2e] text-white shadow-2xs'
                  : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
              }`}
            >
              {st === 'All' ? 'Tất cả' : st === 'Unread' ? 'Chưa đọc' : 'Đã đọc'}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-[12px] font-medium text-[#6c757d] hover:text-[#93000b] transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <SkeletonLoader type="table" rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState message="Không tìm thấy thông báo nào." />
      ) : (
        <>
          <div className="space-y-3.5">
            {notifications.map((item) => {
              const isSOS = item.type === 'SOS';
              const isUnread = item.readAt === null;

              return (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`rounded-2xl p-5 border transition-all cursor-pointer relative group ${
                    isSOS
                      ? isUnread 
                        ? 'bg-red-50/70 border-red-300 border-l-4 border-l-[#93000b] shadow-xs hover:bg-red-100/70'
                        : 'bg-white border-[#f1f3f5] border-l-4 border-l-red-200 hover:bg-slate-50'
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
                            ? isUnread ? 'bg-[#93000b] text-white shadow-sm animate-pulse' : 'bg-red-100 text-[#93000b]'
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
                                ? isUnread ? 'text-[#93000b] font-bold' : 'text-red-800 font-medium'
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
                            isSOS ? isUnread ? 'text-[#93000b] font-medium' : 'text-red-900/70' : 'text-[#5b403d]'
                          } leading-relaxed`}
                        >
                          {item.body}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-[#6c757d] pt-1">
                          <span className="flex items-center gap-1 font-semibold text-[#271816]">
                            <Hospital className="w-3.5 h-3.5 text-[#93000b]" />
                            {item.senderName || 'System'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#6c757d]" />
                            {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action for BC SOS */}
                    {isSOS && isBcPage && (
                      <div className="mt-4 flex gap-2 pl-[56px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const sosId = extractSOSId(item);
                            navigate(sosId ? `/bc/sos-requests/${sosId}` : `/bc/sos-requests`);
                          }}
                          className="px-4 py-2 bg-[#93000b] text-white text-[13px] font-bold rounded-lg shadow-sm hover:bg-red-800 transition-colors cursor-pointer"
                        >
                          Xử lý yêu cầu SOS →
                        </button>
                      </div>
                    )}
                    {isSOS && isHospitalPage && (
                      <div className="mt-4 flex gap-2 pl-[56px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const sosId = extractSOSId(item);
                            navigate(sosId ? `/hospital/sos-requests/${sosId}` : `/hospital/sos-requests`);
                          }}
                          className="px-4 py-2 bg-[#93000b] text-white text-[13px] font-bold rounded-lg shadow-sm hover:bg-red-800 transition-colors cursor-pointer"
                        >
                          Xem yêu cầu SOS →
                        </button>
                      </div>
                    )}

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

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-2 border border-[#f1f3f5] rounded-lg text-[#6c757d] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-[13px] font-medium text-[#271816]">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={loading || page >= totalPages}
              className="p-2 border border-[#f1f3f5] rounded-lg text-[#6c757d] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Xóa thông báo?"
        message={
          notifications.find(n => n._id === deleteTargetId)?.type === 'SOS'
            ? '⚠ Đây là thông báo khẩn cấp (SOS). Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.'
            : 'Bạn có chắc chắn muốn xóa thông báo này khỏi hệ thống không?'
        }
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