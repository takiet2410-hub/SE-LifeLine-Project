import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vnProvinces from '../../../data/vietnam_provinces.json';
import { Home, MapPin, Lock, KeyRound, ShieldCheck } from 'lucide-react';

interface ContactInfoProps {
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: (data: any) => void;
  user?: any;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ isEditing, onEdit, onCancel, onSave, user }) => {
  const navigate = useNavigate();

  const parseAddress = (addressStr: any) => {
    if (!addressStr) return { province: '', district: '', ward: '', street: '' };
    if (typeof addressStr === 'object') {
      return {
        province: addressStr.province || '',
        district: addressStr.district || '',
        ward: addressStr.ward || '',
        street: addressStr.street || ''
      };
    }
    const parts = String(addressStr).split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const province = parts[parts.length - 1];
      const districtAndWard = parts[parts.length - 2];

      if (parts.length >= 4) {
        return {
          province,
          district: parts[parts.length - 2],
          ward: parts[parts.length - 3],
          street: parts.slice(0, parts.length - 3).join(', ')
        };
      } else {
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

  const formatAddress = (addr: any) => {
    if (!addr) return '-';
    if (typeof addr === 'string') return addr;
    return `${addr.street || ''}, ${addr.ward || ''}, ${addr.province || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') || '-';
  };

  const permanentAddrVal = user?.permanentAddress || user?.address || 'Chưa có thông tin';
  const currentAddrVal = user?.currentAddress?.fullAddress || user?.currentAddress;

  const parsedCurr = parseAddress(currentAddrVal || permanentAddrVal);

  const initialFormData = {
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    occupation: user?.occupation || 'Sinh viên',
    currentAddress: {
      province: parsedCurr.province,
      district: parsedCurr.district,
      ward: parsedCurr.ward,
      street: parsedCurr.street
    },
    sameAsPermanent: !currentAddrVal || currentAddrVal === permanentAddrVal
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const pAddr = user?.permanentAddress || user?.address;
    const cAddr = user?.currentAddress?.fullAddress || user?.currentAddress;
    const cParsed = parseAddress(cAddr || pAddr);

    setFormData({
      phoneNumber: user?.phoneNumber || '',
      email: user?.email || '',
      occupation: user?.occupation || 'Sinh viên',
      currentAddress: {
        province: cParsed.province,
        district: cParsed.district,
        ward: cParsed.ward,
        street: cParsed.street
      },
      sameAsPermanent: !cAddr || cAddr === pAddr
    });
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrAddressChange = (field: string, value: string) => {
    setFormData(prev => {
      const newAddr = { ...prev.currentAddress, [field]: value };
      if (field === 'province') {
        newAddr.district = '';
        newAddr.ward = '';
      }
      if (field === 'district') {
        newAddr.ward = '';
      }
      return { ...prev, currentAddress: newAddr, sameAsPermanent: false };
    });
  };

  const handleToggleSameAddress = (checked: boolean) => {
    const pParsed = parseAddress(permanentAddrVal);
    setFormData(prev => ({
      ...prev,
      sameAsPermanent: checked,
      currentAddress: checked ? { ...pParsed } : prev.currentAddress
    }));
  };

  // Provinces & Districts for Current Address
  const currProvince = vnProvinces.find((p: any) => p.name === formData.currentAddress.province);
  const currDistricts = currProvince ? currProvince.districts : [];
  const currDistrict = currDistricts.find((d: any) => d.name === formData.currentAddress.district);
  const currWards = currDistrict ? currDistrict.wards : [];

  const handleSave = () => {
    if (onSave) {
      const payload: any = {
        phoneNumber: formData.phoneNumber,
        currentAddress: {
          province: formData.currentAddress.province || 'Chưa cập nhật',
          ward: (formData.currentAddress.district ? formData.currentAddress.district + ', ' : '') + (formData.currentAddress.ward || 'Chưa cập nhật'),
          street: formData.currentAddress.street || 'Chưa cập nhật'
        }
      };

      onSave(payload);
    }
  };

  const permDisplay = formatAddress(permanentAddrVal);
  const currDisplay = formatAddress(currentAddrVal);

  if (isEditing) {
    return (
      <div className="flex p-6 flex-col items-start gap-4 rounded-xl border border-[#F1F3F5] bg-[#F8F9FA] w-full">
        <div className="flex justify-between items-center w-full">
          <h3 className="text-[#152A43] font-inter text-base font-bold leading-6">
            Cập nhật nơi ở & Thông tin liên hệ
          </h3>
          <span className="text-[#93000B] text-xs font-medium">
            Đang chỉnh sửa...
          </span>
        </div>

        <div className="flex flex-col items-start gap-5 w-full">
          {/* Section 1: Permanent Address (CCCD - FIXED & READ-ONLY) */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl w-full space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-slate-500" />
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                  Địa chỉ thường trú (Theo CCCD):
                </label>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-semibold">
                <Lock className="w-3 h-3" /> Cố định theo CCCD
              </span>
            </div>

            <div className="py-2.5 px-3 rounded-lg bg-slate-100/90 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium">
              {permDisplay}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Địa chỉ thường trú được trích xuất trực tiếp từ mã QR thẻ CCCD khi đăng ký và không thể tự chỉnh sửa.
            </p>
          </div>

          {/* Section 2: Current Address (For SOS scanning - EDITABLE) */}
          <div className="p-4 bg-white border border-red-200 rounded-xl w-full space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <label className="text-[#271816] text-xs font-bold uppercase tracking-wider">
                  Địa chỉ nơi ở hiện tại (Tạm trú / Thuê trọ):
                </label>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-[#495057] cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={formData.sameAsPermanent}
                  onChange={(e) => handleToggleSameAddress(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#93000B] rounded cursor-pointer"
                />
                Trùng với địa chỉ thường trú
              </label>
            </div>

            <p className="text-[11px] text-[#6C757D] leading-tight">
              📍 <em>Hệ thống sẽ chuyển đổi địa chỉ này sang toạ độ GPS để quét và gửi thông báo hiến máu khẩn cấp SOS quanh nơi bạn đang ở.</em>
            </p>

            {!formData.sameAsPermanent && (
              <div className="space-y-2.5 animate-in fade-in duration-200 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-white">
                    <select
                      className="w-full text-xs sm:text-sm outline-none bg-transparent"
                      value={formData.currentAddress.province}
                      onChange={(e) => handleCurrAddressChange('province', e.target.value)}
                    >
                      <option value="">Chọn Tỉnh/TP</option>
                      {vnProvinces.map((p: any) => <option key={p.code} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-white">
                    <select
                      className="w-full text-xs sm:text-sm outline-none bg-transparent"
                      value={formData.currentAddress.district}
                      onChange={(e) => handleCurrAddressChange('district', e.target.value)}
                      disabled={!formData.currentAddress.province}
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {currDistricts.map((d: any) => <option key={d.code} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-white">
                    <select
                      className="w-full text-xs sm:text-sm outline-none bg-transparent"
                      value={formData.currentAddress.ward}
                      onChange={(e) => handleCurrAddressChange('ward', e.target.value)}
                      disabled={!formData.currentAddress.district}
                    >
                      <option value="">Chọn Phường/Xã</option>
                      {currWards.map((w: any) => <option key={w.code} value={w.name}>{w.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-white w-full">
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường nơi ở hiện tại (VD: 35 Huỳnh Tịnh Của)..."
                    value={formData.currentAddress.street}
                    onChange={(e) => handleCurrAddressChange('street', e.target.value)}
                    className="text-[#271816] text-xs sm:text-sm w-full outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-[#6C757D] text-xs font-semibold">Điện thoại di động:</label>
              <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-white">
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="text-[#271816] text-xs sm:text-sm w-full outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#6C757D] text-xs font-semibold">Email:</label>
              <div className="py-2 px-3 rounded-lg border border-[#CED4DA] bg-gray-100">
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="text-[#6C757D] text-xs sm:text-sm w-full outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4 w-full pt-4 border-t border-dashed border-[#DEE2E6]">
            <button
              onClick={onCancel}
              className="py-2 px-6 rounded-xl border border-[#CED4DA] bg-white text-[#495057] font-semibold text-xs sm:text-sm hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="py-2 px-8 rounded-xl bg-[#93000B] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[#7a0009] transition"
            >
              Lưu nơi ở & Cập nhật vị trí SOS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-xl border border-[#F1F3F5] bg-[#F8F9FA] w-full">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-[#152A43] font-inter text-base font-bold leading-6">Thông tin liên hệ & Địa chỉ</h3>
        {!isEditing && (
          <button onClick={onEdit} className="flex justify-center items-center gap-1 hover:underline text-[#93000B] cursor-pointer">
            <span className="text-xs font-semibold">Chỉnh sửa</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-[170px_1fr] gap-y-3.5 w-full text-xs sm:text-sm">
        <span className="text-[#6C757D] flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-[#6C757D]" />
          Địa chỉ thường trú:
        </span>
        <span className="text-[#271816] font-medium flex items-center gap-2">
          {permDisplay}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold border border-slate-200">
            CCCD
          </span>
        </span>

        <span className="text-[#6C757D] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Nơi ở hiện tại (quét SOS):
        </span>
        <span className="text-[#271816] font-semibold text-emerald-800">
          {currDisplay && currDisplay !== '-' ? currDisplay : `${permDisplay} (Mặc định thường trú)`}
        </span>

        <span className="text-[#6C757D]">Điện thoại di động:</span>
        <span className="text-[#271816] font-medium">{user?.phoneNumber || '-'}</span>

        <span className="text-[#6C757D]">Email:</span>
        <span className="text-[#271816] font-medium">{user?.email || '-'}</span>

        <span className="text-[#6C757D] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6C757D]" />
          Mật khẩu tài khoản:
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[#271816] font-medium tracking-widest text-xs">••••••••</span>
          <button
            type="button"
            onClick={() => {
              navigate('/forgot-password', {
                state: {
                  email: user?.email || '',
                  idDocumentNumber: user?.idDocumentNumber || ''
                }
              });
            }}
            className="text-xs font-semibold text-[#93000B] hover:underline cursor-pointer flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors active:scale-95"
            title="Đặt lại mật khẩu"
          >
            <KeyRound className="w-3 h-3" />
            <span>Đặt lại mật khẩu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
