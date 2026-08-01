import React, { useState } from 'react';
import { PublicDonationMap } from '../components/find-locations/PublicDonationMap';
import { Layout } from '../components/Layout';
import { donationLocations } from '../components/find-locations/mapData';
import { MapPin, Clock, Building2, HeartHandshake, Info } from 'lucide-react';

export const FindLocationsPage: React.FC = () => {
  const [selectedLocId, setSelectedLocId] = useState<string | undefined>();

  return (
    <Layout>
      <div className="w-full bg-[#f8f9fa] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto w-full">
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#93000b] mb-2">Tìm điểm hiến máu</h1>
            <p className="text-[#6c757d]">Tra cứu các địa điểm hiến máu chính thức tại TP. Hồ Chí Minh</p>
          </div>

          {/* Grid Layout (items-start ensures columns don't stretch to match each other's height) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cột trái: Bản đồ (60%) - Chiều cao cố định */}
            <div className="lg:col-span-7 h-[450px] lg:h-[550px] w-full rounded-2xl overflow-hidden order-1 shadow-sm border border-gray-200">
              <PublicDonationMap 
                selectedLocationId={selectedLocId} 
                onLocationSelect={(id) => setSelectedLocId(id)} 
              />
            </div>

            {/* Cột phải: Sidebar (40%) - Nằm trong box có thanh cuộn độc lập */}
            <div className="lg:col-span-5 flex flex-col order-2 gap-4">
              
              {/* Articles / Tips Box */}
              <div className="bg-[#fff8f7] border border-[#f9dcd8] rounded-xl p-4 shadow-sm flex items-start gap-3">
                <div className="mt-0.5 text-[#93000b]">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#93000b] mb-1">Gợi ý khác</h3>
                  <p className="text-[13px] text-[#5b403d] leading-relaxed">
                    Ngoài các điểm trên bản đồ, bạn có thể chủ động đến các Trạm y tế Phường, Xã hoặc Hội Chữ thập đỏ gần nhất để đăng ký hiến máu.
                  </p>
                </div>
              </div>

              {/* Danh sách địa điểm (Scrollable Box) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-[650px]">
                <div className="p-4 border-b border-gray-100 shrink-0">
                  <h3 className="text-[16px] font-bold text-[#271816] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#93000b]" />
                    Danh sách các điểm tiếp nhận
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {donationLocations.map((loc) => {
                    const isSelected = selectedLocId === loc.id;
                    const isHQ = loc.type === 'HQ';
                    
                    return (
                      <div 
                        key={loc.id}
                        onClick={() => setSelectedLocId(loc.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#93000b] bg-[#fff8f7] ring-1 ring-[#93000b] shadow-md' 
                            : 'border-gray-200 bg-white hover:border-[#93000b]/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`text-[15px] font-bold pr-2 ${isHQ ? 'text-[#1e3a8a]' : 'text-[#271816]'}`}>
                            {loc.name}
                          </h4>
                          {isHQ && (
                            <span className="shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                              Trụ sở
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-start gap-2 mb-2 text-[#6c757d]">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <p className="text-[13px] leading-relaxed">{loc.address}</p>
                        </div>
                        
                        {loc.workingHours && (
                          <div className="flex items-start gap-2 mb-3 text-[#6c757d]">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            <p className="text-[13px]">{loc.workingHours}</p>
                          </div>
                        )}
                        
                        {loc.badges && loc.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-gray-100/60">
                            {loc.badges.map((badge, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#fff0ed] text-[#d91604] border border-[#ffdfd9] text-[11px] font-semibold rounded-md"
                              >
                                <HeartHandshake className="w-3 h-3" />
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
