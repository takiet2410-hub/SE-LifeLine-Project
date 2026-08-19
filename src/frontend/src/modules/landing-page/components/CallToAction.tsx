import React from 'react';
import { Link } from 'react-router-dom';

export const CallToAction: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 lg:px-12 bg-[#FCF9F9] flex justify-center">
      <div className="w-full max-w-[1280px] rounded-3xl bg-[#B91C1C] shadow-2xl p-10 lg:p-16 flex flex-col md:flex-row items-center justify-between text-left relative overflow-hidden">
        
        <div className="z-10 mb-8 md:mb-0">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
            Ready to save a life?
          </h2>
          <p className="text-[#FEE2E2] text-lg font-medium">
            Join 50,000+ donors making an impact every day.
          </p>
        </div>
        
        <div className="z-10 shrink-0">
          <Link to="/register" className="inline-block bg-white text-[#B91C1C] font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition transform hover:-translate-y-1">
            Sign Up Now
          </Link>
        </div>
      </div>
    </section>
  );
};
