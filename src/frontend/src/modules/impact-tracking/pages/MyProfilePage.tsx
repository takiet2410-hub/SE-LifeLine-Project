import React, { useState, useEffect } from 'react';
import { ProfileHeaderCard } from '../components/ProfileHeaderCard';
import type { ProfileData } from '../components/ProfileHeaderCard';
import { ProfileTabs } from '../components/ProfileTabs';
import { DonationTimeline } from '../components/DonationTimeline';
import { XPActivityLog } from '../components/XPActivityLog';
import { ProfileInfoTab } from '../components/ProfileInfoTab';
import { CurrentProgress } from '../components/CurrentProgress';
import { AchievementsWidget } from '../components/AchievementsWidget';
import { CallToAction } from '../components/CallToAction';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getProfile } from '../../auth-account/api/authApi';
import { toast } from 'sonner';

export const MyProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Profile Info');
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { user } = useAuth();

  // GAP-06 FIX: Gọi đúng endpoint /api/v1/users/profile (GET, cần JWT)
  // và sử dụng data trả về thay vì bỏ qua
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // getProfile() dùng apiClient đã có interceptor gắn Bearer token
        const result = await getProfile();
        if (result.success && result.user) {
          // BE trả về: { profileInfo, donationImpact, personalInfo, contactInfo }
          setProfileData(result.user as ProfileData);
        } else {
          console.warn('[MyProfilePage] Failed to load profile:', result.message);
          // Không toast lỗi nếu chỉ là empty profile — để trang hiển thị bình thường
        }
      } catch (error) {
        console.error('[MyProfilePage] Profile fetch error:', error);
        toast.error('Không thể tải thông tin hồ sơ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []); // chỉ chạy 1 lần khi mount

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-b-[#93000b]"></div>
        <p className="mt-2 text-[14px] text-[#6c757d]">Loading profile...</p>
      </div>
    );
  }

  const handleSaveProfile = async (data: any) => {
    try {
      // dynamic import or assume updateProfile is imported
      const { updateProfile } = await import('../../auth-account/api/authApi');
      const res = await updateProfile(data);
      if (res.success) {
        toast.success(res.message);
        // Refresh profile data
        const profileRes = await getProfile();
        if (profileRes.success && profileRes.user) {
          setProfileData(profileRes.user as ProfileData);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật hồ sơ');
    }
  };

  return (
    <div className="flex flex-col items-start gap-8 w-full p-8 min-h-[calc(100vh-72px)] bg-[#fff8f7]">
      {/* Header Block — nhận real data từ API */}
      <ProfileHeaderCard 
        profileData={profileData} 
        onAvatarUpdate={() => {
          // Refresh profile data after avatar update
          getProfile().then(profileRes => {
            if (profileRes.success && profileRes.user) {
              setProfileData(profileRes.user as ProfileData);
            }
          });
        }}
      />
      
      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 w-full relative items-start">
        {/* Left Column - Main Content */}
        <div className="flex flex-col gap-8 w-full">
          {activeTab === 'Profile Info' && (
            <ProfileInfoTab 
              onSaveProfile={handleSaveProfile}
              user={
              profileData ? {
                ...profileData.personalInfo,
                ...profileData.contactInfo,
                permanentAddress: profileData.contactInfo?.permanentAddress || (profileData.profileInfo as any)?.permanentAddress,
                currentAddress: profileData.contactInfo?.currentAddress || (profileData.profileInfo as any)?.currentAddress,
                address: profileData.contactInfo?.permanentAddress,
                id: user?.id || ''
              } as any : undefined
            } />
          )}
          
          {(activeTab === 'Profile Info' || activeTab === 'Donation Timeline') && (
            <DonationTimeline userId={user?.id} />
          )}

          {(activeTab === 'Profile Info' || activeTab === 'Achievements') && (
            <XPActivityLog userId={user?.id} />
          )}
          
          {activeTab === 'Donor Level' && (
            <div className="p-6 bg-white rounded-xl border border-[#f1f3f5] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-[#271816]">Donor Level Details Coming Soon</h2>
            </div>
          )}
        </div>

        {/* Right Column - Widgets */}
        <div className="flex flex-col gap-6 w-full lg:sticky lg:top-8">
          <CurrentProgress profileData={profileData} />
          <AchievementsWidget profileData={profileData} />
          <CallToAction status={profileData?.donationImpact?.status} />
        </div>
      </div>
    </div>
  );
};
