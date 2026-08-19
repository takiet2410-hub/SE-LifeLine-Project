import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';

if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import '@maplibre/maplibre-gl-leaflet';
import { donationLocations } from './mapData';
import { MapPinOff } from 'lucide-react';

const HCMC_CENTER: [number, number] = [10.762861, 106.682472]; // Trụ sở chính LifeLine HQ

interface PublicDonationMapProps {
  selectedLocationId?: string;
  onLocationSelect?: (id: string) => void;
}

export const PublicDonationMap: React.FC<PublicDonationMapProps> = ({ selectedLocationId, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ id: string; marker: L.Marker }[]>([]);
  const [mapError, setMapError] = useState(false);

  // 1. Khởi tạo bản đồ
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: HCMC_CENTER,
        zoom: 14,
        zoomControl: false,
      });

      const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';
      
      if (goongApiKey && typeof (L as any).maplibreGL === 'function') {
        const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongApiKey}`;
        (L as any).maplibreGL({
          style: goongStyleUrl,
          attribution: '&copy; <a href="https://www.goong.io/" target="_blank" rel="noopener noreferrer">Goong Maps</a>',
        }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      }

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
      setMapError(false);

      // 2. Vẽ marker
      donationLocations.forEach((loc) => {
        const isHQ = loc.type === 'HQ';
        const markerColor = isHQ ? '#2563EB' : '#E11D48'; // Blue for HQ, Red for Centers

        const customHtml = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;" class="map-campaign-pin">
            <div style="position:relative; width:${isHQ ? '48px' : '36px'}; height:${isHQ ? '48px' : '36px'};">
              ${isHQ ? `<div style="position:absolute; inset:-5px; background:${markerColor}; border-radius:50%; opacity:0.45; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
              <div style="
                width: 100%;
                height: 100%;
                background: ${markerColor};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 6px 16px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center;">
                  ${isHQ ? `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  ` : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  `}
                </div>
              </div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-campaign-marker',
          html: customHtml,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
        });

        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { 
          icon: customIcon, 
          zIndexOffset: isHQ ? 1000 : 100 
        }).addTo(map);

        const popupHtml = `
          <div style="min-width: 200px; font-family: Inter, sans-serif; padding: 4px;">
            <h4 style="font-size: 15px; font-weight: 700; color: ${isHQ ? '#1e3a8a' : '#93000b'}; margin: 0 0 4px 0; line-height: 1.2;">
              ${loc.name}
            </h4>
            <p style="font-size: 13px; color: #4b5563; margin: 0; line-height: 1.4;">
              ${loc.address}
            </p>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 300, closeButton: false });
        
        marker.on('click', () => {
          map.panTo([loc.coordinates.lat, loc.coordinates.lng]);
          if (onLocationSelect) {
            onLocationSelect(loc.id);
          }
        });

        markersRef.current.push({ id: loc.id, marker });
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // 3. Phản hồi khi selectedLocationId thay đổi từ Sidebar
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocationId) return;

    const loc = donationLocations.find(l => l.id === selectedLocationId);
    if (loc) {
      // Zoom và pan tới vị trí
      mapInstanceRef.current.setView([loc.coordinates.lat, loc.coordinates.lng], 15, { animate: true });
      
      // Mở popup
      const markerObj = markersRef.current.find(m => m.id === selectedLocationId);
      if (markerObj && markerObj.marker) {
        markerObj.marker.openPopup();
      }
    }
  }, [selectedLocationId]);

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#fff8f7] rounded-2xl">
        <div className="w-20 h-20 rounded-full bg-[#ffe9e6] flex items-center justify-center mb-4 text-[#93000b]">
          <MapPinOff className="w-10 h-10" />
        </div>
        <h2 className="text-[20px] font-bold text-[#271816] mb-2">
          Dịch vụ bản đồ không khả dụng
        </h2>
        <p className="text-[14px] text-[#6c757d] max-w-md">
          Không thể tải bản đồ tại thời điểm này. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="w-full h-full z-0 rounded-2xl shadow-md border border-gray-100" />;
};
