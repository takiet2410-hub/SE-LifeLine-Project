import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FAQItemProps } from '../../types/healthTips.types';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem: React.FC<{ item: FAQItemProps }> = ({ item }) => {
  const { t } = useTranslation('landing');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden mb-4 transition-all duration-200">
      <button
        className="w-full text-left px-6 py-4 focus:outline-none flex justify-between items-center bg-white hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-gray-900 pr-8">{t(item.questionKey)}</span>
        {isExpanded ? (
          <ChevronUp className="text-gray-500 flex-shrink-0" size={20} />
        ) : (
          <ChevronDown className="text-gray-500 flex-shrink-0" size={20} />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-gray-600 whitespace-pre-wrap">{t(item.answerKey)}</p>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
