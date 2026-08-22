import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { AuditLogItem } from '../types/admin.types';
import { Search, Download, ShieldAlert, CheckCircle, FileText, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getActivityLogs({ search, category, status, page, limit: 15 });
      setLogs(data.items);
      setTotalPages(data.pagination.totalPages || 1);
      setTotal(data.pagination.total || 0);
    } catch {
      toast.error('Failed to fetch activity audit logs.');
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleExportCsv = async () => {
    try {
      toast.info('Preparing activity logs CSV export...');
      const blob = await adminApi.exportLogsCsv({ search, category, status });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Activity logs CSV downloaded successfully.');
    } catch {
      toast.error('Failed to export activity logs CSV.');
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Action Controls */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#271816] text-sm font-semibold rounded-xl transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Xuất CSV
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#f1f3f5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm tác nhân, hành động hoặc tài nguyên..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[#fff8f7] border border-slate-200 rounded-xl text-sm font-medium text-[#271816] focus:ring-2 focus:ring-[#93000b] outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">Tất cả danh mục</option>
            <option value="Authentication" className="bg-white text-[#271816]">Xác thực & Đăng nhập</option>
            <option value="User Management" className="bg-white text-[#271816]">Quản lý người dùng</option>
            <option value="Role Management" className="bg-white text-[#271816]">Vai trò & Phân quyền</option>
            <option value="System Configuration" className="bg-white text-[#271816]">Cấu hình hệ thống</option>
            <option value="Feature Toggle" className="bg-white text-[#271816]">Tính năng mở rộng</option>
            <option value="SOS Request" className="bg-white text-[#271816]">Yêu cầu SOS</option>
            <option value="Content Management" className="bg-white text-[#271816]">Quản lý bài viết</option>
            <option value="Registration" className="bg-white text-[#271816]">Đăng ký hiến máu</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#fff8f7] border border-slate-200 text-sm font-semibold text-[#271816] rounded-xl focus:ring-2 focus:ring-[#93000b] outline-hidden cursor-pointer"
          >
            <option value="All" className="bg-white text-[#271816]">Tất cả trạng thái</option>
            <option value="Success" className="bg-white text-[#271816]">Thành công</option>
            <option value="Failure" className="bg-white text-[#271816]">Thất bại</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#f1f3f5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải nhật ký hoạt động...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#6c757d] text-sm font-medium">Không tìm thấy nhật ký hoạt động nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#fff8f7] border-b border-[#f1f3f5] text-xs font-bold text-[#6c757d] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Tác Nhân</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Danh Mục</th>
                  <th className="py-3.5 px-4">Địa Chỉ IP</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#fff8f7]/60 transition">
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6c757d] font-medium">
                      {new Date(l.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#271816] text-xs">
                      {l.actorName === 'System' ? 'Hệ thống' : l.actorName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#271816]">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#6c757d]">{l.actionCategory}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6c757d]">{l.ipAddress}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          l.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {l.status === 'Success' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {l.status === 'Success' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 text-slate-500 hover:text-[#271816] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Xem chi tiết nhật ký"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#6c757d]">
          <span>Tổng {total} bản ghi nhật ký</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="p-2 border rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Trang {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="p-2 border rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 border border-[#f1f3f5] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-[#93000b] rounded-xl border border-red-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#271816]">Chi tiết Nhật ký Kiểm toán</h3>
                  <p className="text-xs font-medium text-[#6c757d]">Thông tin Metadata & So sánh trạng thái dữ liệu</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-[#271816] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fff8f7] p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[#6c757d] block font-medium mb-0.5">Người thực hiện</span>
                  <span className="font-bold text-[#271816]">
                    {selectedLog.actorName === 'System' ? 'Hệ thống' : selectedLog.actorName}
                  </span>
                </div>
                <div>
                  <span className="text-[#6c757d] block font-medium mb-0.5">Địa chỉ IP</span>
                  <span className="font-mono font-semibold text-[#271816]">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[#6c757d] block font-medium mb-0.5">Phân loại</span>
                  <span className="font-bold text-[#93000b]">{selectedLog.actionCategory}</span>
                </div>
                <div>
                  <span className="text-[#6c757d] block font-medium mb-0.5">Trạng thái</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      selectedLog.status === 'Success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedLog.status === 'Success' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {selectedLog.status === 'Success' ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#271816]">Hành động (Action):</span>
                  <span className="font-mono text-slate-500">{new Date(selectedLog.timestamp).toLocaleString('vi-VN')}</span>
                </div>
                <div className="text-sm font-semibold text-[#93000b]">{selectedLog.action}</div>
                {selectedLog.details && (
                  <div className="text-xs text-[#6c757d] pt-1 border-t border-slate-200/60 mt-1">
                    {selectedLog.details}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLog.previousValue !== undefined && selectedLog.previousValue !== null && (
                  <div>
                    <span className="font-bold text-[#271816] block mb-1">Dữ liệu trước (Previous State)</span>
                    <pre className="bg-[#271816] text-amber-300 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-48">
                      {JSON.stringify(selectedLog.previousValue, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValue !== undefined && selectedLog.newValue !== null && (
                  <div>
                    <span className="font-bold text-[#271816] block mb-1">Dữ liệu sau (New State)</span>
                    <pre className="bg-[#271816] text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-48">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f1f3f5]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#271816] font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
