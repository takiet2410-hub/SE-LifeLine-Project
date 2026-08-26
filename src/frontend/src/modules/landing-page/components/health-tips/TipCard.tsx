import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { TipCardProps } from '../../types/healthTips.types';
import * as LucideIcons from 'lucide-react';

const TipCard: React.FC<{ tip: TipCardProps }> = ({ tip }) => {
  const { t } = useTranslation('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dynamically resolve the icon component
  const IconComponent = (LucideIcons as any)[tip.iconName] || LucideIcons.Heart;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4">
        <IconComponent size={24} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {t(tip.titleKey)}
      </h3>
      <p className="text-gray-600 flex-grow">
        {t(tip.descriptionKey)}
      </p>
      <div className="mt-4 pt-4 border-t border-gray-50">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-red-600 font-medium hover:text-red-700 text-sm flex items-center"
        >
          {t('healthTips.common.readMore', 'Read More')}
          <LucideIcons.ArrowRight size={16} className="ml-1" />
        </button>
      </div>

      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <h3 className="text-2xl font-bold text-gray-900 pr-8">
                {t(tip.titleKey)}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <LucideIcons.X size={24} />
              </button>
            </div>
            
            <div className="p-6 text-gray-700 leading-relaxed text-lg">
              {t(`healthTips.categories.${tip.id}.readMoreContent`)}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white rounded-b-xl z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[#93000b] hover:bg-[#7a0009] text-white !text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
                style={{ color: '#ffffff' }}
              >
                <span className="text-white !text-white" style={{ color: '#ffffff' }}>{t('common.close', 'Close')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TipCard;
