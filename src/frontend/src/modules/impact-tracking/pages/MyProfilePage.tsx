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
import { useFeatureFlags } from '../../../shared/contexts/FeatureFlagsContext';

export const MyProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const gamificationEnabled = isEnabled('gamification_badges');
  const visibleActiveTab = !gamificationEnabled && (activeTab === 'achievements' || activeTab === 'donor-level' || activeTab === 'Achievements' || activeTab === 'Donor Level')
    ? 'profile'
    : activeTab;

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
        <p className="mt-2 text-[14px] text-[#6c757d]">Đang tải hồ sơ...</p>
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
    <div className="flex flex-col items-start gap-5 sm:gap-8 w-full p-3 sm:p-5 lg:p-8 min-h-[calc(100dvh-72px)] bg-[#fff8f7]">
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
      <ProfileTabs
        activeTab={visibleActiveTab}
        setActiveTab={setActiveTab}
        gamificationEnabled={gamificationEnabled}
      />

      {!gamificationEnabled && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Thành tích, huy hiệu và cấp độ người hiến đang được quản trị viên tạm tắt. Thông tin hồ sơ và lịch sử hiến máu vẫn sử dụng bình thường.
        </div>
      )}

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-5 lg:gap-8 w-full min-w-0 relative items-start">
        {/* Left Column - Main Content */}
        <div className="flex min-w-0 flex-col gap-5 lg:gap-8 w-full">
          {(visibleActiveTab === 'profile' || visibleActiveTab === 'Profile Info') && (
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
          
          {(visibleActiveTab === 'profile' || visibleActiveTab === 'Profile Info' || visibleActiveTab === 'timeline' || visibleActiveTab === 'Donation Timeline') && (
            <DonationTimeline userId={user?.id} profileData={profileData} />
          )}

          {gamificationEnabled && (visibleActiveTab === 'profile' || visibleActiveTab === 'Profile Info' || visibleActiveTab === 'achievements' || visibleActiveTab === 'Achievements') && (
            <XPActivityLog userId={user?.id} profileData={profileData} />
          )}
          
          {gamificationEnabled && (visibleActiveTab === 'donor-level' || visibleActiveTab === 'Donor Level') && (
            <div className="p-6 bg-white rounded-xl border border-[#f1f3f5] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-[#271816]">Chi tiết Cấp bậc Người hiến máu</h2>
            </div>
          )}
        </div>

        {/* Right Column - Widgets */}
        <div className="flex flex-col gap-6 w-full lg:sticky lg:top-8">
          {gamificationEnabled && <CurrentProgress profileData={profileData} />}
          {gamificationEnabled && <AchievementsWidget profileData={profileData} />}
          <CallToAction status={profileData?.donationImpact?.status} />
        </div>
      </div>
    </div>
  );
};
