import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { UserItem } from '../types/admin.types';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { Search, Plus, Download, Edit2, Trash2, UserCheck, ShieldAlert, UserX, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserItem | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers({ search, role, accountStatus: status });
      setUsers(data.items);
    } catch (err: any) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, role, status]);

  const handleExportCsv = async () => {
    try {
      toast.info('Preparing CSV export download...');
      const blob = await adminApi.exportUsersCsv({ search, role, accountStatus: status });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_accounts_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('User list CSV downloaded successfully.');
    } catch (err: any) {
      toast.error('Failed to export CSV file.');
    }
  };

  const handleSoftDelete = async (reason: string, confirmationUsername: string) => {
    if (!selectedUserForDelete) return;
    try {
      await adminApi.softDeleteUser(selectedUserForDelete.id, reason, confirmationUsername);
      toast.success(`Account for ${selectedUserForDelete.email} deactivated.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Deactivation failed');
    }
  };

  const renderStatusBadge = (userStatus: string) => {
    switch (userStatus) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">
            <UserX className="w-3.5 h-3.5" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#271816]">User Accounts</h1>
          <p className="text-sm font-medium text-[#6c757d]">
            Manage user accounts, roles & status (AD-UC-01 & AD-UC-02)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#271816] text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/admin/users/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#93000b] hover:bg-[#780009] text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#f1f3f5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, email or CCCD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-medium text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Donor">Donor</option>
            <option value="BloodCenterStaff">Blood Center Staff</option>
            <option value="HospitalStaff">Hospital Staff</option>
            <option value="Administrator">Administrator</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="PendingVerification">Pending Verification</option>
          </select>

          {(search || role !== 'All' || status !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setRole('All');
                setStatus('All');
              }}
              className="text-xs font-bold text-[#93000b] hover:underline px-2 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table / Empty State */}
      <div className="bg-white rounded-2xl border border-[#f1f3f5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-[#fff8f7] rounded-full text-slate-400">
              <Inbox className="w-10 h-10 text-[#93000b]" />
            </div>
            <h3 className="font-bold text-[#271816] text-base">No Matching User Accounts Found</h3>
            <p className="text-xs font-medium text-[#6c757d] max-w-md">
              Try refining your search keyword or clearing the filter options to view available accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#fff8f7] border-b border-[#f1f3f5] text-xs font-bold text-[#6c757d] uppercase tracking-wider">
                  <th className="py-3.5 px-4">User Info</th>
                  <th className="py-3.5 px-4">ID Document (CCCD)</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fff8f7]/60 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-[#271816]">{u.fullName}</div>
                        <div className="text-xs text-[#6c757d] font-medium">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#271816]">
                      {u.idDocumentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#271816] text-xs">{u.role}</span>
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(u.accountStatus)}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#6c757d]">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                          className="p-1.5 text-slate-600 hover:text-[#271816] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Deactivate Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={!!selectedUserForDelete}
        user={selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={handleSoftDelete}
      />
    </div>
  );
};
