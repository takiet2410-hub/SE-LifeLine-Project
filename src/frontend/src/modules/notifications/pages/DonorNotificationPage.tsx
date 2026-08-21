import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Search, AlertTriangle, Calendar, Megaphone } from 'lucide-react';
import { apiService } from '../../../services/apiClient';
import type { NotificationData } from '../../../services/mockData';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { NotificationDetailModal } from '../components/NotificationDetailModal';
import { format } from 'date-fns';

export const DonorNotificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Alerts' | 'Updates'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getNotifications({});
      const data = result.data;
      // Sort: SOS first, then by date
      const sorted = data.sort((a, b) => {
        if (a.type === 'SOS' && b.type !== 'SOS') return -1;
        if (a.type !== 'SOS' && b.type === 'SOS') return 1;
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });
      setNotifications(sorted);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [fetchNotifications]);

  // Auto-open modal if ?id= query param is provided
  useEffect(() => {
    const notifId = searchParams.get('id');
    if (notifId && notifications.length > 0) {
      const target = notifications.find(n => n._id === notifId);
      if (target) {
        setSelectedNotification(target);
        if (!target.readAt) {
          void apiService.markNotificationAsRead(target._id);
          setNotifications(prev => prev.map(n => n._id === target._id ? { ...n, readAt: new Date().toISOString() } : n));
        }
      }
    }
  }, [searchParams, notifications]);

  const handleNotificationClick = async (notif: NotificationData) => {
    if (!notif.readAt) {
      try {
        await apiService.markNotificationAsRead(notif._id);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, readAt: new Date().toISOString() } : n));
    }

    // Open detail modal directly so user can read the full message content
    setSelectedNotification(notif);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Alerts' && n.type !== 'SOS') return false;
    if (filter === 'Updates' && n.type === 'SOS') return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.body.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type as string) {
      case 'SOS': return <AlertTriangle className="w-5 h-5" />;
      case 'Appointment': return <Calendar className="w-4 h-4" />;
      case 'Campaign': return <Megaphone className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full max-w-7xl mx-auto w-full p-4 gap-6">
      {/* Left Panel: Notification List */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#f1f3f5] shadow-xs overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-[#f1f3f5]">
          <h2 className="text-[20px] font-bold text-[#271816] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#93000b]" />
            Notification Center
          </h2>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#f8f9fa] border border-[#f1f3f5] rounded-xl text-[13px] focus:outline-none focus:border-[#93000b]"
              />
            </div>

          <div className="flex bg-[#f8f9fa] p-1 rounded-xl border border-[#f1f3f5]">
              {['All', 'Alerts', 'Updates'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                    filter === f ? 'bg-white text-[#271816] shadow-sm' : 'text-[#6c757d] hover:text-[#271816]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-[#6c757d]">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-10 text-[#6c757d]">No notifications found.</div>
          ) : (
            filteredNotifications.map((notif) => {
              const isSOS = notif.type === 'SOS';
              const isUnread = !notif.readAt;

              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isUnread
                      ? isSOS
                        ? 'bg-red-50/70 border-red-300 border-l-4 border-l-[#93000b] hover:bg-red-100 shadow-sm'
                        : 'bg-white border-[#f1f3f5] border-l-4 border-l-[#1a1a2e] hover:bg-slate-50 shadow-sm'
                      : isSOS
                        ? 'bg-white border-[#f1f3f5] hover:bg-slate-50 opacity-80 border-l-4 border-l-red-200'
                        : 'bg-white border-[#f1f3f5] hover:bg-slate-50 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${
                      isSOS ? 'bg-[#93000b] text-white animate-pulse' : 'bg-slate-100 text-[#1a1a2e]'
                    }`}>
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4
                            title={notif.title}
                            className={`text-[14px] sm:text-[15px] truncate ${isSOS ? 'text-[#93000b] font-bold' : isUnread ? 'text-[#271816] font-bold' : 'text-[#271816] font-medium'}`}
                          >
                            {notif.title}
                          </h4>
                          {isSOS && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#93000b] text-white uppercase tracking-wider shrink-0">
                              🚨 SOS
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6c757d] whitespace-nowrap shrink-0">
                          {notif.createdAt ? format(new Date(notif.createdAt), 'dd/MM HH:mm') : ''}
                        </span>
                      </div>
                      <p
                        title={notif.body}
                        className={`text-[13px] truncate ${isSOS ? 'text-[#93000b] font-medium' : 'text-[#6c757d]'}`}
                      >
                        {notif.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Preferences */}
      <div className="w-full lg:w-[400px] shrink-0">
        <div className="sticky top-6">
          <NotificationPreferences />
        </div>
      </div>

      {/* Notification Detail Modal for reading full message */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
};
