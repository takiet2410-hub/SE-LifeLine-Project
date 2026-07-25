import React, { useState } from 'react';
import { PersonalInfo } from './PersonalInfo';
import { ContactInfo } from './ContactInfo';

interface ProfileInfoTabProps {
  onSaveProfile?: (data: any) => Promise<void>;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    address?: any; // changed from string to any to support object
    dateOfBirth?: string;
    birth?: string;
    gender?: string;
    bloodType?: string;
    idDocumentNumber?: string;
    passportNumber?: string;
  };
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({ user, onSaveProfile }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Default user data if none provided
  const defaultUser = {
    id: '1',
    email: 'tanhkiet.2006@gmail.com',
    fullName: 'NGUYỄN VĂN AN',
    phoneNumber: '0395670040',
    address: '12/18 Trịnh Định Trọng, Phường Tân Phú, Thành phố Hồ Chí Minh',
    dateOfBirth: '01/01/1990',
    gender: 'Nam',
    bloodType: 'O+',
    idDocumentNumber: '049206001105',
    passportNumber: '-'
  };

  const currentUser = user || defaultUser;

  const handleSave = async (data: any) => {
    if (onSaveProfile) {
      await onSaveProfile(data);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full relative pb-20">
      <div className="flex flex-col gap-6 md:flex-row w-full">
        <PersonalInfo 
          user={currentUser}
        />
        <ContactInfo 
          isEditing={isEditing} 
          onEdit={() => setIsEditing(true)} 
          onCancel={() => setIsEditing(false)} 
          onSave={handleSave}
          user={currentUser}
        />
      </div>
    </div>
  );
};
