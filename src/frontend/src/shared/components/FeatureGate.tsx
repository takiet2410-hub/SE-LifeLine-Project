import React from 'react';
import { Power, RotateCw } from 'lucide-react';
import { useFeatureFlags, type FeatureKey } from '../contexts/FeatureFlagsContext';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  ai_chatbot: 'Trợ lý AI',
  sos_emergency_alerts: 'Hệ thống SOS khẩn cấp',
  gamification_badges: 'Thành tích và huy hiệu',
  news_content_portal: 'Tin tức và nội dung giáo dục',
};

export const FeatureGate: React.FC<{ feature: FeatureKey; children: React.ReactNode }> = ({ feature, children }) => {
  const { isEnabled, loading, refresh } = useFeatureFlags();

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">Đang kiểm tra trạng thái tính năng...</div>;
  }
  if (isEnabled(feature)) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <Power className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-[#271816]">Tính năng đang tạm tắt</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b403d]">
          {FEATURE_LABELS[feature]} hiện đã được quản trị viên tạm tắt. Dữ liệu của bạn vẫn được giữ nguyên.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#93000b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#780009]"
        >
          <RotateCw className="h-4 w-4" />
          Kiểm tra lại
        </button>
      </div>
    </div>
  );
};
