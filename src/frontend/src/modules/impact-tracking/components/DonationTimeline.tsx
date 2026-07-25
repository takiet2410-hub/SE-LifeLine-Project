import React, { useState, useEffect } from 'react';
import { fetchAppointments, type Appointment } from '../../booking-location/api/bookingApi';

interface DonationTimelineProps {
  userId?: string;
}

export const DonationTimeline: React.FC<DonationTimelineProps> = ({ userId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await fetchAppointments();
        if (res.success && res.data) {
          const completed = res.data.filter(a => a.status === 'completed');
          completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAppointments(completed);
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId]);

  return (
    <div className="flex flex-col items-start p-6 gap-8 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">Donation Timeline</h2>
        {appointments.length > 0 && (
          <button className="text-[#93000B] font-inter text-sm font-semibold hover:underline">View Full History</button>
        )}
      </div>
      
      <div className="flex pl-8 flex-col items-start gap-12 w-full relative min-h-[100px]">
        {isLoading ? (
          <p className="text-[#6C757D] text-sm py-4">Đang tải lịch sử...</p>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col w-full h-full justify-center items-start -ml-4">
            <p className="text-[#6C757D] font-inter text-sm italic">Bạn chưa có lịch sử hiến máu nào được ghi nhận.</p>
          </div>
        ) : (
          <>
            <div className="absolute left-[11px] top-2 bg-[#DEE2E6] w-0.5 h-[calc(100%-24px)]"></div>
            {appointments.map((evt, idx) => {
              const formattedDate = new Date(evt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              return (
                <div key={idx} className="flex flex-col items-start w-full relative">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col items-start">
                      <p className="text-[#271816] font-inter text-base leading-6">Regular Whole Blood Donation</p>
                      <p className="text-[#6C757D] font-inter text-sm leading-[21px]">{evt.locationName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[#271816] font-inter text-base font-bold leading-6">{formattedDate}</p>
                      <div className={`flex py-0.5 px-2 justify-end items-start rounded bg-[rgba(22,163,74,0.10)]`}>
                        <p className={`font-inter text-xs font-medium leading-[16.8px] text-[#16A34A]`}>Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className={`absolute -left-[30px] top-1 rounded-full border-4 bg-[#FFF] w-6 h-6 border-[#93000B]`}></div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
