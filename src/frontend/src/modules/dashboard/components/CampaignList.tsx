import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';
import { format } from 'date-fns';

export const CampaignList: React.FC = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getCampaigns();
        const allCampaigns = res.data || [];
        const now = new Date();
        
        let upcoming = allCampaigns
          .filter((c: any) => new Date(c.startDateTime) > now)
          .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        
        if (upcoming.length === 0) {
          upcoming = allCampaigns.slice(0, 3);
        } else {
          upcoming = upcoming.slice(0, 3);
        }
        
        setCampaigns(upcoming);
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#271816]">{t('dashboard.campaigns.title')}</h2>
        <Link to="/map" className="text-[#93000b] text-[13px] font-semibold hover:underline">
          {t('dashboard.campaigns.viewAll')}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#93000b]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-4 text-[#6c757d] text-[13px]">
            Không có chiến dịch nào sắp tới
          </div>
        ) : (
          campaigns.map((camp) => (
            <div key={camp._id} className="border-l-4 border-[#93000b] pl-4 py-1 hover:bg-[#fff8f7] rounded-r-lg transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-[#271816] text-[15px] group-hover:text-[#93000b] transition-colors">
                  {camp.name}
                </h3>
                <span className="px-2 py-0.5 bg-[#f1f3f5] text-[#495057] text-[11px] font-bold rounded">
                  Còn {Math.max(0, (camp.capacity || 0) - (camp.registeredCount || 0))} chỗ
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[#6c757d] text-[13px] mb-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{camp.venue}</span>
              </div>
              
              <div className="flex justify-between items-center text-[#6c757d] text-[13px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatDateRange(camp.startDateTime, camp.endDateTime)}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#93000b]" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
