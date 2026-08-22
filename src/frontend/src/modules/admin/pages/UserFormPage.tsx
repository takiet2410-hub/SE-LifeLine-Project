import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { ArrowLeft, Save, Shield, User, Building2, Hospital } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffOrganizationOption } from '../types/admin.types';

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
  const [hospitalId, setHospitalId] = useState('');
  const [bloodCenterId, setBloodCenterId] = useState('');
  const [hospitals, setHospitals] = useState<StaffOrganizationOption[]>([]);
  const [bloodCenters, setBloodCenters] = useState<StaffOrganizationOption[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [accountStatus, setAccountStatus] = useState<'PendingVerification' | 'Active' | 'Suspended'>('Active');
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(isEdit);

  useEffect(() => {
    if (isEdit && userId) {
      adminApi.getUserById(userId)
        .then((u) => {
          setFullName(u.fullName);
          setEmail(u.email);
          setPhone(u.phone !== 'N/A' ? u.phone : '');
          setIdDocumentNumber(u.idDocumentNumber);
          const persistedRoles = u.roles && u.roles.length > 0 ? u.roles : u.role ? [u.role] : [];
          setRoles(Array.from(new Set(['Donor', ...persistedRoles])) as typeof roles);
          setAccountStatus(u.accountStatus);
          setPermanentAddress(u.permanentAddress || '');
          setCurrentAddress(u.currentAddress || '');
          setHospitalId(u.hospitalId || '');
          setBloodCenterId(u.bloodCenterId || '');
        })
        .catch(() => {
          toast.error('Không thể tải thông tin tài khoản.');
          navigate('/admin/users');
        })
        .finally(() => setLoadingUser(false));
    }
  }, [isEdit, navigate, userId]);

  useEffect(() => {
    Promise.all([adminApi.getHospitals(), adminApi.getBloodCenters()])
      .then(([hospitalItems, bloodCenterItems]) => {
        setHospitals(hospitalItems);
        setBloodCenters(bloodCenterItems);
      })
      .catch(() => toast.error('Không thể tải danh sách bệnh viện và trung tâm máu.'))
      .finally(() => setLoadingOrganizations(false));
  }, []);

  const handleToggleRole = (roleId: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator') => {
    if (roleId === 'Donor') {
      toast.info('Donor là vai trò nền tảng bắt buộc và không thể bỏ chọn.');
      return;
    }

    const isCurrentlySelected = roles.includes(roleId);
    if (isCurrentlySelected) {
      if (roles.length === 1) {
        toast.warning('Tài khoản phải có ít nhất một vai trò (role).');
        return;
      }
      setRoles(roles.filter((role) => role !== roleId));
      if (roleId === 'HospitalStaff') setHospitalId('');
      if (roleId === 'BloodCenterStaff') setBloodCenterId('');
      return;
    }

    const oldManagementRole = roles.find((role) => role !== 'Donor');
    if (oldManagementRole) {
      toast.info(`Mỗi tài khoản chỉ giữ 1 vai trò quản lý. Đã đổi từ ${oldManagementRole} sang ${roleId}.`);
    }

    if (roleId === 'HospitalStaff') setBloodCenterId('');
    if (roleId === 'BloodCenterStaff') setHospitalId('');
    if (roleId === 'Administrator') {
      setHospitalId('');
      setBloodCenterId('');
    }
    setRoles(['Donor', roleId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roles.includes('Donor')) {
      toast.error('Mọi tài khoản phải giữ vai trò Donor nền tảng.');
      return;
    }
    const managementCount = roles.filter((r) => r !== 'Donor').length;
    if (managementCount > 1) {
      toast.error('Một tài khoản chỉ có thể giữ tối đa 1 vai trò quản lý (BloodCenterStaff, HospitalStaff, hoặc Administrator) kết hợp với Donor.');
      return;
    }
    if (roles.includes('HospitalStaff') && !hospitalId) {
      toast.error('Vui lòng chọn bệnh viện công tác trước khi cấp quyền Hospital Staff.');
      return;
    }
    if (roles.includes('BloodCenterStaff') && !bloodCenterId) {
      toast.error('Vui lòng chọn trung tâm máu công tác trước khi cấp quyền Blood Center Staff.');
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
          email,
          phone,
          role: primaryRole,
          roles,
          accountStatus,
          currentAddress,
          ...(primaryRole === 'HospitalStaff' ? { hospitalId } : {}),
          ...(primaryRole === 'BloodCenterStaff' ? { bloodCenterId } : {}),
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
          ...(primaryRole === 'HospitalStaff' ? { hospitalId } : {}),
          ...(primaryRole === 'BloodCenterStaff' ? { bloodCenterId } : {}),
        });
        toast.success('User account created successfully.');
      }
      navigate('/admin/users');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiError.response?.data?.message || apiError.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 text-[#6c757d] hover:text-[#271816] rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#271816]">
            {isEdit ? 'Chỉnh Sửa Thông Tin Tài Khoản' : 'Tạo Tài Khoản Người Dùng Mới'}
          </h1>
          <p className="text-sm font-medium text-[#6c757d]">Cấu hình thông tin xác thực & phân quyền vai trò hệ thống</p>
        </div>
      </div>

      {loadingUser ? (
        <div className="bg-white p-12 rounded-2xl border border-[#f1f3f5] text-center text-slate-500">
          Đang tải thông tin tài khoản...
        </div>
      ) : <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-6">
        {/* Role Checkbox Cards */}
        <div>
          <label className="block text-sm font-bold text-[#271816] mb-1">
            Chọn vai trò & quyền hạn tài khoản (Có thể chọn nhiều role)
          </label>
          <p className="text-xs text-[#6c757d] mb-3">
            {isEdit
              ? 'Donor là vai trò nền tảng bắt buộc. Admin chỉ có thể cấp thêm tối đa 1 vai trò công tác.'
              : 'Tài khoản mới luôn bắt đầu là Donor. Hãy lưu tài khoản trước, sau đó mở Chỉnh sửa để xét cấp vai trò công tác.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'Donor',
                label: 'Người hiến máu (Donor)',
                desc: 'Truy cập cổng hiến máu, bản đồ, đặt lịch hẹn và nhận cảnh báo SOS khẩn cấp.',
                icon: User,
              },
              {
                id: 'BloodCenterStaff',
                label: 'Cán bộ TT Máu (Blood Center Staff)',
                desc: 'Quản lý chiến dịch hiến máu, tiếp nhận người hiến và quản lý kho túi máu.',
                icon: Building2,
              },
              {
                id: 'HospitalStaff',
                label: 'Cán bộ Bệnh viện (Hospital Staff)',
                desc: 'Tạo yêu cầu máu khẩn cấp SOS và theo dõi tiến độ tiếp nhận điều phối.',
                icon: Hospital,
              },
              {
                id: 'Administrator',
                label: 'Quản trị viên (Administrator)',
                desc: 'Toàn quyền quản trị tài khoản, cấu hình hệ thống, tính năng mở rộng và nhật ký kiểm toán.',
                icon: Shield,
              },
            ].map((r) => {
              const IconComp = r.icon;
              const roleId = r.id as 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
              const isSelected = roles.includes(roleId);
              const isRoleDisabled = roleId === 'Donor' || !isEdit;
              return (
                <div
                  key={r.id}
                  onClick={() => !isRoleDisabled && handleToggleRole(roleId)}
                  aria-disabled={isRoleDisabled}
                  className={`p-4 rounded-xl border-2 transition flex items-start gap-3 relative ${
                    isRoleDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  } ${
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
                        disabled={isRoleDisabled}
                        onChange={() => {}} // handled by parent div onClick
                        className="w-4 h-4 accent-[#93000b] rounded disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="text-xs text-[#5b403d] font-medium mt-1 leading-snug">
                      {roleId === 'Donor'
                        ? 'Vai trò nền tảng bắt buộc — lưu hồ sơ và lịch sử hiến máu.'
                        : !isEdit
                        ? 'Chỉ có thể cấp sau khi tài khoản Donor đã được tạo.'
                        : r.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(roles.includes('HospitalStaff') || roles.includes('BloodCenterStaff')) && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4" aria-labelledby="staff-organization-heading">
            <h2 id="staff-organization-heading" className="text-sm font-bold text-[#271816]">
              Đơn vị công tác bắt buộc
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6c4a45]">
              Quyền nhân viên chỉ truy cập dữ liệu của đơn vị được chọn. Vai trò Donor và lịch sử hiến máu của tài khoản vẫn được giữ nguyên.
            </p>

            {roles.includes('HospitalStaff') ? (
              <div className="mt-3">
                <label htmlFor="hospital-assignment" className="mb-1 block text-xs font-bold text-[#271816]">
                  Bệnh viện công tác *
                </label>
                <select
                  id="hospital-assignment"
                  required
                  disabled={loadingOrganizations}
                  value={hospitalId}
                  onChange={(event) => setHospitalId(event.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#271816] outline-hidden focus:ring-2 focus:ring-[#93000b] disabled:opacity-60"
                >
                  <option value="">{loadingOrganizations ? 'Đang tải bệnh viện...' : '-- Chọn bệnh viện --'}</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}{hospital.address ? ` — ${hospital.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mt-3">
                <label htmlFor="blood-center-assignment" className="mb-1 block text-xs font-bold text-[#271816]">
                  Trung tâm máu công tác *
                </label>
                <select
                  id="blood-center-assignment"
                  required
                  disabled={loadingOrganizations}
                  value={bloodCenterId}
                  onChange={(event) => setBloodCenterId(event.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#271816] outline-hidden focus:ring-2 focus:ring-[#93000b] disabled:opacity-60"
                >
                  <option value="">{loadingOrganizations ? 'Đang tải trung tâm máu...' : '-- Chọn trung tâm máu --'}</option>
                  {bloodCenters.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name}{center.address ? ` — ${center.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>
        )}

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Họ và tên {isEdit ? <span className="text-[#6c757d] font-normal">(Cố định theo CCCD)</span> : '*'}
            </label>
            <input
              type="text"
              required={!isEdit}
              disabled={isEdit}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isEdit && <p className="mt-1 text-[11px] text-slate-500">Dữ liệu định danh được giữ theo hồ sơ CCCD và không thể sửa tại trang phân quyền.</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Địa chỉ Email {isEdit ? <span className="text-[#6c757d] font-normal">(Tùy chọn)</span> : '*'}
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
              Số CCCD / Định danh {isEdit ? <span className="text-[#6c757d] font-normal">(Cố định)</span> : '*'}
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
              Số điện thoại <span className="text-[#6c757d] font-normal">(Tùy chọn)</span>
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
              Địa chỉ thường trú (theo CCCD) {isEdit ? <span className="text-[#6c757d] font-normal">(Cố định theo CCCD)</span> : ''}
            </label>
            <input
              type="text"
              disabled={isEdit}
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              placeholder="VD: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1 flex items-center justify-between">
              <span>Địa chỉ nơi ở hiện tại</span>
              <span className="text-[10px] text-emerald-700 font-medium font-mono">📍 Quét toạ độ SOS</span>
            </label>
            <input
              type="text"
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              placeholder="VD: 45 Hoàng Hoa Thám, Phường 13, Tân Bình, TP.HCM"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#271816] mb-1">
                Mật khẩu khởi tạo *
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
                Trạng thái tài khoản
              </label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value as 'PendingVerification' | 'Active' | 'Suspended')}
                className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
              >
                <option value="Active" className="bg-white text-[#271816]">Đang hoạt động</option>
                <option value="Suspended" className="bg-white text-[#271816]">Tạm ngưng</option>
                <option value="PendingVerification" className="bg-white text-[#271816]">Chờ xác minh</option>
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
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#93000b] hover:bg-[#780009] text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
          </button>
        </div>
      </form>}
    </div>
  );
};
