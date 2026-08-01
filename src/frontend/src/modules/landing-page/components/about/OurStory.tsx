import React from 'react';

export const OurStory: React.FC = () => {
  return (
    <section className="bg-[#FCF9F9] py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 w-full">
          <div className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] w-full">
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" alt="App interface" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-start text-left">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#2D3748] mb-6">
            Our Story
          </h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>Founded in 2024, LifeLine began with a simple goal: to modernize blood donation in Vietnam. We saw the challenges of emergency blood needs—the frantic social media appeals and the stress on families.</p>
            <p>We decided to build a technology-driven solution that makes donating blood easier, more transparent, and more rewarding. By integrating hospital logistics with a donor-first mobile experience, we're building a resilient network for the future.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
