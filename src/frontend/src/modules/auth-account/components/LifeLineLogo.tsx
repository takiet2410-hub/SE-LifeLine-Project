import React from 'react';

interface LifeLineLogoProps {
  className?: string;
}

export const LifeLineLogo: React.FC<LifeLineLogoProps> = ({ className = '' }) => {
  return (
    <svg
      width="24"
      height="30"
      viewBox="0 0 24 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 30C8.575 30 5.71875 28.825 3.43125 26.475C1.14375 24.125 0 21.2 0 17.7C0 15.2 0.99375 12.4812 2.98125 9.54375C4.96875 6.60625 7.975 3.425 12 0C16.025 3.425 19.0312 6.60625 21.0187 9.54375C23.0062 12.4812 24 15.2 24 17.7C24 21.2 22.8563 24.125 20.5688 26.475C18.2812 28.825 15.425 30 12 30ZM7.5 24H16.5V21H7.5V24ZM10.5 19.5H13.5V16.5H16.5V13.5H13.5V10.5H10.5V13.5H7.5V16.5H10.5V19.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
