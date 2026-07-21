import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Mail, Phone } from 'lucide-react';

export const AuthFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-[#f1f3f5] mt-auto">
      <div className="max-w-[1280px] mx-auto px-8 py-8 md:py-10">
        {/* Top 4-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Column 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#93000b] rounded flex items-center justify-center">
                <HeartHandshake className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[16px] font-bold text-[#93000b]">
                LifeLine
              </span>
            </div>
            <p className="text-[12px] font-medium text-[#6c757d] leading-[18px]">
              Connecting donors with those in need. Every drop counts towards
              saving a life in our community.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#271816] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-[13px] font-medium text-[#5b403d]">
              <li>
                <Link to="/about" className="hover:text-[#93000b] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#93000b] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-[#93000b] transition-colors">
                  Find Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#271816] uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-[13px] font-medium text-[#5b403d]">
              <li>
                <Link to="/health-tips" className="hover:text-[#93000b] transition-colors">
                  Health Tips
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="hover:text-[#93000b] transition-colors">
                  Donor Eligibility
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#93000b] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#271816] uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-2 text-[13px] font-medium text-[#5b403d]">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#93000b]" />
                <span>support@lifeline.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#93000b]" />
                <span>+84 (0) 123 456 789</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-[#f1f3f5] flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-[#a3a3a3]">
          <p>© 2024 LifeLine Vietnam. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#5b403d] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#5b403d] transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-[#5b403d] transition-colors">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
