import React, { useEffect, useRef, useState } from 'react';
import { X, MapPinOff, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';

if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import '@maplibre/maplibre-gl-leaflet';

interface HospitalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  hospitalAddress: string;
  coordinates: [number, number]; // [lng, lat]
}

export const HospitalMapModal: React.FC<HospitalMapModalProps> = ({
  isOpen,
  onClose,
  hospitalName,
  hospitalAddress,
  coordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Wait a tick for the modal to be visible before initializing map
    const timeout = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        return;
      }

      try {
        const [lng, lat] = coordinates;
        const center: [number, number] = [lat, lng];

        const map = L.map(mapContainerRef.current, {
          center,
          zoom: 16,
          zoomControl: false,
        });

        const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';

        if (goongApiKey && typeof (L as any).maplibreGL === 'function') {
          const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongApiKey}`;
          (L as any).maplibreGL({
            style: goongStyleUrl,
            attribution: '&copy; <a href="https://www.goong.io/" target="_blank">Goong Maps</a>',
          }).addTo(map);
        } else {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
          }).addTo(map);
        }

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        setMapError(false);

        // Add Marker
        const customIcon = L.divIcon({
          className: 'custom-hospital-marker',
          html: `
            <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div style="position:absolute; inset:0; background:#E11D48; border-radius:50%; opacity:0.4; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="
                width: 30px;
                height: 30px;
                background: #E11D48;
                border: 2px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker(center, { icon: customIcon }).addTo(map);
        marker.bindPopup(`<b>${hospitalName}</b><br/>${hospitalAddress}`).openPopup();

      } catch (err) {
        console.error('Error initializing hospital map:', err);
        setMapError(true);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen, coordinates, hospitalName, hospitalAddress]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-4xl max-h-[94dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{hospitalName}</h2>
            <p className="text-sm text-gray-500 mt-1">{hospitalAddress}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 p-2 sm:p-4 bg-gray-50 relative min-h-[50dvh] sm:min-h-[500px]">
          {mapError ? (
            <div className="w-full h-full min-h-[50dvh] sm:min-h-[500px] flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-[#fff8f7] rounded-xl border border-red-100">
              <div className="w-16 h-16 rounded-full bg-[#ffe9e6] flex items-center justify-center mb-4 text-[#93000b]">
                <MapPinOff className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#271816] mb-2">Map Unavailable</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Could not load the map. Please try again later.
              </p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full min-h-[500px] rounded-xl shadow-inner border border-gray-200 z-0 overflow-hidden relative" />
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-medium hover:bg-brand-primary-hover rounded-lg shadow-sm transition-colors"
          >
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
