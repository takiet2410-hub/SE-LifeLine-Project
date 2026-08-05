import React from 'react';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const CampaignList: React.FC = () => {
  const { t } = useTranslation();
  const campaigns = [
    {
      id: 1,
      title: 'Giọt hồng mùa thu',
      location: 'Công viên 29/3',
      date: '01/09 - 05/09',
      slots: 24,
    },
    {
      id: 2,
      title: 'Chủ nhật đỏ',
      location: 'Đại học Bách Khoa',
      date: '10/09 - 10/09',
      slots: 12,
    },
    {
      id: 3,
      title: 'Hiến máu cứu người',
      location: 'Nhà văn hóa Phường 1',
      date: '15/09 - 17/09',
      slots: 8,
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#271816]">{t('dashboard.campaigns.title')}</h2>
        <Link to="/map" className="text-[#93000b] text-[13px] font-semibold hover:underline">
          {t('dashboard.campaigns.viewAll')}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
        {campaigns.map((camp) => (
          <div key={camp.id} className="border-l-4 border-[#93000b] pl-4 py-1 hover:bg-[#fff8f7] rounded-r-lg transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-[#271816] text-[15px] group-hover:text-[#93000b] transition-colors">
                {camp.title}
              </h3>
              <span className="px-2 py-0.5 bg-[#f1f3f5] text-[#495057] text-[11px] font-bold rounded">
                Còn {camp.slots} slots
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[#6c757d] text-[13px] mb-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{camp.location}</span>
            </div>
            
            <div className="flex justify-between items-center text-[#6c757d] text-[13px]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{camp.date}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#93000b]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
