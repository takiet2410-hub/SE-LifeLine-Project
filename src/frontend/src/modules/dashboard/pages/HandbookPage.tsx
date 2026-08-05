import React from 'react';
import { useTranslation } from 'react-i18next';
import FeaturedArticle from '../../landing-page/components/health-tips/FeaturedArticle';
import TipCategoryGrid from '../../landing-page/components/health-tips/TipCategoryGrid';
import FAQAccordion from '../../landing-page/components/health-tips/FAQAccordion';

export const HandbookPage: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="bg-[#fff8f7] min-h-screen pb-12">
      {/* Page Header matching Dashboard Style */}
      <div className="bg-white border-b border-[#f1f3f5] px-6 md:px-10 py-8 mb-8 shadow-sm">
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#271816] mb-2">
          {t('healthTips.pageTitle', 'Cẩm nang & Sức khoẻ')}
        </h1>
        <p className="text-[15px] text-[#6c757d] max-w-3xl">
          {t('healthTips.pageDesc', 'Những lưu ý và kiến thức chuyên môn giúp quá trình hiến máu của bạn diễn ra an toàn và khỏe mạnh nhất.')}
        </p>
      </div>

      {/* Main Content Area - Reusing Landing Page Components */}
      <div className="px-6 md:px-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] mb-8">
          <FeaturedArticle />
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] mb-8">
          <TipCategoryGrid />
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5]">
          <FAQAccordion />
        </div>
      </div>
    </div>
  );
};
