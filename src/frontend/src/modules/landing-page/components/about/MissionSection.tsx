import React from 'react';
import { useNavigate } from 'react-router-dom';

export const MissionSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-[#FCF9F9] py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 flex flex-col items-start text-left">
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#FEE2E2] text-[#93000B] text-xs font-bold mb-6 tracking-widest uppercase">
            OUR MISSION
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2D3748] mb-6 leading-tight">
            Every Drop Counts
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
            LifeLine is Vietnam's leading digital platform for blood donation management, bridging the gap between donors and hospitals to ensure no one has to wait for life-saving treatment.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-[#93000B] hover:bg-[#7F1D1D] text-white font-bold py-3.5 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Join Our Network
          </button>
        </div>
        <div className="flex-1 w-full">
          <div className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] w-full">
             <img src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=1000" alt="Doctors" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};
