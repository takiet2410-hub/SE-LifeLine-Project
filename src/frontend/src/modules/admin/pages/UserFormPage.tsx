import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { ArrowLeft, Save, Shield, User, Building2, Hospital } from 'lucide-react';
import { toast } from 'sonner';

export const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const isEdit = !!userId;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idDocumentNumber, setIdDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [roles, setRoles] = useState<('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[]>(['Donor']);
  const [accountStatus, setAccountStatus] = useState<'PendingVerification' | 'Active' | 'Suspended'>('Active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && userId) {
      adminApi.getUsers({ search: userId }).then((res) => {
        const u = res.items.find((item) => item.id === userId);
        if (u) {
          setFullName(u.fullName);
          setEmail(u.email);
          setPhone(u.phone !== 'N/A' ? u.phone : '');
          setIdDocumentNumber(u.idDocumentNumber);
          setRoles(u.roles && u.roles.length > 0 ? u.roles : u.role ? [u.role] : ['Donor']);
          setAccountStatus(u.accountStatus);
          if ((u as any).permanentAddress) setPermanentAddress((u as any).permanentAddress);
          if ((u as any).currentAddress) {
            const c = (u as any).currentAddress;
            setCurrentAddress(typeof c === 'object' ? c.fullAddress || '' : c);
          }
        }
      });
    }
  }, [isEdit, userId]);

  const handleToggleRole = (roleId: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator') => {
    setRoles((prev) => {
      const isCurrentlySelected = prev.includes(roleId);
      if (isCurrentlySelected) {
        if (prev.length === 1) {
          toast.warning('Tài khoản phải có ít nhất một vai trò (role).');
          return prev;
        }
        return prev.filter((r) => r !== roleId);
      } else {
        if (roleId === 'Donor') {
          return [...prev, 'Donor'];
        } else {
          // If selecting a management role (BloodCenterStaff, HospitalStaff, Administrator),
          // replace any existing management role with the newly selected one.
          const hasDonor = prev.includes('Donor');
          const oldManagementRole = prev.find((r) => r !== 'Donor');
          if (oldManagementRole) {
            toast.info(`Mỗi tài khoản chỉ giữ 1 vai trò quản lý. Đã đổi từ ${oldManagementRole} sang ${roleId}.`);
          }
          return hasDonor ? ['Donor', roleId] : [roleId];
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một vai trò.');
      return;
    }
    const managementCount = roles.filter((r) => r !== 'Donor').length;
    if (managementCount > 1) {
      toast.error('Một tài khoản chỉ có thể giữ tối đa 1 vai trò quản lý (BloodCenterStaff, HospitalStaff, hoặc Administrator) kết hợp với Donor.');
      return;
    }
    try {
      setSubmitting(true);
      let primaryRole: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator' = 'Donor';
      if (roles.includes('Administrator')) primaryRole = 'Administrator';
      else if (roles.includes('BloodCenterStaff')) primaryRole = 'BloodCenterStaff';
      else if (roles.includes('HospitalStaff')) primaryRole = 'HospitalStaff';

      if (isEdit && userId) {
        await adminApi.updateUser(userId, {
          fullName,
          email,
          phone,
          role: primaryRole,
          roles,
          accountStatus,
          permanentAddress,
          currentAddress,
        });
        toast.success('User account updated successfully.');
      } else {
        await adminApi.createUser({
          fullName,
          email,
          phone,
          idDocumentNumber,
          password,
          role: primaryRole,
          roles,
          permanentAddress,
          currentAddress,
        });
        toast.success('User account created successfully.');
      }
      navigate('/admin/users');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 text-[#6c757d] hover:text-[#271816] rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#271816]">
            {isEdit ? 'Edit Account Details' : 'Create New Account'}
          </h1>
          <p className="text-sm font-medium text-[#6c757d]">Configure credentials & assign system roles (AD-UC-02)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-6">
        {/* Role Checkbox Cards */}
        <div>
          <label className="block text-sm font-bold text-[#271816] mb-1">
            Select Account Roles & Permissions (Có thể chọn nhiều role)
          </label>
          <p className="text-xs text-[#6c757d] mb-3">
            Lưu ý: 1 tài khoản có thể có vai trò Donor + 1 vai trò Cán bộ/Quản trị (Blood Center Staff, Hospital Staff, hoặc Admin).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'Donor',
                label: 'Donor (Voluntary)',
                desc: 'Access donor app, map, appointment booking & emergency SOS alerts.',
                icon: User,
              },
              {
                id: 'BloodCenterStaff',
                label: 'Blood Center Staff',
                desc: 'Manage donation campaigns, donor registrations, and blood bag inventory.',
                icon: Building2,
              },
              {
                id: 'HospitalStaff',
                label: 'Hospital Staff',
                desc: 'Create emergency SOS blood requests and monitor fulfillment tracking.',
                icon: Hospital,
              },
              {
                id: 'Administrator',
                label: 'Administrator',
                desc: 'Full access to user management, system configs, feature toggles & activity logs.',
                icon: Shield,
              },
            ].map((r) => {
              const IconComp = r.icon;
              const isSelected = roles.includes(r.id as any);
              return (
                <div
                  key={r.id}
                  onClick={() => handleToggleRole(r.id as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 relative ${
                    isSelected
                      ? 'border-[#93000b] bg-red-50/50'
                      : 'border-[#f1f3f5] hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#93000b] text-white' : 'bg-slate-100 text-[#6c757d]'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[#271816]">{r.label}</div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div onClick
                        className="w-4 h-4 accent-[#93000b] rounded cursor-pointer"
                      />
                    </div>
                    <div className="text-xs text-[#5b403d] font-medium mt-1 leading-snug">{r.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Full Name {isEdit ? <span className="text-[#6c757d] font-normal">(Optional)</span> : '*'}
            </label>
            <input
              type="text"
              required={!isEdit}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Email Address {isEdit ? <span className="text-[#6c757d] font-normal">(Optional)</span> : '*'}
            </label>
            <input
              type="email"
              required={!isEdit}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              ID Document Number (CCCD) {isEdit ? <span className="text-[#6c757d] font-normal">(Fixed)</span> : '*'}
            </label>
            <input
              type="text"
              required={!isEdit}
              disabled={isEdit}
              value={idDocumentNumber}
              onChange={(e) => setIdDocumentNumber(e.target.value)}
              placeholder="012345678901"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Phone Number <span className="text-[#6c757d] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Permanent Address (Thường trú theo CCCD) {isEdit ? <span className="text-[#6c757d] font-normal">(Fixed theo CCCD)</span> : ''}
            </label>
            <input
              type="text"
              disabled={isEdit}
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              placeholder="e.g. 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1 flex items-center justify-between">
              <span>Current Residential Address (Nơi ở hiện tại)</span>
              <span className="text-[10px] text-emerald-700 font-medium font-mono">📍 Quét toạ độ SOS</span>
            </label>
            <input
              type="text"
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              placeholder="e.g. 45 Hoàng Hoa Thám, Phường 13, Tân Bình, TP.HCM"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#271816] mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required={!isEdit}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
              />
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-xs font-bold text-[#271816] mb-1">
                Account Status
              </label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
              >
                <option value="Active" className="bg-white text-[#271816]">Active</option>
                <option value="Suspended" className="bg-white text-[#271816]">Suspended</option>
                <option value="PendingVerification" className="bg-white text-[#271816]">Pending Verification</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1f3f5]">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 text-sm font-semibold text-[#6c757d] hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#93000b] hover:bg-[#780009] text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </form>
    </div>
  );
};
