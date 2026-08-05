import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const FeaturedArticle: React.FC = () => {
  const { t } = useTranslation('landing');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div id="pre-donation" className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12 scroll-mt-24">
      <div className="md:flex">
        <div className="md:w-1/2 h-64 md:h-auto bg-red-50 relative">
          {/* Placeholder for actual image */}
          <div className="absolute inset-0 flex items-center justify-center text-red-300">
            <svg className="w-24 h-24 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="uppercase tracking-wide text-sm text-red-600 font-semibold mb-2">
            {t('healthTips.featured.badge', 'Featured Article')}
          </div>
          <h2 className="block mt-1 text-2xl leading-tight font-bold text-gray-900 md:text-3xl mb-4">
            {t('healthTips.featured.title', 'Pre-Donation Prep Guide')}
          </h2>
          <p className="mt-2 text-gray-600 mb-6 line-clamp-3">
            {t('healthTips.featured.desc', 'Everything you need to know before your first donation. From getting enough rest to hydrating properly, follow our comprehensive guide to ensure a safe and comfortable experience.')}
          </p>
          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {t('healthTips.featured.readMore', 'Read More')}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-2xl font-bold text-gray-900 pr-8">
                {t('healthTips.featured.title', 'Pre-Donation Prep Guide')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 text-gray-700 leading-relaxed text-lg">
              {t('healthTips.featured.readMoreContent')}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white rounded-b-2xl z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FeaturedArticle;
