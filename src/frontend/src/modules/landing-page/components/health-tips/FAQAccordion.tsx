import React from 'react';
import { FAQ_DATA } from '../../data/healthTipsData';
import FAQItem from './FAQItem';
import { useTranslation } from 'react-i18next';

const FAQAccordion: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="max-w-3xl mx-auto mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('healthTips.faq.sectionTitle', 'Frequently Asked Questions')}
        </h2>
        <p className="text-gray-600">
          {t('healthTips.faq.sectionDesc', 'Common questions about health preparation and recovery.')}
        </p>
      </div>
      
      <div className="flex flex-col gap-2">
        {FAQ_DATA.map((item) => (
          <FAQItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default FAQAccordion;
