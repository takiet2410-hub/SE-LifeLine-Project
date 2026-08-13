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
  const [role, setRole] = useState<'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator'>('Donor');
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
          setRole(u.role);
          setAccountStatus(u.accountStatus);
        }
      });
    }
  }, [isEdit, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEdit && userId) {
        await adminApi.updateUser(userId, {
          fullName,
          email,
          phone,
          role,
          accountStatus,
        });
        toast.success('User account updated successfully.');
      } else {
        await adminApi.createUser({
          fullName,
          email,
          phone,
          idDocumentNumber,
          password,
          role,
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
          <p className="text-sm font-medium text-[#6c757d]">Configure credentials & assign system role (AD-UC-02)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-6">
        {/* Role Radio Cards */}
        <div>
          <label className="block text-sm font-bold text-[#271816] mb-3">
            Select Account Role & Permissions
          </label>
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
              const isSelected = role === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#93000b] bg-red-50/50'
                      : 'border-[#f1f3f5] hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#93000b] text-white' : 'bg-slate-100 text-[#6c757d]'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#271816]">{r.label}</div>
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
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              ID Document Number (CCCD) *
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={idDocumentNumber}
              onChange={(e) => setIdDocumentNumber(e.target.value)}
              placeholder="012345678901"
              className="w-full px-3.5 py-2.5 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-semibold text-[#271816] placeholder:text-slate-400 focus:ring-2 focus:ring-[#93000b] outline-hidden disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#271816] mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
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
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="PendingVerification">Pending Verification</option>
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
