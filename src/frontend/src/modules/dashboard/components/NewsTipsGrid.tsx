import React, { useState } from 'react';
import { Shield, Utensils, HeartPulse, ChevronRight } from 'lucide-react';
import { HandbookModal, type TipTopic } from './HandbookModal';
import { useTranslation } from 'react-i18next';

export const NewsTipsGrid: React.FC = () => {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState<TipTopic>(null);

  const tips: Array<{
    title: string;
    icon: any;
    color: string;
    bgColor: string;
    topic: TipTopic;
  }> = [
    {
      title: t('dashboard.handbook.preDonation'),
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      topic: 'pre-donation',
    },
    {
      title: t('dashboard.handbook.postDonation'),
      icon: Utensils,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      topic: 'post-donation',
    },
    {
      title: t('dashboard.handbook.benefits'),
      icon: HeartPulse,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      topic: 'benefits',
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#271816]">{t('dashboard.handbook.title')}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <button 
              key={idx}
              type="button"
              onClick={() => setActiveTopic(tip.topic)}
              className="bg-white rounded-xl p-4 border border-[#f1f3f5] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group text-left w-full"
            >
              <div className={`w-12 h-12 rounded-full ${tip.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${tip.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#271816] text-[14px] leading-snug group-hover:text-[#93000b] transition-colors">
                  {tip.title}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-[#dee2e6] group-hover:text-[#93000b] transition-colors shrink-0" />
            </button>
          );
        })}
      </div>

      <HandbookModal 
        isOpen={activeTopic !== null} 
        topic={activeTopic}
        onClose={() => setActiveTopic(null)} 
      />
    </div>
  );
};

