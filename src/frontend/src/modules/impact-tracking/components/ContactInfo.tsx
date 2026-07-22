import React from 'react';

interface ContactInfoProps {
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ isEditing, onEdit, onCancel, onSave }) => {
  if (isEditing) {
    return (
      <div className="flex p-6 flex-col items-start gap-4 rounded-lg border border-[#F1F3F5] bg-[#F8F9FA] w-full">
        <div className="flex pr-[0] justify-between items-center w-full">
          <div className="flex flex-col items-start w-fit">
            <p className="text-[#152A43] font-inter text-base font-bold leading-6 w-fit">
              Thông tin liên hệ
            </p>
          </div>
          <button className="cursor-pointer text-nowrap flex justify-center items-center w-[100px] h-[17px]">
            <p className="text-[#93000B] font-inter text-xs font-medium leading-[16.8px] w-[100px] h-[17px]">
              Đang chỉnh sửa...
            </p>
          </button>
        </div>
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Địa chỉ thường trú:</p>
            </div>
            <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
              <input type="text" defaultValue="12/18 Trịnh Định Trọng, Phường Tân Phú, Thành phố Hồ Chí Minh" className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" />
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Địa chỉ hiện nay:</p>
            </div>
            <div className="flex py-2.5 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
              <input type="text" placeholder="Nhập địa chỉ hiện nay" className="text-[#271816] font-inter text-sm w-full outline-none placeholder:text-[#6B7280]" />
            </div>
          </div>
          
          <div className="flex justify-center items-start gap-4 w-full">
            <div className="flex flex-col items-start gap-1 w-1/2">
              <div className="flex flex-col items-start w-full">
                <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Điện thoại di động:</p>
              </div>
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
                <input type="text" defaultValue="0395670040" className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" />
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 w-1/2">
              <div className="flex flex-col items-start w-full">
                <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Điện thoại bàn:</p>
              </div>
              <div className="flex py-2.5 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
                <input type="text" placeholder="Nhập số điện thoại bàn" className="text-[#271816] font-inter text-sm w-full outline-none placeholder:text-[#6B7280]" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Email:</p>
            </div>
            <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
              <input type="email" defaultValue="tanhkiet.2006@gmail.com" className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" />
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Nghề nghiệp:</p>
            </div>
            <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
              <input type="text" defaultValue="Sinh viên" className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" />
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-4 w-full pt-4 mt-2 border-t border-dashed border-[#3B82F6]">
            <button 
              onClick={onCancel}
              className="flex py-2 px-8 justify-center items-center rounded-lg border border-[#455F87] bg-white text-[#455F87] font-medium"
            >
              Hủy
            </button>
            <button 
              onClick={onSave}
              className="flex py-2 px-8 justify-center items-center rounded-lg bg-[#93000B] text-white font-medium shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10)]"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-lg border border-[#F1F3F5] bg-[#F8F9FA] w-full">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-[#152A43] font-inter text-base font-bold leading-6">Thông tin liên hệ</h3>
        {!isEditing && (
          <button onClick={onEdit} className="flex justify-center items-center gap-1 hover:underline">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333M0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0ZM9.33333 1.98333V1.98333L8.51667 1.16667V1.16667L9.33333 1.98333V1.98333M7.27708 3.22292L6.86875 2.8V2.8L7.7 3.63125V3.63125L7.27708 3.22292V3.22292" fill="#455F87"/>
            </svg>
            <span className="text-[#455F87] font-inter text-xs font-medium">Chỉnh sửa</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-[135px_1fr] gap-y-4 w-full text-sm">
        <span className="text-[#6C757D]">Địa chỉ thường trú:</span>
        <span className="text-[#271816] font-medium">12/16 Trịnh Đình Trọng, Phường Tân Phú, Thành phố Hồ Chí Minh</span>
        
        <span className="text-[#6C757D]">Địa chỉ hiện nay:</span>
        <span className="text-[#271816] font-medium">-</span>
        
        <span className="text-[#6C757D]">Điện thoại di động:</span>
        <span className="text-[#271816] font-medium">0395670040</span>
        
        <span className="text-[#6C757D]">Điện thoại bàn:</span>
        <span className="text-[#271816] font-medium">-</span>
        
        <span className="text-[#6C757D]">Email:</span>
        <span className="text-[#271816] font-medium">tanhkiet.2006@gmail.com</span>
        
        <span className="text-[#6C757D]">Nghề nghiệp:</span>
        <span className="text-[#271816] font-medium">Sinh viên</span>
      </div>
    </div>
  );
};
