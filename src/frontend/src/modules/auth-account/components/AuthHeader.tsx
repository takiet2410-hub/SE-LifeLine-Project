import React from 'react';
import { Link } from 'react-router-dom';
import { LifeLineLogo } from './LifeLineLogo';

export const AuthHeader: React.FC = () => {
  return (
    <header className="w-full h-[72px] bg-white border-b border-[#f1f3f5] sticky top-0 z-50 transition-shadow hover:shadow-xs">
      <div className="max-w-[1280px] h-full mx-auto px-8 flex items-center justify-between">
        {/* Brand Logo Group */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-[33.6px] bg-[#93000b] rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
            <LifeLineLogo className="w-[18px] h-[22.5px] text-white" />
          </div>
          <span className="text-[18px] font-bold leading-[25.2px] text-[#93000b] tracking-tight">
            LifeLine
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/about"
            className="text-[14px] font-semibold text-[#5b403d] hover:text-[#93000b] transition-colors"
          >
            About Us
          </Link>
          <Link
            to="/how-it-works"
            className="text-[14px] font-semibold text-[#5b403d] hover:text-[#93000b] transition-colors"
          >
            How It Works
          </Link>
          <Link
            to="/locations"
            className="text-[14px] font-semibold text-[#5b403d] hover:text-[#93000b] transition-colors"
          >
            Find Locations
          </Link>
          <Link
            to="/health-tips"
            className="text-[14px] font-semibold text-[#5b403d] hover:text-[#93000b] transition-colors"
          >
            Health Tips
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth/register"
            className="text-[14px] font-semibold text-[#93000b] hover:text-[#7a0009] px-3 py-2 rounded-md transition-colors"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="text-[14px] font-semibold text-white bg-[#93000b] hover:bg-[#7a0009] px-4 py-2.5 rounded-lg shadow-sm transition-all hover:shadow active:scale-98"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
