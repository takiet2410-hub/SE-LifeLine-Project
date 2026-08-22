import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { UserItem } from '../types/admin.types';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { AccountLifecycleModal } from '../components/AccountLifecycleModal';
import { Search, Plus, Download, Edit2, Trash2, UserCheck, ShieldAlert, UserX, Inbox, ChevronLeft, ChevronRight, RotateCcw, UserRoundX } from 'lucide-react';
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
  const [lifecycleAction, setLifecycleAction] = useState<{
    user: UserItem;
    mode: 'restore' | 'purge';
  } | null>(null);

  const fetchUsers = useCallback(async () => {
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
    } catch {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, [limit, page, role, search, searchField, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Reset to page 1 when search or filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
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
    } catch {
      toast.error('Failed to export CSV file.');
    }
  };

  const handleAccountAction = async (reason: string, confirmationUsername: string) => {
    if (!selectedUserForDelete) return;
    try {
      await adminApi.softDeleteUser(selectedUserForDelete.id, reason, confirmationUsername);
      toast.success(`Account for ${selectedUserForDelete.email} suspended.`);
      fetchUsers();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = apiError.response?.data?.message || apiError.message || 'Action failed';
      toast.error(message);
      throw new Error(message, { cause: error });
    }
  };

  const handleLifecycleAction = async (reason: string, confirmationUsername: string, adminPassword: string) => {
    if (!lifecycleAction) return;
    try {
      if (lifecycleAction.mode === 'restore') {
        await adminApi.restoreUser(lifecycleAction.user.id, confirmationUsername);
        toast.success(`Account for ${lifecycleAction.user.email} restored.`);
      } else {
        await adminApi.purgePersonalData(lifecycleAction.user.id, reason, confirmationUsername, adminPassword);
        toast.success('Personal data purged. Email and ID Document Number are available for registration again.');
      }
      await fetchUsers();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = apiError.response?.data?.message || apiError.message || 'Action failed';
      toast.error(message);
      throw new Error(message, { cause: error });
    }
  };

  const renderStatusBadge = (userStatus: string) => {
    switch (userStatus) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="w-3.5 h-3.5" />
            Hoạt động
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">
            <UserX className="w-3.5 h-3.5" />
            Tạm ngưng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="w-3.5 h-3.5" />
            Chờ duyệt
          </span>
        );
    }
  };

  const getRoleBadgeLabel = (roleName: string) => {
    switch (roleName) {
      case 'Administrator': return 'Quản trị viên';
      case 'BloodCenterStaff': return 'Cán bộ TT Máu';
      case 'HospitalStaff': return 'Cán bộ Bệnh viện';
      case 'Donor': return 'Người hiến máu';
      default: return roleName;
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Action Controls */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#271816] text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Xuất CSV
        </button>
        <button
          onClick={() => navigate('/admin/users/create')}
          className="flex items-center gap-2 px-4 py-2 bg-[#93000b] hover:bg-[#780009] text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo tài khoản mới
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#f1f3f5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto [&>select]:w-full sm:[&>select]:w-auto">
          <select
            value={searchField}
            onChange={(e) => handleFilterChange(setSearchField, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="all" className="bg-white text-[#271816]">Tất cả trường</option>
            <option value="name" className="bg-white text-[#271816]">Họ và tên</option>
            <option value="email" className="bg-white text-[#271816]">Địa chỉ Email</option>
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
                  : 'Tìm kiếm tên, email hoặc CCCD...'
              }
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-medium text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 w-full md:w-auto [&>select]:w-full">
          <select
            value={role}
            onChange={(e) => handleFilterChange(setRole, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">Tất cả vai trò</option>
            <option value="Donor" className="bg-white text-[#271816]">Người hiến máu</option>
            <option value="BloodCenterStaff" className="bg-white text-[#271816]">Cán bộ TT Máu</option>
            <option value="HospitalStaff" className="bg-white text-[#271816]">Cán bộ Bệnh viện</option>
            <option value="Administrator" className="bg-white text-[#271816]">Quản trị viên</option>
          </select>

          <select
            value={status}
            onChange={(e) => handleFilterChange(setStatus, e.target.value)}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">Tất cả trạng thái</option>
            <option value="Active" className="bg-white text-[#271816]">Đang hoạt động</option>
            <option value="Suspended" className="bg-white text-[#271816]">Tạm ngưng</option>
            <option value="PendingVerification" className="bg-white text-[#271816]">Chờ xác minh</option>
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
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-[#f1f3f5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải danh sách tài khoản...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-[#fff8f7] rounded-full text-slate-400">
              <Inbox className="w-10 h-10 text-[#93000b]" />
            </div>
            <h3 className="font-bold text-[#271816] text-base">Không tìm thấy tài khoản người dùng phù hợp</h3>
            <p className="text-xs font-medium text-[#6c757d] max-w-md">
              Vui lòng thử lại với từ khóa tìm kiếm khác hoặc xóa bộ lọc để xem toàn bộ danh sách.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#fff8f7] border-b border-[#f1f3f5] text-xs font-bold text-[#6c757d] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Thông Tin Người Dùng</th>
                    <th className="py-3.5 px-4">Số CCCD / Định Danh</th>
                    <th className="py-3.5 px-4">Vai Trò</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4">Ngày Đăng Ký</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
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
                              {getRoleBadgeLabel(r)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.privacyPurgedAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <UserRoundX className="h-3.5 w-3.5" /> Đã xóa dữ liệu
                          </span>
                        ) : renderStatusBadge(u.accountStatus)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#6c757d]">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.privacyPurgedAt && u.accountStatus === 'Suspended' ? (
                            <>
                              <button
                                onClick={() => setLifecycleAction({ user: u, mode: 'restore' })}
                                className="cursor-pointer rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-50"
                                title="Khôi phục tài khoản"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              {u.role !== 'Administrator' && !u.roles?.includes('Administrator') && (
                                <button
                                  onClick={() => setLifecycleAction({ user: u, mode: 'purge' })}
                                  className="cursor-pointer rounded-lg p-1.5 text-red-700 transition hover:bg-red-50"
                                  title="Xóa dữ liệu cá nhân"
                                >
                                  <UserRoundX className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : !u.privacyPurgedAt ? (
                            <>
                              <button
                                onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                                className="p-1.5 text-slate-600 hover:text-[#271816] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Chỉnh sửa tài khoản"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedUserForDelete(u)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Khóa / Vô hiệu hóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
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
      {lifecycleAction && (
        <AccountLifecycleModal
          key={`${lifecycleAction.user.id}-${lifecycleAction.mode}`}
          user={lifecycleAction.user}
          mode={lifecycleAction.mode}
          onClose={() => setLifecycleAction(null)}
          onConfirm={handleLifecycleAction}
        />
      )}
    </div>
  );
};
