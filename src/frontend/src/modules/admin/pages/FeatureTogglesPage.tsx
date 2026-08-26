import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { FeatureToggleItem } from '../types/admin.types';
import { ToggleLeft, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const FeatureTogglesPage: React.FC = () => {
  const [toggles, setToggles] = useState<FeatureToggleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ item: FeatureToggleItem; targetState: boolean } | null>(null);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getToggles();
      setToggles(data.toggles);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải trạng thái các tính năng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchToggles(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleClick = (item: FeatureToggleItem) => {
    if (updatingKey) return;
    const targetState = !item.isEnabled;
    // If disabling a feature with active affected services/dependencies, show warning modal
    if (!targetState && item.affectedServices.length > 0) {
      setPendingToggle({ item, targetState });
    } else {
      executeToggleUpdate(item.key, targetState);
    }
  };

  const executeToggleUpdate = async (key: string, isEnabled: boolean) => {
    try {
      setUpdatingKey(key);
      await adminApi.updateToggle(key, isEnabled);
      window.dispatchEvent(new CustomEvent('feature-flags-updated', { detail: { key, isEnabled } }));
      toast.success('Đã cập nhật trạng thái tính năng.');
      setPendingToggle(null);
      await fetchToggles();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái tính năng.'));
    } finally {
      setUpdatingKey(null);
    }
  };

  const translateToggleName = (key: string, defaultName: string) => {
    switch (key) {
      case 'ai_chatbot':
        return 'Trợ Lý Trí Tuệ Nhân Tạo (AI Chatbot)';
      case 'sos_emergency_alerts':
        return 'Hệ Thống Phát Sóng Cấp Cứu SOS Khẩn Cấp';
      case 'gamification_badges':
        return 'Hệ Thống Thi Đua & Ghi Nhận Thành Tích';
      case 'news_content_portal':
        return 'Cổng Thông Tin & Kiến Thức Sức Khỏe';
      default:
        return defaultName;
    }
  };

  const translateToggleDescription = (key: string, defaultDesc: string) => {
    switch (key) {
      case 'ai_chatbot':
        return 'Trợ lý y tế hội thoại tích hợp công nghệ RAG, hỗ trợ giải đáp thắc mắc và tư vấn đặt lịch hẹn hiến máu tự động.';
      case 'sos_emergency_alerts':
        return 'Điều phối yêu cầu truyền máu khẩn cấp từ bệnh viện và phát thông báo tức thời đến người hiến máu phù hợp theo bán kính.';
      case 'gamification_badges':
        return 'Quản lý cấp bậc người hiến máu, huy hiệu danh dự và cấp chứng nhận điện tử tri ân sau mỗi lần hiến máu thành công.';
      case 'news_content_portal':
        return 'Biên tập và xuất bản các bài viết tin tức, cẩm nang y khoa, hướng dẫn sức khỏe và thông điệp hiến máu nhân đạo.';
      default:
        return defaultDesc;
    }
  };

  const translateAffectedService = (svc: string) => {
    switch (svc) {
      // AI Chatbot services
      case 'Automated Health Screening Triage':
        return 'Phân luồng sàng lọc sức khỏe tự động';
      case 'Smart Donor FAQ Auto-responder':
        return 'Hệ thống tự động phản hồi câu hỏi thường gặp';
      case 'Voice & Text Chatbot Widget':
        return 'Tiện ích hội thoại văn bản & giọng nói';
      // SOS services
      case 'Hospital Emergency SOS Dispatch':
        return 'Điều phối yêu cầu cấp cứu bệnh viện';
      case 'Radius-based Donor Push Alerts':
        return 'Thông báo khẩn cấp theo vị trí người hiến';
      case 'Emergency Blood Matching Engine':
        return 'Công cụ đối soát & ghép nhóm máu khẩn cấp';
      // Gamification services
      case 'Donor Achievement Badges':
        return 'Huy hiệu thành tích người hiến máu';
      case 'Level Progress Bar':
        return 'Thanh tiến trình nâng cấp bậc danh dự';
      case 'Digital Donor Milestone Cards':
        return 'Thẻ ghi nhận dấu mốc hiến máu điện tử';
      // News services
      case 'Public News Feed Portal':
        return 'Cổng tin tức cộng đồng công khai';
      case 'Scheduled Article Publisher Job':
        return 'Tiến trình tự động xuất bản bài viết theo lịch';
      default:
        return svc;
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Đang tải trạng thái tính năng...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toggles.map((item) => (
            <div
              key={item.key}
              className={`p-4 sm:p-6 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                item.isEnabled
                  ? 'bg-white border-[#f1f3f5] shadow-xs'
                  : 'bg-slate-50/80 border-[#f1f3f5] opacity-85'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <ToggleLeft className={`w-6 h-6 ${item.isEnabled ? 'text-[#93000b]' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-[#271816] text-base">{translateToggleName(item.key, item.name)}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleClick(item)}
                    disabled={updatingKey !== null}
                    aria-label={`${item.isEnabled ? 'Tắt' : 'Bật'} ${translateToggleName(item.key, item.name)}`}
                    className={`w-14 h-7 rounded-full transition relative p-0.5 cursor-pointer ${
                      item.isEnabled ? 'bg-[#93000b]' : 'bg-slate-300'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`w-6 h-6 bg-white rounded-full block shadow-md transition transform ${
                        item.isEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#5b403d] font-medium leading-relaxed mb-4">
                  {translateToggleDescription(item.key, item.description)}
                </p>

                {item.affectedServices.length > 0 && (
                  <div className="p-3.5 bg-[#fff8f7] rounded-xl border border-[#f1f3f5]">
                    <span className="text-[10px] font-bold text-[#93000b] uppercase tracking-wider block mb-1.5">
                      Dịch vụ chịu ảnh hưởng
                    </span>
                    <ul className="space-y-1.5">
                      {item.affectedServices.map((svc) => (
                        <li key={svc} className="text-xs text-[#271816] font-semibold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#93000b] rounded-full shrink-0" />
                          <span>{translateAffectedService(svc)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f3f5] flex justify-between text-[11px] font-semibold text-[#6c757d]">
                <span>Cập nhật bởi: <strong className="text-[#271816]">{item.updatedBy === 'System' ? 'Hệ thống' : item.updatedBy || 'Hệ thống'}</strong></span>
                <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Modal for Disabling Feature with Affected Services (AF-02) */}
      {pendingToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Cảnh báo tác động</h3>
              </div>
              <button
                onClick={() => setPendingToggle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Việc vô hiệu hóa <strong>{translateToggleName(pendingToggle.item.key, pendingToggle.item.name)}</strong> sẽ tác động trực tiếp tới các dịch vụ sau:
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block uppercase">
                Dịch vụ bị ảnh hưởng:
              </span>
              {pendingToggle.item.affectedServices.map((s) => (
                <div key={s} className="text-xs text-amber-900 dark:text-amber-300 font-medium flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{translateAffectedService(s)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPendingToggle(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => executeToggleUpdate(pendingToggle.item.key, false)}
                disabled={updatingKey !== null}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md cursor-pointer"
              >
                Tiếp tục & Tắt tính năng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
