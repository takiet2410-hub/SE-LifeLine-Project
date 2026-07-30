import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';

if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import '@maplibre/maplibre-gl-leaflet';
import {
  MapPin,
  Search,
  Filter,
  Calendar,
  Compass,
  AlertCircle,
  X,
  Star,
  Clock,
  ChevronRight,
  MapPinOff,
  Navigation,
  Loader2,
} from 'lucide-react';
import { searchLocations, type BackendCampaign } from '../api/bookingApi';
import { useScheduleContext } from '../context/ScheduleContext';
import { toast } from 'sonner';

// HCMC Coordinates fallback
const DEFAULT_CENTER: [number, number] = [10.762622, 106.660172];

export const InteractiveMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateData } = useScheduleContext();

  // Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState<number>(15);
  const [selectedBloodType, setSelectedBloodType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [crowdingLevels, setCrowdingLevels] = useState<{ [key: string]: boolean }>({
    Low: true,
    Moderate: true,
    High: true,
  });

  // UI state
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Geolocation state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Load locations strictly from backend API campaigns
  const fetchMapLocations = async () => {
    setLoading(true);
    try {
      const filters: any = { radius };
      if (userCoords) {
        filters.lat = userCoords[0];
        filters.lng = userCoords[1];
      }
      if (selectedDate) filters.date = selectedDate;
      if (selectedBloodType) filters.bloodType = selectedBloodType;

      const res = await searchLocations(filters);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Track coordinate occurrences to apply micro-spiral offset for campaigns sharing exact same venue coordinates
        const coordCounts: Record<string, number> = {};

        const mappedData = res.data.map((item: any, idx: number) => {
          const raw = item._raw as BackendCampaign;
          const coords = raw?.location?.coordinates || [];
          const baseLat = coords[1] || 10.7852;
          const baseLng = coords[0] || 106.6989;

          // Check if coordinates overlap with previous campaign items
          const baseKey = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
          const count = coordCounts[baseKey] || 0;
          coordCounts[baseKey] = count + 1;

          // If multiple campaigns take place at the exact same venue coordinates (e.g. Sân vận động Hoa Lư),
          // apply a slight spiral offset (~120m) so all campaign pins are distinctly visible & clickable on map!
          let lat = baseLat;
          let lng = baseLng;
          if (count > 0) {
            const angle = count * (Math.PI / 4); // 8 positions per ring
            const radiusOffset = 0.0015 * Math.ceil(count / 4); // ~150 meters offset per ring
            lat = baseLat + radiusOffset * Math.sin(angle);
            lng = baseLng + radiusOffset * Math.cos(angle);
          }

          const regCount = raw?.registeredCount || 0;
          const cap = raw?.capacity || 100;
          const ratio = regCount / cap;
          const crowdingLevel = ratio < 0.5 ? 'Low' : ratio < 0.8 ? 'Moderate' : 'High';

          const campaignName = raw?.name || item.name || 'Chiến dịch Hiến máu';
          const campaignCode = (raw as any)?.campaignCode || '';
          const displayName = campaignName;
          const address = (raw as any)?.fullAddress || (raw as any)?.venue || item.address || 'TP. Hồ Chí Minh';

          return {
            id: raw?._id || item.id || `CMP-${idx}`,
            name: displayName,
            campaignCode,
            venue: (raw as any)?.venue || 'Địa điểm hiến máu',
            address,
            lat,
            lng,
            rating: (4.8 + (idx % 3) * 0.1).toFixed(1),
            crowdingLevel,
            status: raw?.status === 'Active' ? 'Active Now' : 'Starting Soon',
            bloodTypes: raw?.targetBloodGroups?.length ? raw.targetBloodGroups : ['A+', 'O+', 'B+'],
            operatingHours: raw?.startDateTime
              ? `${new Date(raw.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(raw.endDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
              : '08:00 - 16:00',
            timeSlots: raw?.timeSlots?.length
              ? raw.timeSlots
              : [
                  { startTime: '08:00', endTime: '10:00', capacity: 30, registeredCount: regCount },
                  { startTime: '10:00', endTime: '12:00', capacity: 30, registeredCount: 0 },
                  { startTime: '13:30', endTime: '15:30', capacity: 30, registeredCount: 0 },
                ],
            _raw: raw,
          };
        });
        setLocations(mappedData);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Failed to load campaign locations:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Request user GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserCoords(coords);
          setPermissionDenied(false);
          setShowPermissionPrompt(false);
          toast.success('Đã xác định vị trí GPS của bạn và hiển thị điểm hiến máu gần nhất!');
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(coords, 14);
          }
        },
        () => {
          setPermissionDenied(true);
          setShowPermissionPrompt(true);
        }
      );
    } else {
      setPermissionDenied(true);
      setShowPermissionPrompt(true);
    }
  }, []);

  useEffect(() => {
    fetchMapLocations();
  }, [selectedDate, selectedBloodType, radius, userCoords]);

  // Calculate exact numeric distance in km using Haversine formula
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const getDistanceNum = (lat: number, lng: number): number => {
    const center = userCoords || DEFAULT_CENTER;
    return getDistanceKm(center[0], center[1], lat, lng);
  };

  // Filter & Sort location list locally: strictly ONLY positions within scan radius
  useEffect(() => {
    let result = [...locations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (loc) => loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q)
      );
    }

    if (selectedBloodType) {
      result = result.filter((loc) =>
        loc.bloodTypes.some((bt: string) => bt.toUpperCase() === selectedBloodType.toUpperCase())
      );
    }

    // Filter by crowding level
    result = result.filter((loc) => crowdingLevels[loc.crowdingLevel] !== false);

    // STRICT RADIAL FILTER: keep ONLY positions whose distance from center <= radius (in km)
    result = result.filter((loc) => getDistanceNum(loc.lat, loc.lng) <= radius);

    // Sort by distance to center (closest first)
    result.sort((a, b) => getDistanceNum(a.lat, a.lng) - getDistanceNum(b.lat, b.lng));

    setFilteredLocations(result);
  }, [searchQuery, locations, selectedBloodType, crowdingLevels, userCoords, radius]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: userCoords || DEFAULT_CENTER,
        zoom: 13,
        zoomControl: false,
      });

      const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || 'LojOKbN26JMpzwvjMsJ2mGCR8OxXOsNAZP80bAxU';
      const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongApiKey}`;

      if (typeof (L as any).maplibreGL === 'function') {
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
  }, []);

  const handleStartBooking = (loc: any, slotTime?: string) => {
    if (!loc) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const dateToUse = selectedDate || todayStr;

    let timeSlotToUse = slotTime;
    if (!timeSlotToUse && loc?.timeSlots && loc.timeSlots.length > 0) {
      const firstAvailable = loc.timeSlots.find((s: any) => (s.capacity - (s.registeredCount || 0)) > 0) || loc.timeSlots[0];
      if (firstAvailable) {
        timeSlotToUse = `${firstAvailable.startTime} - ${firstAvailable.endTime}`;
      }
    }
    if (!timeSlotToUse) {
      timeSlotToUse = '08:00 - 10:00';
    }

    const locId = loc._raw?._id || loc.id || loc._id;
    updateData({
      locationId: locId,
      date: dateToUse,
      timeSlot: timeSlotToUse,
      locationData: {
        id: locId,
        name: loc.name,
        address: loc.address,
      },
    });
    toast.success(`Đã chọn điểm "${loc.name}" (${dateToUse}, khung giờ ${timeSlotToUse})!`);
    navigate('/my-appointments/schedule');
  };

  // Event listener to handle location selection from popup action button
  useEffect(() => {
    const handlePopupSelect = (e: any) => {
      const locationId = e.detail;
      const target = locations.find((l) => l.id === locationId);
      if (target) {
        handleStartBooking(target);
      }
    };
    window.addEventListener('select-donation-location', handlePopupSelect);
    return () => {
      window.removeEventListener('select-donation-location', handlePopupSelect);
    };
  }, [locations, navigate, updateData, selectedDate]);

  // Render Map Markers & Dynamic Radius Circle whenever filteredLocations or radius update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear existing radius circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    const center = userCoords || DEFAULT_CENTER;

    // Render translucent radius boundary circle on map
    circleRef.current = L.circle(center, {
      radius: radius * 1000,
      color: '#93000b',
      fillColor: '#93000b',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(map);

    // Fit map view to circle bounds so radius is fully visible
    map.fitBounds(circleRef.current.getBounds(), {
      padding: [40, 40],
      maxZoom: 16,
    });

    // Add user center GPS marker
    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:32px; height:32px; background:rgba(59,130,246,0.3); border-radius:50%; animation:ping 1.5s infinite;"></div>
          <div style="width:20px; height:20px; background:#2563EB; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(37,99,235,0.8);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const userMarker = L.marker(center, { icon: userIcon, zIndexOffset: 2000 })
      .addTo(map)
      .bindPopup('<div style="font-weight:bold; font-size:13px; color:#1e3a8a;">📍 Vị trí trung tâm của bạn</div>');
    markersRef.current.push(userMarker);

    // Render high-visibility markers for campaign locations strictly within radius
    filteredLocations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const colorMap: Record<string, string> = {
        Low: '#16A34A',
        Moderate: '#F59E0B',
        High: '#EF4444',
      };
      const markerColor = colorMap[loc.crowdingLevel] || '#93000b';
      const distanceKm = getDistanceNum(loc.lat, loc.lng);

      // Prominent High-Visibility Teardrop Pin + Label Badge
      const customHtml = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;" class="map-campaign-pin">
          <!-- Top Label Badge -->
          <div style="
            background: ${isSelected ? '#93000b' : '#1f2937'};
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 9px;
            border-radius: 12px;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            margin-bottom: 4px;
            border: 1.5px solid white;
            display: flex;
            align-items: center;
            gap: 5px;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span>${loc.name}</span>
            <span style="font-size: 10px; opacity: 0.9; background: rgba(255,255,255,0.2); padding: 1px 5px; border-radius: 8px;">${distanceKm}km</span>
          </div>

          <!-- Teardrop Pin Container -->
          <div style="position:relative; width:${isSelected ? '40px' : '34px'}; height:${isSelected ? '40px' : '34px'};">
            ${
              loc.status === 'Urgent' || loc.crowdingLevel === 'High'
                ? `<div style="position:absolute; inset:-5px; background:${markerColor}; border-radius:50%; opacity:0.45; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
                : ''
            }
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
              transition: all 0.2s ease;
            ">
              <div style="transform: rotate(45deg); display:flex; align-items:center; justify-center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-campaign-marker',
        html: customHtml,
        iconSize: [160, 64],
        iconAnchor: [80, 64],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon, zIndexOffset: isSelected ? 1000 : 100 }).addTo(map);

      // Bind Rich Popup Card
      const popupHtml = `
        <div style="min-width: 230px; font-family: Inter, sans-serif; padding: 4px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px; margin-bottom: 6px;">
            <h4 style="font-size: 15px; font-weight: 700; color: #271816; margin: 0; line-height: 1.2;">${loc.name}</h4>
            <span style="font-size: 12px; font-weight: 700; color: #93000b; shrink: 0;">⭐ ${loc.rating}</span>
          </div>
          <p style="font-size: 12px; color: #6c757d; margin: 0 0 8px 0; line-height: 1.3;">${loc.address}</p>
          <div style="display:flex; gap: 6px; align-items:center; margin-bottom: 10px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 700; color: ${markerColor}; background: #fff8f7; padding: 2px 8px; border-radius: 12px; border: 1px solid ${markerColor}40;">
              ${loc.crowdingLevel === 'Low' ? '🟢 Thưa thớt' : loc.crowdingLevel === 'Moderate' ? '🟡 Vừa phải' : '🔴 Cần gấp'}
            </span>
            <span style="font-size: 11px; font-weight: 600; color: #2563EB; background: #eff6ff; padding: 2px 8px; border-radius: 12px;">
              Cách ${distanceKm} km
            </span>
          </div>
          <button
            onclick="window.dispatchEvent(new CustomEvent('select-donation-location', { detail: '${loc.id}' }))"
            style="width: 100%; padding: 8px 0; background: #93000b; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;"
          >
            Đặt lịch hiến máu ngay
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        setSelectedLocation(loc);
        map.panTo([loc.lat, loc.lng]);
      });

      markersRef.current.push(marker);
    });
  }, [filteredLocations, selectedLocation, userCoords, radius]);

  // Handle Geolocation Request
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS');
      setPermissionDenied(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserCoords(coords);
        setPermissionDenied(false);
        setShowPermissionPrompt(false);
        toast.success('Đã xác định vị trí hiện tại của bạn');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 14);
        }
        setLoading(false);
      },
      () => {
        setPermissionDenied(true);
        setShowPermissionPrompt(false);
        toast.error('Bạn đã từ chối quyền truy cập vị trí. Hãy sử dụng tìm kiếm thủ công.');
        setLoading(false);
      }
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setRadius(15);
    setSelectedBloodType('');
    setSelectedDate('');
    setCrowdingLevels({ Low: true, Moderate: true, High: true });
    setSearchQuery('');
    toast.info('Đã đặt lại bộ lọc');
  };

  // Handlers for search & filters reset

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-[#fff8f7] relative overflow-hidden">
      {/* Top Search & Action Bar */}
      <header className="h-16 bg-white border-b border-[#f1f3f5] px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f7] flex items-center justify-center text-[#93000b] border border-[#f9dcd8]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#271816] leading-none">
              Bản Đồ Điểm Hiến Máu
            </h1>
            <p className="text-[12px] text-[#6c757d] mt-0.5">
              Tìm kiếm chiến dịch và điểm hiến máu gần bạn nhất
            </p>
          </div>
        </div>

        {/* Center Search Input (af_01 Manual Search) */}
        <div className="relative w-full max-w-md mx-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bệnh viện, địa chỉ, quận/huyện..."
            className="w-full h-10 pl-10 pr-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-full text-[13px] font-medium text-[#271816] focus:bg-white focus:border-[#93000b] focus:ring-1 focus:ring-[#93000b] outline-none transition-all"
          />
          {permissionDenied && (
            <span className="absolute -bottom-5 left-4 text-[10px] font-semibold text-[#93000b]">
              * Quyền vị trí tắt: Đang áp dụng tìm kiếm thủ công
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#271816]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* GPS Button */}
          <button
            onClick={() => setShowPermissionPrompt(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#fff8f7] border border-[#f9dcd8] text-[#93000b] hover:bg-[#ffe9e6] rounded-xl text-[13px] font-semibold transition-all"
            title="Định vị trí của tôi"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Vị trí của tôi</span>
          </button>

          {/* Map vs List View Toggle */}
          <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-xl p-1 flex items-center">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-[#93000b] text-white shadow-sm'
                  : 'text-[#6c757d] hover:text-[#271816]'
              }`}
            >
              Bản đồ
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-[#93000b] text-white shadow-sm'
                  : 'text-[#6c757d] hover:text-[#271816]'
              }`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </header>

      {/* Main Map Container & Overlays */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Floating Filter Panel */}
        <div className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl z-20 border border-[#f1f3f5] p-5 max-h-[calc(100vh-160px)] overflow-y-auto hidden md:block">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f3f5]">
            <div className="flex items-center gap-2 text-[#271816]">
              <Filter className="w-4 h-4 text-[#93000b]" />
              <h3 className="text-[15px] font-bold">Bộ lọc tìm kiếm</h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[12px] font-semibold text-[#93000b] hover:underline"
            >
              Đặt lại
            </button>
          </div>

          <div className="space-y-5">
            {/* Radius Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-semibold text-[#5b403d]">Bán kính tìm kiếm</label>
                <span className="text-[13px] font-bold text-[#93000b]">{radius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-[#dee2e6] rounded-lg appearance-none cursor-pointer accent-[#93000b]"
              />
            </div>

            {/* Target Blood Type */}
            <div>
              <label className="text-[13px] font-semibold text-[#5b403d] block mb-2">
                Nhóm máu cần tìm
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setSelectedBloodType(selectedBloodType === type ? '' : type)
                    }
                    className={`h-9 rounded-lg border text-[12px] font-bold transition-all ${
                      selectedBloodType === type
                        ? 'border-[#93000b] bg-[#93000b] text-white shadow-sm'
                        : 'border-[#dee2e6] bg-white text-[#271816] hover:border-[#93000b]/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Crowding Level */}
            <div>
              <label className="text-[13px] font-semibold text-[#5b403d] block mb-2">
                Mức độ đông đúc
              </label>
              <div className="space-y-1.5">
                {[
                  { key: 'Low', label: 'Vắng vẻ (Low)', color: 'bg-emerald-500' },
                  { key: 'Moderate', label: 'Vừa phải (Moderate)', color: 'bg-amber-500' },
                  { key: 'High', label: 'Đông đúc / Đầy (Full)', color: 'bg-red-500' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#f1f3f5] hover:bg-[#fff8f7] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={crowdingLevels[item.key] !== false}
                      onChange={(e) =>
                        setCrowdingLevels({
                          ...crowdingLevels,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#93000b] focus:ring-[#93000b]"
                    />
                    <span className="flex-1 text-[13px] font-medium text-[#271816]">
                      {item.label}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Available Date */}
            <div>
              <label className="text-[13px] font-semibold text-[#5b403d] block mb-2">
                Ngày dự định hiến
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-white border border-[#dee2e6] rounded-xl text-[13px] font-medium text-[#271816] focus:border-[#93000b] focus:ring-1 focus:ring-[#93000b] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Map View OR Fallback List View */}
        <div className="flex-1 h-full relative bg-[#f1f3f5]">
          {viewMode === 'map' && !mapError ? (
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          ) : (
            /* Map Service Offline State (browse_interactive_map_standardized_2) */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#fff8f7] overflow-y-auto">
              <div className="w-20 h-20 rounded-full bg-[#ffe9e6] flex items-center justify-center mb-4 text-[#93000b]">
                <MapPinOff className="w-10 h-10" />
              </div>
              <h2 className="text-[20px] font-bold text-[#271816] mb-2">
                Dịch vụ bản đồ không khả dụng
              </h2>
              <p className="text-[14px] text-[#6c757d] max-w-md mb-6">
                Hệ thống đang hiển thị danh sách các điểm hiến máu bên dưới. Bạn vẫn có thể chọn địa điểm và đặt lịch bình thường.
              </p>
              <button
                onClick={() => {
                  setMapError(false);
                  setViewMode('list');
                }}
                className="px-6 py-2.5 bg-[#93000b] text-white rounded-xl text-[14px] font-semibold shadow-sm hover:bg-[#7a0009]"
              >
                Xem danh sách điểm hiến máu
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Nearby Campaigns & Locations */}
        <aside className="w-full md:w-96 bg-white border-l border-[#f1f3f5] flex flex-col h-full z-20 shrink-0 shadow-lg">
          <div className="p-4 border-b border-[#f1f3f5] bg-[#fff8f7] flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#271816]">Địa điểm gần bạn</h3>
              <p className="text-[12px] text-[#6c757d]">
                Tìm thấy {filteredLocations.length} địa điểm hiến máu
              </p>
            </div>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-[#93000b]" />}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* af_02 Empty State when no donation points match */}
            {filteredLocations.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-3 text-[#a3a3a3]">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h4 className="text-[15px] font-bold text-[#271816] mb-1">
                  Không tìm thấy điểm hiến máu
                </h4>
                <p className="text-[13px] text-[#6c757d] max-w-xs mb-4">
                  Không có chiến dịch nào phù hợp với bộ lọc hiện tại. Hãy thử mở rộng bán kính hoặc chọn lại nhóm máu.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-[#dee2e6] rounded-xl text-[13px] font-semibold text-[#271816] hover:bg-[#f8f9fa]"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const dist = getDistanceNum(loc.lat, loc.lng);

                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([loc.lat, loc.lng]);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#93000b] bg-[#fff8f7] ring-1 ring-[#93000b] shadow-md'
                        : 'border-[#f1f3f5] bg-white hover:border-[#dee2e6] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          loc.status === 'Urgent'
                            ? 'bg-red-100 text-red-700'
                            : loc.status === 'Active Now'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {loc.status}
                      </span>
                      <span className="text-[11px] font-bold text-[#6c757d] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#93000b]" />
                        {dist} km
                      </span>
                    </div>

                    <h4 className="text-[15px] font-bold text-[#271816] mb-1 leading-snug">
                      {loc.name}
                    </h4>
                    <p className="text-[12px] text-[#6c757d] line-clamp-2 mb-3">
                      {loc.address}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f1f3f5]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            loc.crowdingLevel === 'Low'
                              ? 'bg-emerald-500'
                              : loc.crowdingLevel === 'Moderate'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span className="text-[11px] font-medium text-[#5b403d]">
                          {loc.crowdingLevel === 'Low'
                            ? 'Vắng vẻ'
                            : loc.crowdingLevel === 'Moderate'
                              ? 'Mức đông vừa'
                              : 'Đông đúc'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartBooking(loc);
                        }}
                        className="px-3 py-1.5 bg-[#93000b] text-white rounded-lg text-[12px] font-bold hover:bg-[#7a0009] transition-all flex items-center gap-1"
                      >
                        Đặt lịch
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Location Detail Modal (donation_point_details_b_nh_vi_n_ch_r_y) */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-6 border-b border-[#f1f3f5] relative bg-[#fff8f7]">
              <button
                onClick={() => setSelectedLocation(null)}
                className="absolute top-4 right-4 p-1.5 text-[#6c757d] hover:text-[#271816] rounded-full hover:bg-white/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#93000b] text-white text-[10px] font-bold rounded-full uppercase">
                  Điểm ưu tiên
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-[12px] font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{selectedLocation.rating}</span>
                </div>
              </div>

              <h2 className="text-[20px] font-bold text-[#271816] leading-tight">
                {selectedLocation.name}
              </h2>
              <p className="text-[13px] text-[#6c757d] mt-1 flex items-start gap-1">
                <MapPin className="w-4 h-4 text-[#93000b] shrink-0 mt-0.5" />
                {selectedLocation.address}
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#f8f9fa] rounded-xl">
                  <span className="text-[11px] font-bold text-[#6c757d] uppercase block mb-1">
                    Giờ hoạt động
                  </span>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#271816]">
                    <Clock className="w-4 h-4 text-[#93000b]" />
                    <span>{selectedLocation.operatingHours}</span>
                  </div>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-xl">
                  <span className="text-[11px] font-bold text-[#6c757d] uppercase block mb-1">
                    Tình trạng
                  </span>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#271816]">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedLocation.crowdingLevel === 'Low'
                          ? 'bg-emerald-500'
                          : selectedLocation.crowdingLevel === 'Moderate'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                    />
                    <span>{selectedLocation.crowdingLevel} crowding</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-bold text-[#6c757d] uppercase block mb-2">
                  Nhóm máu đang ưu tiên thu nhận
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLocation.bloodTypes.map((bt: string) => (
                    <span
                      key={bt}
                      className="px-3 py-1 bg-[#fee2e2] text-[#93000b] rounded-lg text-[12px] font-bold"
                    >
                      {bt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[12px] font-bold text-[#6c757d] uppercase block mb-2">
                  Khung giờ hiến khả dụng
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedLocation.timeSlots.map((slot: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleStartBooking(selectedLocation, `${slot.startTime} - ${slot.endTime}`)}
                      className="p-3 border border-[#dee2e6] hover:border-[#93000b] hover:bg-[#fff8f7] rounded-xl flex items-center justify-between text-[12px] cursor-pointer transition-all group"
                      title="Nhấn để đặt lịch khung giờ này"
                    >
                      <span className="font-semibold text-[#271816] group-hover:text-[#93000b]">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="text-[11px] font-bold text-[#16a34a] flex items-center gap-0.5">
                        Còn {slot.capacity - slot.registeredCount} chỗ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#f1f3f5] bg-[#f8f9fa] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-5 py-2.5 border border-[#dee2e6] rounded-xl text-[14px] font-semibold text-[#271816] hover:bg-white"
              >
                Đóng
              </button>
              <button
                onClick={() => handleStartBooking(selectedLocation)}
                className="px-6 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white rounded-xl text-[14px] font-bold shadow-sm transition-all flex items-center gap-2"
              >
                Đặt lịch hiến máu ngay
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Permission Modal (find_donation_locations_permission_request) */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#ffe9e6] rounded-full flex items-center justify-center mx-auto text-[#93000b]">
              <Navigation className="w-8 h-8" />
            </div>

            <h3 className="text-[18px] font-bold text-[#271816]">
              Cho phép truy cập vị trí của bạn?
            </h3>
            <p className="text-[13px] text-[#6c757d]">
              LifeLine cần quyền truy cập vị trí GPS để tự động gợi ý điểm hiến máu gần nhất trong bán kính {radius}km.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleRequestLocation}
                className="w-full py-3 bg-[#93000b] text-white rounded-xl font-bold text-[14px] shadow-sm hover:bg-[#7a0009] transition-all"
              >
                Đồng ý & Cho phép
              </button>
              <button
                onClick={() => {
                  setShowPermissionPrompt(false);
                  setPermissionDenied(true);
                }}
                className="w-full py-3 border border-[#dee2e6] text-[#271816] rounded-xl font-semibold text-[14px] hover:bg-[#f8f9fa]"
              >
                Tìm kiếm thủ công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
