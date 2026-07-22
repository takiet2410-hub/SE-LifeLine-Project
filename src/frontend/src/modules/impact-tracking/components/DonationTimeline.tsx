import React from 'react';

export const DonationTimeline: React.FC = () => {
  const events = [
    { title: 'Regular Whole Blood Donation', desc: 'Da Nang General Hospital', date: 'Mar 15, 2024', status: 'Completed', type: 'blood', color: 'border-[#93000B]', bg: 'bg-[rgba(22,163,74,0.10)]', text: 'text-[#16A34A]' },
    { title: 'Silver Rank Achievement', desc: 'Milestone: 10 Successful Donations', date: 'Jan 02, 2024', status: 'Awarded', type: 'badge', color: 'border-[#CED4DA]', bg: 'bg-[rgba(59,130,246,0.10)]', text: 'text-[#3B82F6]' },
    { title: '1st Donation Anniversary', desc: 'Commemorative Badge Received', date: 'Jun 12, 2023', status: '', type: 'anniversary', color: 'border-[#CED4DA]', bg: '', text: '' },
    { title: 'Initial Enrollment & First Drop', desc: 'Welcome to LifeLine Community', date: 'Jun 12, 2023', status: '', type: 'start', color: 'border-[#B91C1C]', bg: '', text: '' }
  ];

  return (
    <div className="flex flex-col items-start p-6 gap-8 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">Donation Timeline</h2>
        <button className="text-[#93000B] font-inter text-sm font-semibold hover:underline">View Full History</button>
      </div>
      
      <div className="flex pl-8 flex-col items-start gap-12 w-full relative">
        <div className="absolute left-[11px] top-2 bg-[#DEE2E6] w-0.5 h-[calc(100%-24px)]"></div>
        
        {events.map((evt, idx) => (
          <div key={idx} className="flex flex-col items-start w-full relative">
            <div className="flex justify-between items-start w-full">
              <div className="flex flex-col items-start">
                <p className="text-[#271816] font-inter text-base leading-6">{evt.title}</p>
                <p className="text-[#6C757D] font-inter text-sm leading-[21px]">{evt.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-[#271816] font-inter text-base font-bold leading-6">{evt.date}</p>
                {evt.status && (
                  <div className={`flex py-0.5 px-2 justify-end items-start rounded ${evt.bg}`}>
                    <p className={`font-inter text-xs font-medium leading-[16.8px] ${evt.text}`}>{evt.status}</p>
                  </div>
                )}
              </div>
            </div>
            <div className={`absolute -left-[30px] top-1 rounded-full border-4 bg-[#FFF] w-6 h-6 ${evt.color}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
