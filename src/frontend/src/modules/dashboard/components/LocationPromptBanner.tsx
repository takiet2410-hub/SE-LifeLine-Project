import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfile } from '../../auth-account/api/authApi';

export const LocationPromptBanner: React.FC = () => {
  const [needsLocation, setNeedsLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res.success && res.user) {
          const profile = res.user.profileInfo || res.user;
          // Check if location coordinates exist (assuming format { type: "Point", coordinates: [lng, lat] })
          const hasLocation = profile.location && Array.isArray(profile.location.coordinates) && profile.location.coordinates.length === 2;
          
          if (!hasLocation && profile.role === 'Donor') {
            setNeedsLocation(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile for location check', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading || !needsLocation) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-blue-800 font-bold text-[16px] mb-1">⚠️ Cập nhật vị trí để nhận thông báo SOS</h3>
          <p className="text-blue-700 text-[14px]">
            Để nhận được thông báo yêu cầu hiến máu khẩn cấp (SOS) gần bạn nhất, hãy bật vị trí trong phần Hồ sơ.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Link 
          to="/profile" 
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-[14px] shadow-sm whitespace-nowrap"
        >
          Cập nhật vị trí
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
