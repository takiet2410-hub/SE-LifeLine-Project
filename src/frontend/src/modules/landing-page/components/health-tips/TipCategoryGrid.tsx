import React from 'react';
import { HEALTH_TIPS_DATA } from '../../data/healthTipsData';
import TipCard from './TipCard';
import { useTranslation } from 'react-i18next';

const TipCategoryGrid: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('healthTips.categories.sectionTitle', 'Essential Health Guidelines')}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('healthTips.categories.sectionDesc', 'Browse our curated tips to prepare your body before donation and recover optimally afterwards.')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {HEALTH_TIPS_DATA.map((tip) => (
          <TipCard key={tip.id} tip={tip} />
        ))}
      </div>
    </div>
  );
};

export default TipCategoryGrid;
