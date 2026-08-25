import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { ConfigCategoryGroup, ConfigItem } from '../types/admin.types';
import { Sliders, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const SystemConfigPage: React.FC = () => {
  const [categories, setCategories] = useState<ConfigCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getConfigs();
      setCategories(data.categories);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải cấu hình hệ thống.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchConfigs(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleConfigChange = (catIdx: number, itemIdx: number, value: number | boolean) => {
    setCategories((current) => current.map((category, currentCatIdx) =>
      currentCatIdx !== catIdx
        ? category
        : {
            ...category,
            items: category.items.map((item, currentItemIdx) =>
              currentItemIdx === itemIdx ? { ...item, value } : item
            ),
          }
    ));
  };

  const handleSaveConfig = async (item: ConfigItem) => {
    try {
      setSavingKey(item.key);
      await adminApi.updateConfig(item.key, item.value);
      toast.success(`Đã lưu cấu hình: ${item.label}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Không thể cập nhật ${item.label}.`));
      await fetchConfigs();
    } finally {
      setSavingKey(null);
    }
  };

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'Eligibility Rules': return 'Quy Tắc Đủ Điều Kiện Hiến Máu';
      case 'Campaign Settings': return 'Cấu Hình Chiến Dịch';
      case 'Notification Settings': return 'Cấu Hình Thông Báo';
      case 'General': return 'Cài Đặt Chung';
      default: return cat;
    }
  };

  const translateLabel = (key: string, defaultLabel: string) => {
    switch (key) {
      case 'donationIntervalDays':
      case 'min_donation_interval_days':
        return 'Khoảng cách tối thiểu giữa 2 lần hiến máu';
      case 'minDonorAge':
      case 'min_donor_age':
        return 'Độ tuổi tối thiểu của người hiến máu';
      case 'maxDonorAge':
      case 'max_donor_age':
        return 'Độ tuổi tối đa của người hiến máu';
      case 'maxCampaignCapacity':
      case 'default_campaign_capacity':
        return 'Số lượng tiếp nhận mặc định mỗi đợt';
      case 'sosSearchRadiusKm':
      case 'sos_alert_initial_radius_km':
        return 'Bán kính tìm kiếm SOS ban đầu';
      case 'sosMaxRadiusKm':
      case 'sos_alert_max_radius_km':
        return 'Bán kính tìm kiếm SOS mở rộng tối đa';
      case 'appointmentReminderHours':
      case 'appointment_reminder_hours':
        return 'Thời điểm gửi thông báo nhắc lịch hẹn';
      case 'autoPublishArticles':
      case 'auto_publish_scheduled_articles':
        return 'Tự động xuất bản bài viết theo lịch hẹn';
      default:
        // Fallback matching by English label if key differs
        if (defaultLabel.includes('Donation Interval')) return 'Khoảng cách tối thiểu giữa 2 lần hiến máu';
        if (defaultLabel.includes('Minimum Donor Age')) return 'Độ tuổi tối thiểu của người hiến máu';
        if (defaultLabel.includes('Maximum Donor Age')) return 'Độ tuổi tối đa của người hiến máu';
        if (defaultLabel.includes('Campaign Capacity')) return 'Số lượng tiếp nhận mặc định mỗi đợt';
        if (defaultLabel.includes('Initial Search Radius')) return 'Bán kính tìm kiếm SOS ban đầu';
        if (defaultLabel.includes('Maximum Search Radius')) return 'Bán kính tìm kiếm SOS mở rộng tối đa';
        if (defaultLabel.includes('Reminder Trigger')) return 'Thời điểm gửi thông báo nhắc lịch hẹn';
        if (defaultLabel.includes('Auto-publish')) return 'Tự động xuất bản bài viết theo lịch hẹn';
        return defaultLabel;
    }
  };

  const translateUnit = (unit?: string) => {
    if (!unit) return '';
    switch (unit.toUpperCase()) {
      case 'DAYS': return 'NGÀY';
      case 'YEARS': return 'TUỔI';
      case 'DONORS': return 'NGƯỜI';
      case 'KM': return 'KM';
      case 'HOURS': return 'GIỜ';
      default: return unit;
    }
  };

  const translateDescription = (key: string, defaultDesc?: string) => {
    switch (key) {
      case 'donationIntervalDays':
      case 'min_donation_interval_days':
        return 'Thời gian chờ bắt buộc theo tiêu chuẩn y tế giữa hai lần hiến máu toàn phần liên tiếp.';
      case 'minDonorAge':
      case 'min_donor_age':
        return 'Độ tuổi hợp pháp tối thiểu để công dân đủ điều kiện đăng ký tham gia hiến máu tình nguyện.';
      case 'maxDonorAge':
      case 'max_donor_age':
        return 'Giới hạn độ tuổi tối đa cho phép đối với người tham gia hiến máu tình nguyện.';
      case 'maxCampaignCapacity':
      case 'default_campaign_capacity':
        return 'Số lượng chỗ đăng ký tối đa được thiết lập mặc định cho mỗi sự kiện hoặc chiến dịch hiến máu.';
      case 'sosSearchRadiusKm':
      case 'sos_alert_initial_radius_km':
        return 'Phạm vi địa lý ban đầu để hệ thống quét và phát thông báo khẩn cấp tới người hiến máu phù hợp.';
      case 'sosMaxRadiusKm':
      case 'sos_alert_max_radius_km':
        return 'Phạm vi địa lý tối đa được phép mở rộng phát sóng trong trường hợp khẩn cấp.';
      case 'appointmentReminderHours':
      case 'appointment_reminder_hours':
        return 'Khoảng thời gian hệ thống tự động phát thông báo nhắc nhở trước giờ hẹn hiến máu đã đăng ký.';
      case 'autoPublishArticles':
      case 'auto_publish_scheduled_articles':
        return 'Tự động chuyển bài viết sang trạng thái công khai ngay khi thời điểm lên lịch được thỏa mãn.';
      default:
        if (defaultDesc?.includes('waiting period')) return 'Thời gian chờ bắt buộc theo tiêu chuẩn y tế giữa hai lần hiến máu toàn phần liên tiếp.';
        if (defaultDesc?.includes('legal age required')) return 'Độ tuổi hợp pháp tối thiểu để công dân đủ điều kiện đăng ký tham gia hiến máu tình nguyện.';
        if (defaultDesc?.includes('Upper age limit')) return 'Giới hạn độ tuổi tối đa cho phép đối với người tham gia hiến máu tình nguyện.';
        if (defaultDesc?.includes('Maximum donor slots')) return 'Số lượng chỗ đăng ký tối đa được thiết lập mặc định cho mỗi sự kiện hoặc chiến dịch hiến máu.';
        if (defaultDesc?.includes('Initial geographic radius')) return 'Phạm vi địa lý ban đầu để hệ thống quét và phát thông báo khẩn cấp tới người hiến máu phù hợp.';
        if (defaultDesc?.includes('expanded radius')) return 'Phạm vi địa lý tối đa được phép mở rộng phát sóng trong trường hợp khẩn cấp.';
        if (defaultDesc?.includes('prior to scheduled')) return 'Khoảng thời gian hệ thống tự động phát thông báo nhắc nhở trước giờ hẹn hiến máu đã đăng ký.';
        if (defaultDesc?.includes('scheduled timestamp is reached')) return 'Tự động chuyển bài viết sang trạng thái công khai ngay khi thời điểm lên lịch được thỏa mãn.';
        return defaultDesc;
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Đang tải cấu hình hệ thống...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((group, catIdx) => (
            <div
              key={group.category}
              className="bg-white p-4 sm:p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-[#f1f3f5] pb-3">
                <Sliders className="w-5 h-5 text-[#93000b]" />
                <h2 className="font-bold text-[#271816] text-base">{translateCategory(group.category)}</h2>
              </div>

              <div className="space-y-4">
                {group.items.map((item, itemIdx) => {
                  const isSaving = savingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="p-4 bg-[#fff8f7] rounded-xl border border-[#f1f3f5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-sm text-[#271816]">
                            {translateLabel(item.key, item.label)}
                          </label>
                          {item.unit && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-red-50 text-[#93000b] border border-red-100 rounded-full">
                              {translateUnit(item.unit)}
                            </span>
                          )}
                        </div>
                        {(item.description || translateDescription(item.key)) && (
                          <p className="text-xs text-[#5b403d] font-medium mt-1 leading-relaxed">
                            {translateDescription(item.key, item.description)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof item.value === 'boolean' ? (
                          <button
                            onClick={() => {
                              handleConfigChange(catIdx, itemIdx, !item.value);
                              handleSaveConfig({ ...item, value: !item.value });
                            }}
                            className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                              item.value ? 'bg-[#93000b]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${
                                item.value ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={typeof item.value === 'number' ? item.value : ''}
                              onChange={(e) => handleConfigChange(catIdx, itemIdx, Number(e.target.value))}
                              onBlur={() => handleSaveConfig(item)}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#271816] text-center focus:ring-2 focus:ring-[#93000b] outline-hidden"
                            />
                          </div>
                        )}

                        {isSaving ? (
                          <span className="text-xs text-slate-400 font-mono">Đang lưu...</span>
                        ) : (
                          <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
