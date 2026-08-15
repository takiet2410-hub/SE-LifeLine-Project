import React, { useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import { updateUserProfile } from '../../auth-account/api/authApi';
import { toast } from 'sonner';

// BE /users/profile response shape (donationImpact section)
export interface ProfileData {
  profileInfo?: {
    avatarUrl?: string;
    fullName?: string;
    memberSince?: string;
    currentAddress?: string;
    bloodType?: string;
  };
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    idDocumentNumber?: string;
    passportNumber?: string;
  };
  contactInfo?: {
    phoneNumber?: string;
    email?: string;
    permanentAddress?: {
      province?: string;
      district?: string;
      ward?: string;
      street?: string;
    };
    currentAddress?: {
      province?: string;
      district?: string;
      ward?: string;
      street?: string;
    };
  };
  donationImpact?: {
    totalDonations?: number;
    livesImpacted?: number;
    currentStreak?: number;
    status?: string;
    xp?: number;
    donorLevel?: number;
  };
  donationTimeline?: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    locationName: string;
    bloodType: string;
    volume: string;
    status: string;
    certificateNo: string;
  }>;
  xpActivityLog?: Array<{
    id: string;
    activity: string;
    date: string;
    locationName: string;
    xp: number;
    impact: string;
  }>;
  achievements?: Array<{
    badgeType: string;
    title: string;
    description: string;
    icon: string;
    awardedAt: string;
  }>;
}

interface ProfileHeaderCardProps {
  profileData?: ProfileData | null;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profileData, onAvatarUpdate }) => {
  const { user, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [hoveringAvatar, setHoveringAvatar] = useState(false);

  // Ưu tiên data từ API, fallback về AuthContext user nếu chưa load xong
  const fullName =
    profileData?.profileInfo?.fullName
    || user?.fullName
    || '—';

  const bloodType = profileData?.profileInfo?.bloodType || '—';
  const avatarUrl = profileData?.profileInfo?.avatarUrl;

  // Format ngày thành viên
  const memberSince = profileData?.profileInfo?.memberSince
    ? new Date(profileData.profileInfo.memberSince).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const address = profileData?.profileInfo?.currentAddress || null;

  const totalDonations = profileData?.donationImpact?.totalDonations ?? 0;
  const livesImpacted = profileData?.donationImpact?.livesImpacted ?? 0;
  const currentStreak = profileData?.donationImpact?.currentStreak ?? 0;
  const eligibilityStatus = profileData?.donationImpact?.status || 'Eligible Now';

  // Xác định màu status
  const isEligible = eligibilityStatus === 'Eligible Now';

  const handleAvatarUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Cloudinary directly from browser
      const imageUrl = await uploadToCloudinary(file);
      
      // Update profile on backend with new avatar URL
      const res = await updateUserProfile({ avatarUrl: imageUrl });
      
      if (res.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        // Notify parent to refresh profile data
        if (onAvatarUpdate) {
          onAvatarUpdate(imageUrl);
        }
      } else {
        toast.error(res.message || 'Cập nhật ảnh thất bại');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  return (
    <div className="flex p-8 flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden relative">
      <div className="absolute -right-[79px] -top-[79px] rounded-full bg-[rgba(147,0,11,0.05)] w-64 h-64"></div>
      <div className="flex items-start gap-8 w-full">
        {/* Avatar */}
        <div className="flex flex-col items-start w-fit relative">
          <div className="rounded-2xl border-4 border-[#FFF] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] w-32 h-32 overflow-hidden bg-gray-200 relative">
            {avatarUrl && (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            )}
            {/* Upload overlay on hover */}
            {!isUploading && (
              <div 
                className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                  hoveringAvatar ? 'opacity-100' : 'opacity-0'
                }`}
                onMouseEnter={() => setHoveringAvatar(true)}
                onMouseLeave={() => setHoveringAvatar(false)}
              >
                <label htmlFor="avatar-upload" className="cursor-pointer p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
                  <svg className="w-6 h-6 text-[#93000B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="flex py-1 px-3 flex-col items-start absolute -right-2 -bottom-2 rounded-full bg-[#93000B] w-fit shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)]">
            <p className="text-[#FFF] font-inter text-sm font-bold leading-[14px] w-fit">{bloodType}</p>
          </div>
        </div>

        <div className="flex pt-[7px] flex-col items-start gap-1 w-full">
          {/* Name */}
          <div className="flex flex-col items-start w-full">
            <p className="text-[#271816] font-inter text-4xl font-bold leading-[43.2px]">{fullName}</p>
          </div>

          {/* Meta badges */}
          <div className="flex items-center gap-4 w-full flex-wrap">
            <div className="flex pt-[3px] pr-3 pb-1 pl-3 items-center gap-1 rounded-full bg-[#FEE2E2] w-fit">
              <span className="text-[#93000B] font-inter text-xs font-medium leading-[16.8px]">Verified Donor</span>
            </div>
            {memberSince && (
              <div className="flex items-center gap-1 w-fit">
                <span className="text-[#6C757D] font-inter text-sm leading-[21px]">Member since {memberSince}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-1 w-fit">
                <span className="text-[#6C757D] font-inter text-sm leading-[21px] truncate max-w-[240px]">{address}</span>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="flex pt-7 justify-center items-start gap-4 w-full">
            <div className="flex p-4 flex-col items-start rounded-xl bg-[#F8F9FA] w-full">
              <p className="text-[#6C757D] font-inter text-xs font-bold leading-[16.8px] tracking-[0.05em]">TOTAL DONATIONS</p>
              <p className="text-[#271816] font-inter text-[28px] font-bold leading-[36.4px]">
                {totalDonations} <span className="text-xs font-medium">units</span>
              </p>
            </div>
            <div className="flex p-4 flex-col items-start rounded-xl bg-[#F8F9FA] w-full">
              <p className="text-[#6C757D] font-inter text-xs font-bold leading-[16.8px] tracking-[0.05em]">LIVES IMPACTED</p>
              <p className="text-[#271816] font-inter text-[28px] font-bold leading-[36.4px]">{livesImpacted}</p>
            </div>
            <div className="flex p-4 flex-col items-start rounded-xl bg-[#F8F9FA] w-full">
              <p className="text-[#6C757D] font-inter text-xs font-bold leading-[16.8px] tracking-[0.05em]">CURRENT STREAK</p>
              <p className="text-[#271816] font-inter text-[28px] font-bold leading-[36.4px]">
                {currentStreak} <span className="text-xs font-medium">mos</span>
              </p>
            </div>
            <div className={`flex p-4 flex-col items-start rounded-xl border-l-4 bg-[#F8F9FA] w-full ${isEligible ? 'border-l-[#16A34A]' : 'border-l-[#D97706]'}`}>
              <p className={`font-inter text-xs font-bold leading-[16.8px] tracking-[0.05em] ${isEligible ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>STATUS</p>
              <p className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">{eligibilityStatus}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex pt-5 items-start gap-3 w-full">
            <button
              onClick={logout}
              className="flex py-3 px-6 items-center gap-2 rounded-lg bg-[#93000B] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] transition-colors hover:bg-[#7a0009]"
            >
              <span className="text-[#FFF] font-inter text-base leading-6">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
