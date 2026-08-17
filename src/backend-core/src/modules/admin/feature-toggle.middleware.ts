import { NextFunction, Request, Response } from 'express';
import { getFeatureState } from './services/admin-toggle.service';

const FEATURE_NAMES: Record<string, string> = {
  ai_chatbot: 'Trợ lý AI',
  sos_emergency_alerts: 'Hệ thống SOS khẩn cấp',
  gamification_badges: 'Thành tích và huy hiệu',
  news_content_portal: 'Tin tức và nội dung giáo dục',
};

type FeaturePredicate = (req: Request) => boolean;

export const requireFeatureEnabled = (key: string, when: FeaturePredicate = () => true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!when(req)) return next();

    try {
      const enabled = await getFeatureState(key);
      if (!enabled) {
        return res.status(503).json({
          code: 'FEATURE_DISABLED',
          feature: key,
          message: `${FEATURE_NAMES[key] || key} hiện đang được quản trị viên tạm tắt.`,
        });
      }
      return next();
    } catch {
      return res.status(503).json({
        code: 'FEATURE_CHECK_UNAVAILABLE',
        feature: key,
        message: 'Không thể kiểm tra trạng thái tính năng lúc này. Vui lòng thử lại sau.',
      });
    }
  };
};
