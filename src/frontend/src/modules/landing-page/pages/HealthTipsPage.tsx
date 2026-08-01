import React from 'react';
import { useTranslation } from 'react-i18next';
import FeaturedArticle from '../components/health-tips/FeaturedArticle';
import TipCategoryGrid from '../components/health-tips/TipCategoryGrid';
import FAQAccordion from '../components/health-tips/FAQAccordion';
import { Layout } from '../components/Layout';

export const HealthTipsPage: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-20">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 py-12 mb-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('healthTips.pageTitle', 'Health & Preparation Tips')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('healthTips.pageDesc', 'Expert advice to ensure your blood donation experience is safe, comfortable, and rewarding.')}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedArticle />
          <TipCategoryGrid />
          <FAQAccordion />
        </div>
      </div>
    </Layout>
  );
};
