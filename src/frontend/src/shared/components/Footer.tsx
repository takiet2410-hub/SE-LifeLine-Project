import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#1A1A2E] text-white py-16 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        {/* Brand */}
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2">
            <svg width="20" height="25" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 25C7.14583 25 4.76562 24.0208 2.85938 22.0625C0.953125 20.1042 0 17.6667 0 14.75C0 12.6667 0.828125 10.401 2.48438 7.95312C4.14062 5.50521 6.64583 2.85417 10 0C13.3542 2.85417 15.8594 5.50521 17.5156 7.95312C19.1719 10.401 20 12.6667 20 14.75C20 17.6667 19.0469 20.1042 17.1406 22.0625C15.2344 24.0208 12.8542 25 10 25V25M6.25 20H13.75V17.5H6.25V20V20M8.75 16.25H11.25V13.75H13.75V11.25H11.25V8.75H8.75V11.25H6.25V13.75H8.75V16.25V16.25" fill="#93000B"/>
            </svg>
            <span className="font-extrabold text-[22px] tracking-tight">LifeLine</span>
          </div>
          <p className="text-[#8E8EA0] text-base leading-relaxed">
            The leading platform for blood donation management in Vietnam.
            Connecting donors with hospitals through technology and compassion.
          </p>
          {/* Social Icons Placeholder */}
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/profile.php?id=61592481823429"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#16213E] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition"
            >
               <span className="text-white text-xs">FB</span>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-6">
          <h4 className="font-bold text-base text-white">Quick Links</h4>
          <ul className="flex flex-col gap-4 text-[#8E8EA0] text-base">
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
            <li><Link to="/find-locations" className="hover:text-white transition">Find Locations</Link></li>
            <li><Link to="/health-tips" className="hover:text-white transition">Health Tips</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-6">
          <h4 className="font-bold text-base text-white">Resources</h4>
          <ul className="flex flex-col gap-4 text-[#8E8EA0] text-base">
            <li><Link to="/eligibility" className="hover:text-white transition">Eligibility Requirements</Link></li>
            <li><Link to="/tips" className="hover:text-white transition">Pre-donation Tips</Link></li>
            <li><Link to="/care" className="hover:text-white transition">Post-donation Care</Link></li>
            <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-6">
          <h4 className="font-bold text-base text-white">Contact</h4>
          <ul className="flex flex-col gap-4 text-[#8E8EA0] text-base">
            <li className="flex items-start gap-3">
              <span className="mt-1">📍</span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=123+Nguyen+Van+Linh,+District+7,+Ho+Chi+Minh+City,+Vietnam"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition cursor-pointer"
              >
                123 Nguyen Van Linh, District 7<br />Ho Chi Minh City, Vietnam
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span>📞</span>
              <span>1900 1234 567</span>
            </li>
            <li className="flex items-center gap-3">
              <span>✉️</span>
              <span>support@lifeline.vn</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto mt-16 pt-8 border-t border-[#2A2A3E] flex flex-col md:flex-row justify-between items-center gap-4 text-[#8E8EA0] text-sm">
        <p>© 2026 LifeLine. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};
