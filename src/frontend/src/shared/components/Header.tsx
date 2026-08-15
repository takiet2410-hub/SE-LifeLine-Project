import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { labelKey: 'About Us', href: '/about' },
    { labelKey: 'How it Works', href: '/how-it-works' },
    { labelKey: 'Find Locations', href: '/find-locations' },
    { labelKey: 'Educational', href: '/health-tips' },

  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <svg width="20" height="25" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M10 25C7.14583 25 4.76562 24.0208 2.85938 22.0625C0.953125 20.1042 0 17.6667 0 14.75C0 12.6667 0.828125 10.401 2.48438 7.95312C4.14062 5.50521 6.64583 2.85417 10 0C13.3542 2.85417 15.8594 5.50521 17.5156 7.95312C19.1719 10.401 20 12.6667 20 14.75C20 17.6667 19.0469 20.1042 17.1406 22.0625C15.2344 24.0208 12.8542 25 10 25V25M6.25 20H13.75V17.5H6.25V20V20M8.75 16.25H11.25V13.75H13.75V11.25H11.25V8.75H8.75V11.25H6.25V13.75H8.75V16.25V16.25" fill="#93000B"/>
            </svg>
            <span className="font-extrabold text-2xl text-[#93000B] tracking-tight">LifeLine</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-8 items-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  to={link.href} 
                  className={`font-medium text-sm transition-colors py-2 ${isActive ? 'text-[#93000B] font-bold border-b-2 border-[#93000B]' : 'text-gray-600 hover:text-[#93000B]'}`}
                >
                  {link.labelKey}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <span>EN</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <Link to="/login" className="text-[#455F87] font-bold text-sm px-4 py-2 rounded-lg border border-transparent hover:bg-gray-50 transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-[#93000B] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#7F1D1D] shadow-sm transition-colors">
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute w-full bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  to={link.href} 
                  className={`block px-3 py-3 text-base font-medium rounded-md ${isActive ? 'text-[#93000B] bg-red-50 font-bold' : 'text-gray-700 hover:text-[#93000B] hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.labelKey}
                </Link>
              );
            })}
            <div className="h-px bg-gray-100 my-4"></div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-600 font-medium">Language</span>
              <button className="text-sm font-bold text-[#93000B]">EN / VI</button>
            </div>
            <div className="flex flex-col gap-3 px-3 mt-4">
              <Link to="/login" className="w-full text-center text-[#455F87] font-bold py-3 border border-[#455F87] rounded-xl">
                Login
              </Link>
              <Link to="/register" className="w-full text-center bg-[#93000B] text-white font-bold py-3 rounded-xl shadow-sm">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
