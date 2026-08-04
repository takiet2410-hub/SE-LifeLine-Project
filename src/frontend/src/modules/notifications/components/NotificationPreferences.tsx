import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Calendar, Megaphone, Mail, Smartphone, Moon, Sun, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
export interface NotificationPreference {
  sosEnabled: boolean;
  appointmentEnabled: boolean;
  campaignEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}
import { format } from 'date-fns';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const [prefs, setPrefs] = useState<NotificationPreference>({
    sosEnabled: true,
    appointmentEnabled: true,
    campaignEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    timezone: 'Asia/Ho_Chi_Minh',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      const data = await apiService.getNotificationPreferences();
      setPrefs(data);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = async (key: keyof NotificationPreference, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    
    // Auto-save with debounce
    try {
      setSaving(true);
      await apiService.updateNotificationPreferences({ [key]: value });
      setLastSaved(new Date());
      toast.success(`Đã ${value ? 'bật' : 'tắt'} ${getLabel(key)}`);
    } catch (err) {
      console.error('Failed to save preference:', err);
      toast.error('Lưu cài đặt thất bại');
      setPrefs(prefs); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    
    try {
      setSaving(true);
      await apiService.updateNotificationPreferences({ [key]: value });
      setLastSaved(new Date());
      toast.success('Đã cập nhật giờ nghỉ');
    } catch (err) {
      console.error('Failed to save quiet hours:', err);
      toast.error('Lưu giờ nghỉ thất bại');
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (value: string) => {
    const newPrefs = { ...prefs, timezone: value };
    setPrefs(newPrefs);
    
    try {
      setSaving(true);
      await apiService.updateNotificationPreferences({ timezone: value });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save timezone:', err);
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (key: keyof NotificationPreference) => {
    const labels: Record<string, string> = {
      sosEnabled: 'Cảnh báo SOS',
      appointmentEnabled: 'Cập nhật lịch hẹn',
      campaignEnabled: 'Tin tức chiến dịch',
      emailEnabled: 'Email',
      pushEnabled: 'Thông báo đẩy',
      quietHoursStart: 'Bắt đầu giờ nghỉ',
      quietHoursEnd: 'Kết thúc giờ nghỉ',
      timezone: 'Múi giờ',
    };
    return labels[String(key)] || String(key);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f1f3f5] p-6 shadow-xs space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#271816]">Cài đặt Thông báo</h3>
          <p className="text-sm text-[#6c757d] mt-1">Tùy chỉnh loại thông báo bạn muốn nhận</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-[#a3a3a3] hover:text-[#93000b] hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Notification Categories */}
        <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
          <h4 className="text-sm font-semibold text-[#271816] mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#93000b]" />
            Loại thông báo
          </h4>
          <div className="space-y-3">
            {[
              { key: 'sosEnabled' as const, label: 'Cảnh báo SOS khẩn cấp', desc: 'Nhận cảnh báo cấp cứu máu khẩn cấp (SOS) từ bệnh viện', icon: ShieldAlert },
              { key: 'appointmentEnabled' as const, label: 'Cập nhật lịch hẹn', desc: 'Nhắc nhở lịch hiến máu, thay đổi lịch hẹn', icon: Calendar },
              { key: 'campaignEnabled' as const, label: 'Tin tức chiến dịch', desc: 'Thông báo chiến dịch mới, cập nhật tiến độ', icon: Megaphone },
            ].map(({ key, label, desc, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#93000b]/10 text-[#93000b] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#271816]">{label}</p>
                    <p className="text-xs text-[#6c757d]">{desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#93000b]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Channels */}
        <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
          <h4 className="text-sm font-semibold text-[#271816] mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#93000b]" />
            Kênh nhận thông báo
          </h4>
          <div className="space-y-3">
            {[
              { key: 'emailEnabled' as const, label: 'Email', desc: 'Nhận thông báo qua email', icon: Mail },
              { key: 'pushEnabled' as const, label: 'Thông báo đẩy (Push)', desc: 'Nhận thông báo trên ứng dụng/điện thoại', icon: Smartphone },
            ].map(({ key, label, desc, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#93000b]/10 text-[#93000b] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#271816]">{label}</p>
                    <p className="text-xs text-[#6c757d]">{desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#93000b]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
          <h4 className="text-sm font-semibold text-[#271816] mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#93000b]" />
            Giờ không quấy rối
          </h4>
          <p className="text-xs text-[#6c757d] mb-3">Trong khoảng thời gian này, chỉ thông báo SOS khẩn cấp mới được gửi</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6c757d] mb-1">Bắt đầu</label>
              <input
                type="time"
                value={prefs.quietHoursStart || ''}
                onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#f1f3f5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#93000b]/20 focus:border-[#93000b]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6c757d] mb-1">Kết thúc</label>
              <input
                type="time"
                value={prefs.quietHoursEnd || ''}
                onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#f1f3f5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#93000b]/20 focus:border-[#93000b]"
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
          <h4 className="text-sm font-semibold text-[#271816] mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#93000b]" />
            Múi giờ
          </h4>
          <select
            value={prefs.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#f1f3f5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#93000b]/20 focus:border-[#93000b]"
          >
            <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
            <option value="Asia/Bangkok">Thái Lan (GMT+7)</option>
            <option value="Asia/Singapore">Singapore (GMT+8)</option>
            <option value="UTC">UTC (GMT+0)</option>
          </select>
        </div>

        {/* Save Status */}
        <div className="flex items-center justify-between pt-4 border-t border-[#f1f3f5]">
          <div className="flex items-center gap-2 text-xs text-[#6c757d]">
            {lastSaved && (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#28a745]" />
                <span>Đã lưu lúc {format(lastSaved, 'HH:mm:ss')}</span>
              </>
            )}
            {saving && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#93000b]" />
                <span>Đang lưu...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
