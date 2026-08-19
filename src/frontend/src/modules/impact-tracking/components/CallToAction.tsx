import React from 'react';
import { Link } from 'react-router-dom';

interface CallToActionProps {
  status?: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({ status = 'Eligible Now' }) => {
  const isEligible = status === 'Eligible Now';

  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-xl bg-[#152A43] w-full text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)]">
      {isEligible ? (
        <>
          <h3 className="font-inter text-base font-bold leading-6">Ready to save lives?</h3>
          <p className="font-inter text-sm opacity-80 leading-[21px]">
            Your next donation eligibility is active. Book your slot now and earn an extra +50 XP bonus on successful check-in.
          </p>
          <Link to="/my-appointments/schedule/step-1" className="w-full">
            <button className="flex py-3 px-4 justify-center items-center gap-2 rounded-lg bg-[#93000B] w-full mt-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] hover:bg-[#7a0009] transition-colors">
              <span className="font-inter text-sm font-semibold">📅 Schedule Donation</span>
            </button>
          </Link>
        </>
      ) : (
        <>
          <h3 className="font-inter text-base font-bold leading-6">Rest and Recover</h3>
          <p className="font-inter text-sm opacity-80 leading-[21px]">
            Thank you for your recent donation! {status.replace('Eligible on', 'You will be eligible to donate again on')}. Take this time to rest before your next life-saving journey!
          </p>
        </>
      )}
    </div>
  );
};
