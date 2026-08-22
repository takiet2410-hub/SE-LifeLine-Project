import React from 'react';

interface PersonalInfoProps {
  isEditing?: boolean;
  user?: any;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ isEditing, user }) => {
  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-lg border border-[#F1F3F5] bg-[#F8F9FA] w-full">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-[#152A43] font-inter text-base font-bold leading-6">Thông tin cá nhân</h3>

      </div>
      
      <div className="grid grid-cols-[120px_1fr] gap-y-4 w-full text-sm">
        <span className="text-[#6C757D] flex items-center h-full">Số CMND:</span>
        <span className="text-[#271816] font-medium flex items-center gap-1 h-full">
          {user?.idDocumentNumber || '-'} {isEditing && <LockIcon />}
        </span>
        
        <span className="text-[#6C757D] flex items-center h-full">Số hộ chiếu:</span>
        <span className="text-[#271816] font-medium flex items-center gap-1 h-full">
          {user?.passportNumber || '-'} {isEditing && <LockIcon />}
        </span>
        
        <span className="text-[#6C757D] flex items-center h-full pt-1">Họ và tên:</span>
        <span className="text-[#271816] font-medium uppercase flex items-center gap-1 h-full">
          {user?.fullName || '-'} {isEditing && <LockIcon />}
        </span>
        
        <span className="text-[#6C757D] flex items-center h-full">Ngày sinh:</span>
        <span className="text-[#271816] font-medium flex items-center gap-1 h-full">
          {(() => {
            const dob = user?.dateOfBirth;
            if (!dob) return '-';
            if (dob.includes('/')) return dob;
            try {
              const date = new Date(dob);
              if (isNaN(date.getTime())) return dob;
              return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            } catch {
              return dob;
            }
          })()} {isEditing && <LockIcon />}
        </span>
        
        <span className="text-[#6C757D] flex items-center h-full">Giới tính:</span>
        <span className="text-[#271816] font-medium flex items-center gap-1 h-full">
          {user?.gender || '-'} {isEditing && <LockIcon />}
        </span>
        
        <span className="text-[#6C757D] flex items-center h-full">Nhóm máu:</span>
        <span className="text-[#271816] font-medium flex items-center gap-1 h-full">
          {(!user?.bloodType || user.bloodType === 'Unknown' || user.bloodType === 'unknown' || user.bloodType === '—') ? 'Chưa cập nhật' : user.bloodType} {isEditing && <LockIcon />}
        </span>
      </div>
    </div>
  );
};

const LockIcon = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 10.5C0.725 10.5 0.489583 10.4021 0.29375 10.2063C0.0979166 10.0104 0 9.775 0 9.5V4.5C0 4.225 0.0979166 3.98958 0.29375 3.79375C0.489583 3.59792 0.725 3.5 1 3.5H1.5V2.5C1.5 1.80833 1.74375 1.21875 2.23125 0.73125C2.71875 0.24375 3.30833 0 4 0C4.69167 0 5.28125 0.24375 5.76875 0.73125C6.25625 1.21875 6.5 1.80833 6.5 2.5V3.5H7C7.275 3.5 7.51042 3.59792 7.70625 3.79375C7.90208 3.98958 8 4.225 8 4.5V9.5C8 9.775 7.90208 10.0104 7.70625 10.2063C7.51042 10.4021 7.275 10.5 7 10.5H1ZM1 9.5H7V4.5H1V9.5ZM4 8C4.275 8 4.51042 7.90208 4.70625 7.70625C4.90208 7.51042 5 7.275 5 7C5 6.725 4.90208 6.48958 4.70625 6.29375C4.51042 6.09792 4.275 6 4 6C3.725 6 3.48958 6.09792 3.29375 6.29375C3.09792 6.48958 3 6.725 3 7C3 7.275 3.09792 7.51042 3.29375 7.70625C3.48958 7.90208 3.725 8 4 8ZM2.5 3.5H5.5V2.5C5.5 2.08333 5.35417 1.72917 5.0625 1.4375C4.77083 1.14583 4.41667 1 4 1C3.58333 1 3.22917 1.14583 2.9375 1.4375C2.64583 1.72917 2.5 2.08333 2.5 2.5V3.5ZM1 9.5V4.5V9.5Z" fill="#271816"/>
  </svg>
);
