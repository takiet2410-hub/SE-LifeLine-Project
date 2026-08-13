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
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Account Details' : 'Create New Account'}
          </h1>
          <p className="text-sm text-slate-500">Configure credentials & assign system role (AD-UC-02)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Role Radio Cards */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
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
                      ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{r.label}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-snug">{r.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nguyễn Văn A"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ID Document Number (CCCD) *
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={idDocumentNumber}
              onChange={(e) => setIdDocumentNumber(e.target.value)}
              placeholder="012345678901"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required={!isEdit}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="PendingVerification">Pending Verification</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </form>
    </div>
  );
};
