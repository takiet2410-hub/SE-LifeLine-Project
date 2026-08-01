import React from 'react';
import { Link } from 'react-router-dom';

export const CTASection: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 lg:px-12 bg-white flex justify-center">
      <div className="w-full max-w-[1024px] rounded-[32px] bg-[#7F1D1D] shadow-2xl p-12 lg:p-20 flex flex-col items-center text-center gap-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        <h2 className="text-4xl lg:text-5xl font-bold text-white z-10">
          Ready to Make a Difference?
        </h2>
        
        <p className="text-[#FEE2E2] text-lg max-w-2xl leading-relaxed z-10">
          Join 50,000+ active donors across Vietnam. Your single donation
          can save up to 3 lives. Be the hero someone is waiting for today.
        </p>
        
        <div className="z-10 mt-4">
          <Link to="/register" className="inline-block bg-white text-[#7F1D1D] font-extrabold text-xl lg:text-[22px] px-10 py-5 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition transform hover:-translate-y-1">
            Sign Up Now
          </Link>
        </div>
      </div>
    </section>
  );
};
