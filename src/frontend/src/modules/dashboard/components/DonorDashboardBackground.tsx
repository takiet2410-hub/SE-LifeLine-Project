import React from 'react';

export const DonorDashboardBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 min-h-full w-full pointer-events-none z-0 overflow-hidden select-none bg-[#fff8f7]">
      <svg
        className="w-full h-full min-h-[900px]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="topLeftBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fecaca" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fee2e2" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff8f7" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="topRightBlobGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#fef2f2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fff8f7" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="bottomLeftBlobGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fecaca" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fee2e2" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff8f7" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="bottomRightBlobGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#fecaca" stopOpacity="0.55" />
            <stop offset="80%" stopColor="#fee2e2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fff8f7" stopOpacity="0" />
          </linearGradient>

          {/* Dot Matrix Pattern */}
          <pattern id="dotPatternLarge" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="2.5" fill="#f87171" fillOpacity="0.4" />
          </pattern>
        </defs>

        {/* ========================================================
            1. TOP-LEFT REGION (Slanted Diagonally Downwards)
        ======================================================== */}
        {/* Top-Left Diagonal Wave Blob */}
        <path
          d="M 0 0 L 450 0 C 380 65 300 130 220 190 C 150 240 85 280 0 370 Z"
          fill="url(#topLeftBlobGrad)"
        />
        {/* Top-Left Main Diagonal Wavy Contour Line */}
        <path
          d="M 540 0 C 430 65 330 140 240 210 C 155 270 85 310 0 390"
          fill="none"
          stroke="#f87171"
          strokeWidth="1.8"
          strokeOpacity="0.6"
        />
        {/* Top-Left Secondary Soft Contour Line */}
        <path
          d="M 370 0 C 300 55 230 115 170 175 C 105 235 55 275 0 330"
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.2"
          strokeOpacity="0.45"
        />
        {/* Top-Left Red Heart Icon (Sitting nicely on the diagonal slope) */}
        <g transform="translate(150, 135) rotate(-15) scale(1.65)">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#e05353"
            opacity="0.92"
          />
        </g>

        {/* ========================================================
            2. BOTTOM-LEFT REGION (Much Larger & Dot Grid in View)
        ======================================================== */}
        {/* Bottom-Left Large Wave Blob */}
        <path
          d="M 0 900 L 0 500 C 140 520 230 600 265 700 C 290 780 370 850 480 900 Z"
          fill="url(#bottomLeftBlobGrad)"
        />
        {/* Bottom-Left Contour Line */}
        <path
          d="M 0 620 C 110 640 210 700 290 800 C 340 850 400 880 500 900"
          fill="none"
          stroke="#f87171"
          strokeWidth="2.0"
          strokeOpacity="0.55"
        />
        {/* Bottom-Left Dot Grid (Prominent 6x4 matrix, moved past sidebar) */}
        <rect x="210" y="740" width="132" height="88" fill="url(#dotPatternLarge)" />

        {/* ========================================================
            3. TOP-RIGHT REGION (Soft Blob, Medical Cross, Dot Grid)
        ======================================================== */}
        {/* Top-Right Soft Wave Blob */}
        <path
          d="M 1440 0 L 1180 0 C 1180 120 1260 210 1370 230 C 1405 236 1425 230 1440 220 Z"
          fill="url(#topRightBlobGrad)"
        />
        {/* Top-Right Medical Cross */}
        <g transform="translate(1220, 75) scale(1.6)">
          <path
            d="M16 9.5h-4V5.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v4H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h4v4c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-4h4c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"
            fill="#f87171"
            opacity="0.65"
          />
        </g>
        {/* Top-Right Dot Grid */}
        <rect x="1280" y="160" width="110" height="66" fill="url(#dotPatternLarge)" />

        {/* ========================================================
            4. BOTTOM-RIGHT REGION (Rising Wave, ECG Pulse Line)
        ======================================================== */}
        {/* Bottom-Right Rising Wave Blob */}
        <path
          d="M 1440 900 L 840 900 C 950 820 1040 710 1130 660 C 1240 600 1340 630 1440 560 Z"
          fill="url(#bottomRightBlobGrad)"
        />
        {/* Bottom-Right Contour Line */}
        <path
          d="M 910 900 C 1010 830 1110 730 1210 685 C 1300 645 1380 670 1440 615"
          fill="none"
          stroke="#f87171"
          strokeWidth="1.8"
          strokeOpacity="0.45"
        />
        {/* Bottom-Right Heartbeat / Pulse ECG Line */}
        <g transform="translate(1300, 520) scale(1.5)">
          <path
            d="M 2 24 L 14 24 L 19 10 L 27 38 L 33 18 L 38 28 L 46 28"
            fill="none"
            stroke="#e05353"
            strokeWidth="3.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
};
