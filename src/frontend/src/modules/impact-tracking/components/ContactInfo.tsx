import React, { useState, useEffect } from 'react';
import { getDirtyPayload } from '../../../shared/utils/formUtils';
import vnProvinces from '../../../data/vietnam_provinces.json';

interface ContactInfoProps {
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: (data: any) => void;
  user?: any;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ isEditing, onEdit, onCancel, onSave, user }) => {
  // Parse address string into components if it's a string
  const parseAddress = (addressStr: string) => {
    if (!addressStr) return { province: '', district: '', ward: '', street: '' };
    const parts = addressStr.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const province = parts[parts.length - 1];
      const districtAndWard = parts[parts.length - 2];

      
      let district = '';
      let ward = '';
      
      if (parts.length >= 4) {
        // e.g. Street, Ward, District, Province
        district = parts[parts.length - 2];
        ward = parts[parts.length - 3];
        return {
          province,
          district,
          ward,
          street: parts.slice(0, parts.length - 3).join(', ')
        };
      } else {
        // Fallback for 3 parts: Street, Ward/District, Province
        return {
          province,
          district: '',
          ward: districtAndWard,
          street: parts.slice(0, parts.length - 2).join(', ')
        };
      }
    }
    return { province: '', district: '', ward: '', street: addressStr };
  };

  const addrVal = user?.address || user?.permanentAddress;
  const parsedAddr = typeof addrVal === 'string' ? parseAddress(addrVal) : {
    province: addrVal?.province || '',
    district: '',
    ward: addrVal?.ward || '',
    street: addrVal?.street || ''
  };

  const initialFormData = {
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    occupation: user?.occupation || 'Sinh viên',
    permanentAddress: {
      province: parsedAddr.province,
      district: parsedAddr.district,
      ward: parsedAddr.ward,
      street: parsedAddr.street
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [originalData, setOriginalData] = useState(initialFormData);

  // Update form data when user prop changes
  useEffect(() => {
    const currentAddrVal = user?.address || user?.permanentAddress;
    const currentParsedAddr = typeof currentAddrVal === 'string' ? parseAddress(currentAddrVal) : {
      province: currentAddrVal?.province || '',
      district: '',
      ward: currentAddrVal?.ward || '',
      street: currentAddrVal?.street || ''
    };

    const newData = {
      phoneNumber: user?.phoneNumber || '',
      email: user?.email || '',
      occupation: user?.occupation || 'Sinh viên',
      permanentAddress: {
        province: currentParsedAddr.province,
        district: currentParsedAddr.district,
        ward: currentParsedAddr.ward,
        street: currentParsedAddr.street
      }
    };
    setFormData(newData);
    setOriginalData(newData);
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => {
      const newAddr = { ...prev.permanentAddress, [field]: value };
      if (field === 'province') {
        newAddr.district = '';
        newAddr.ward = '';
      }
      if (field === 'district') {
        newAddr.ward = '';
      }
      return { ...prev, permanentAddress: newAddr };
    });
  };

  const selectedProvince = vnProvinces.find((p: any) => p.name === formData.permanentAddress.province);
  const selectedDistrict = selectedProvince?.districts.find((d: any) => d.name === formData.permanentAddress.district);

  const availableProvinces = vnProvinces;
  const availableDistricts = selectedProvince ? selectedProvince.districts : [];
  const availableWards = selectedDistrict ? selectedDistrict.wards : [];

  const handleSave = () => {
    if (onSave) {
      // Use getDirtyPayload to only send changed fields (Dynamic Payload pattern)
      const dirtyPayload = getDirtyPayload({}, formData, originalData);
      
      // Map back to BE schema - only include changed fields
      const payload: any = {};
      
      if (dirtyPayload.phoneNumber !== undefined) {
        payload.phoneNumber = dirtyPayload.phoneNumber;
      }
      if (dirtyPayload.email !== undefined) {
        payload.email = dirtyPayload.email;
      }
      if (dirtyPayload.permanentAddress !== undefined) {
        const addr = dirtyPayload.permanentAddress;
        payload.permanentAddress = {
          province: addr.province || 'Chưa cập nhật',
          ward: (addr.district ? addr.district + ', ' : '') + (addr.ward || 'Chưa cập nhật'),
          street: addr.street || 'Chưa cập nhật'
        };
      }
      
      // Only call onSave if there are actual changes
      if (Object.keys(payload).length > 0) {
        onSave(payload);
      } else {
        if (onCancel) onCancel();
      }
    }
  };

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
            <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Địa chỉ thường trú:</p>
            
            <div className="flex gap-2 w-full">
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-1/3">
                <select 
                  className="w-full text-sm outline-none bg-transparent"
                  value={formData.permanentAddress.province}
                  onChange={(e) => handleAddressChange('province', e.target.value)}
                >
                  <option value="">Chọn Tỉnh/TP</option>
                  {availableProvinces.map((p: any) => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-1/3">
                <select 
                  className="w-full text-sm outline-none bg-transparent"
                  value={formData.permanentAddress.district}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  disabled={!formData.permanentAddress.province}
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {availableDistricts.map((d: any) => <option key={d.code} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-1/3">
                <select 
                  className="w-full text-sm outline-none bg-transparent"
                  value={formData.permanentAddress.ward}
                  onChange={(e) => handleAddressChange('ward', e.target.value)}
                  disabled={!formData.permanentAddress.district}
                >
                  <option value="">Chọn Phường/Xã</option>
                  {availableWards.map((w: any) => <option key={w.code} value={w.name}>{w.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex mt-1 py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
              <input 
                type="text" 
                placeholder="Số nhà, tên đường..." 
                value={formData.permanentAddress.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" 
              />
            </div>
          </div>
          
          <div className="flex justify-center items-start gap-4 w-full mt-2">
            <div className="flex flex-col items-start gap-1 w-1/2">
              <div className="flex flex-col items-start w-full">
                <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Điện thoại di động:</p>
              </div>
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden">
                <input 
                  type="text" 
                  value={formData.phoneNumber} 
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none" 
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 w-1/2">
              <div className="flex flex-col items-start w-full">
                <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Điện thoại bàn:</p>
              </div>
              <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden bg-gray-100">
                <input type="text" disabled placeholder="Không hỗ trợ đổi" className="text-[#271816] font-inter text-sm w-full outline-none bg-transparent" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-1 w-full mt-2">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4 w-full">Email:</p>
            </div>
            <div className="flex py-2 px-3 justify-center items-start rounded-lg border border-[#CED4DA] bg-[#FFF] w-full overflow-hidden bg-gray-100">
              <input type="email" disabled value={formData.email} className="text-[#271816] font-inter text-sm leading-[21px] w-full outline-none bg-transparent" />
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
              onClick={handleSave}
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
        <span className="text-[#271816] font-medium">{
          (() => {
            const addr = user?.address || user?.permanentAddress;
            if (!addr) return '-';
            if (typeof addr === 'string') return addr;
            return `${addr.street || ''}, ${addr.ward || ''}, ${addr.province || ''}`.replace(/^[,\s]+|[,\s]+$/g, '');
          })()
        }</span>
        
        <span className="text-[#6C757D]">Điện thoại di động:</span>
        <span className="text-[#271816] font-medium">{user?.phoneNumber || '-'}</span>
        
        <span className="text-[#6C757D]">Email:</span>
        <span className="text-[#271816] font-medium">{user?.email || '-'}</span>
      </div>
    </div>
  );
};
