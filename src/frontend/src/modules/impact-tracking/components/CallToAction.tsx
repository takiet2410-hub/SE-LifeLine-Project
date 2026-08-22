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
          <h3 className="font-inter text-base font-bold leading-6">Sẵn sàng cứu sống người bệnh?</h3>
          <p className="font-inter text-sm opacity-80 leading-[21px]">
            Bạn hiện đã đủ điều kiện hiến máu đợt tiếp theo. Hãy đặt lịch hẹn ngay để lan tỏa sự sống và nhận điểm thưởng cống hiến!
          </p>
          <Link to="/my-appointments/schedule/step-1" className="w-full">
            <button className="flex py-3 px-4 justify-center items-center gap-2 rounded-lg bg-[#93000B] w-full mt-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)] hover:bg-[#7a0009] transition-colors cursor-pointer">
              <span className="font-inter text-sm font-semibold">📅 Đặt Lịch Hiến Máu Ngay</span>
            </button>
          </Link>
        </>
      ) : (
        <>
          <h3 className="font-inter text-base font-bold leading-6">Nghỉ ngơi & Phục hồi sức khỏe</h3>
          <p className="font-inter text-sm opacity-80 leading-[21px]">
            Cảm ơn bạn vì nghĩa cử hiến máu cao đẹp vừa qua! {status.replace('Eligible on', 'Bạn sẽ đủ điều kiện hiến máu lại vào ngày')}. Hãy nghỉ ngơi và ăn uống bồi bổ nhé!
          </p>
        </>
      )}
    </div>
  );
};
