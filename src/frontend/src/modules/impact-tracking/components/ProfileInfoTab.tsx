import React, { useState } from 'react';
import { PersonalInfo } from './PersonalInfo';
import { ContactInfo } from './ContactInfo';

export const ProfileInfoTab: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full relative pb-20">
      <div className="flex flex-col gap-6 md:flex-row w-full">
        <PersonalInfo isEditing={isEditing} onEdit={() => setIsEditing(true)} />
        <ContactInfo isEditing={isEditing} onEdit={() => setIsEditing(true)} onCancel={() => setIsEditing(false)} onSave={() => setIsEditing(false)} />
      </div>
    </div>
  );
};
