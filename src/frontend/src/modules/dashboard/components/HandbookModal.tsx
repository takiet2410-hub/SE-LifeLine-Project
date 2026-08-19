import React, { useEffect } from 'react';
import { X, Shield, Utensils, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TipTopic = 'pre-donation' | 'post-donation' | 'benefits' | null;

interface HandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TipTopic;
}

export const HandbookModal: React.FC<HandbookModalProps> = ({ isOpen, onClose, topic }) => {
  const { t } = useTranslation();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !topic) return null;

  // We map the structure, but get text from i18n
  const contentMap = {
    'pre-donation': {
      title: t('dashboard.handbookContent.preDonation.title'),
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sections: [
        {
          heading: t('dashboard.handbookContent.preDonation.section1Title'),
          points: t('dashboard.handbookContent.preDonation.section1Points', { returnObjects: true }) as string[]
        },
        {
          heading: t('dashboard.handbookContent.preDonation.section2Title'),
          points: t('dashboard.handbookContent.preDonation.section2Points', { returnObjects: true }) as string[]
        }
      ]
    },
    'post-donation': {
      title: t('dashboard.handbookContent.postDonation.title'),
      icon: Utensils,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      sections: [
        {
          heading: t('dashboard.handbookContent.postDonation.section1Title'),
          points: t('dashboard.handbookContent.postDonation.section1Points', { returnObjects: true }) as string[]
        },
        {
          heading: t('dashboard.handbookContent.postDonation.section2Title'),
          points: t('dashboard.handbookContent.postDonation.section2Points', { returnObjects: true }) as string[]
        }
      ]
    },
    'benefits': {
      title: t('dashboard.handbookContent.benefits.title'),
      icon: HeartPulse,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      sections: [
        {
          heading: t('dashboard.handbookContent.benefits.section1Title'),
          points: t('dashboard.handbookContent.benefits.section1Points', { returnObjects: true }) as string[]
        },
        {
          heading: t('dashboard.handbookContent.benefits.section2Title'),
          points: t('dashboard.handbookContent.benefits.section2Points', { returnObjects: true }) as string[]
        }
      ]
    }
  };

  const data = contentMap[topic];
  const Icon = data.icon;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f3f5] shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${data.bgColor} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${data.color}`} />
            </div>
            <h2 className="text-[20px] font-bold text-[#271816]">
              {data.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors ml-4 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-[#fff8f7]">
          {data.sections.map((section, idx) => (
            <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-[#f1f3f5]">
              <h3 className="text-[17px] font-bold text-[#93000b] mb-4 flex items-center gap-2">
                {section.heading}
              </h3>
              <ul className="space-y-3">
                {section.points.map((point, pointIdx) => (
                  <li key={pointIdx} className="flex items-start gap-3 text-[#271816] text-[15px] leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
