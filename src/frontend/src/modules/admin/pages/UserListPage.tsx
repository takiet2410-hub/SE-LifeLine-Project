import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { UserItem } from '../types/admin.types';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { Search, Plus, Download, Edit2, Trash2, UserCheck, ShieldAlert, UserX, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserItem | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers({
        search,
        searchField,
        role,
        accountStatus: status,
        page,
        limit,
      });
      const totalCount = data.total ?? data.pagination?.total ?? 0;
      const totalPages = data.pages ?? data.pagination?.totalPages ?? 1;
      setUsers(data.items || []);
      setTotal(totalCount);
      setPages(totalPages);
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
  }, [search, searchField, role, status, page, limit]);

  // Reset to page 1 when search or filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      toast.info('Preparing CSV export download...');
      const blob = await adminApi.exportUsersCsv({ search, searchField, role, accountStatus: status });
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

  const handleAccountAction = async (reason: string, confirmationUsername: string, isPermanent: boolean) => {
    if (!selectedUserForDelete) return;
    try {
      if (isPermanent) {
        await adminApi.hardDeleteUser(selectedUserForDelete.id, confirmationUsername);
        toast.success(`Account for ${selectedUserForDelete.email} permanently deleted from database.`);
      } else {
        await adminApi.softDeleteUser(selectedUserForDelete.id, reason, confirmationUsername);
        toast.success(`Account for ${selectedUserForDelete.email} suspended.`);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
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
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={searchField}
            onChange={(e) => handleFilterChange(setSearchField, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="all" className="bg-white text-[#271816]">Tất cả trường</option>
            <option value="name" className="bg-white text-[#271816]">Họ và tên</option>
            <option value="email" className="bg-white text-[#271816]">Email Address</option>
            <option value="cccd" className="bg-white text-[#271816]">Số CCCD</option>
            <option value="phone" className="bg-white text-[#271816]">Số điện thoại</option>
          </select>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder={
                searchField === 'name'
                  ? 'Tìm theo Họ và tên...'
                  : searchField === 'email'
                  ? 'Tìm theo Email...'
                  : searchField === 'cccd'
                  ? 'Tìm theo CCCD...'
                  : searchField === 'phone'
                  ? 'Tìm theo Số điện thoại...'
                  : 'Search name, email or CCCD...'
              }
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-medium text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={role}
            onChange={(e) => handleFilterChange(setRole, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">All Roles</option>
            <option value="Donor" className="bg-white text-[#271816]">Donor</option>
            <option value="BloodCenterStaff" className="bg-white text-[#271816]">Blood Center Staff</option>
            <option value="HospitalStaff" className="bg-white text-[#271816]">Hospital Staff</option>
            <option value="Administrator" className="bg-white text-[#271816]">Administrator</option>
          </select>

          <select
            value={status}
            onChange={(e) => handleFilterChange(setStatus, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">All Statuses</option>
            <option value="Active" className="bg-white text-[#271816]">Active</option>
            <option value="Suspended" className="bg-white text-[#271816]">Suspended</option>
            <option value="PendingVerification" className="bg-white text-[#271816]">Pending Verification</option>
          </select>

          {(search || role !== 'All' || status !== 'All' || searchField !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSearchField('all');
                setRole('All');
                setStatus('All');
                setPage(1);
              }}
              className="text-xs font-bold text-[#93000b] hover:underline px-2 cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
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
          <div>
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
                        <div className="flex flex-wrap gap-1">
                          {(u.roles && u.roles.length > 0 ? u.roles : [u.role]).map((r) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                r === 'Administrator'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : r === 'BloodCenterStaff'
                                  ? 'bg-red-50 text-[#93000b] border-red-200'
                                  : r === 'HospitalStaff'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
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

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-[#fff8f7]/50 border-t border-[#f1f3f5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 text-[#6c757d] font-medium">
                <span>
                  {total === 0 ? (
                    <>Không có tài khoản nào</>
                  ) : (
                    <>
                      Hiển thị <strong className="text-[#271816]">{(page - 1) * limit + 1}</strong> - <strong className="text-[#271816]">{Math.min(page * limit, total)}</strong> trong tổng số <strong className="text-[#271816]">{total}</strong> tài khoản
                    </>
                  )}
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-[#271816] focus:ring-1 focus:ring-[#93000b] cursor-pointer"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 text-slate-600 hover:text-[#271816] hover:bg-white disabled:opacity-40 rounded-lg border border-slate-200 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-3 py-1 font-bold rounded-lg transition cursor-pointer ${
                      page === pNum
                        ? 'bg-[#93000b] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="p-1.5 text-slate-600 hover:text-[#271816] hover:bg-white disabled:opacity-40 rounded-lg border border-slate-200 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={!!selectedUserForDelete}
        user={selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={handleAccountAction}
      />
    </div>
  );
};
