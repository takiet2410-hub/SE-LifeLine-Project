import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { AuditLogItem } from '../types/admin.types';
import { Search, Download, ShieldAlert, CheckCircle, FileText, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getActivityLogs({ search, category, status });
      setLogs(data.items);
    } catch (err: any) {
      toast.error('Failed to fetch activity audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, status]);

  const handleExportCsv = () => {
    const url = adminApi.exportLogsCsvUrl({ search, category, status });
    window.open(url, '_blank');
    toast.success('Downloading activity logs CSV...');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity & Audit Logs</h1>
          <p className="text-sm text-slate-500">
            Immutable system audit logs & security event trail (AD-UC-04)
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search actor, action or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Authentication">Authentication</option>
            <option value="User Management">User Management</option>
            <option value="Role Management">Role Management</option>
            <option value="System Configuration">System Configuration</option>
            <option value="Feature Toggle">Feature Toggle</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {new Date(l.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-xs">
                      {l.actorName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{l.actionCategory}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{l.ipAddress}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          l.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}
                      >
                        {l.status === 'Success' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="View Full Metadata"
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Log Entry Detail</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.actorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">IP Address</span>
                  <span className="font-mono">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Action</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timestamp</span>
                  <span className="font-mono">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              {selectedLog.previousValue && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Previous State</span>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.previousValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">New State</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
