import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { DashboardMetricsResponse, DiagnosticsResponse } from '../types/admin.types';
import { Users, Activity, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, XCircle, Server } from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      setRunningDiagnostics(true);
      const data = await adminApi.runDiagnostics();
      setDiagnostics(data);
      toast.success('System diagnostics check completed!');
    } catch (err: any) {
      toast.error('Failed to run diagnostics check');
    } finally {
      setRunningDiagnostics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    handleRunDiagnostics();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#271816]">Admin Control Center</h1>
          <p className="text-sm font-medium text-[#6c757d]">
            System Overview, Active Sessions & Diagnostics (AD-UC-04)
          </p>
        </div>
        <button
          onClick={handleRunDiagnostics}
          disabled={runningDiagnostics}
          className="flex items-center gap-2 px-4 py-2 bg-[#93000b] hover:bg-[#780009] text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${runningDiagnostics ? 'animate-spin' : ''}`} />
          {runningDiagnostics ? 'Diagnosing...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#f1f3f5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">Active Sessions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-[#271816]">
              {loading ? '...' : metrics?.activeSessions}
            </h2>
            <span className="text-xs text-emerald-600 font-semibold">+12% vs last hour</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#f1f3f5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">Total User Accounts</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-[#271816]">
              {loading ? '...' : metrics?.totalUsers}
            </h2>
            <span className="text-xs text-[#5b403d] font-medium">{metrics?.newRegistrationsToday} new today</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#f1f3f5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">System Uptime</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-[#271816]">
              {loading ? '...' : metrics?.systemUptime}
            </h2>
            <span className="text-xs text-emerald-600 font-semibold">99.98% SLA target met</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#f1f3f5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">API Error Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-[#271816]">
              {loading ? '...' : metrics?.errorRate}
            </h2>
            <span className="text-xs text-[#5b403d] font-medium">Within acceptable range</span>
          </div>
        </div>
      </div>

      {/* System Health Indicators & Diagnostics Results */}
      <div className="bg-white rounded-2xl border border-[#f1f3f5] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-[#93000b]" />
            <div>
              <h3 className="font-bold text-lg text-[#271816]">System Health & Live Services</h3>
              <p className="text-xs font-medium text-[#6c757d]">
                Real-time synthetic ping checks & latency monitors
              </p>
            </div>
          </div>
          {diagnostics && (
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${
                diagnostics.overallStatus === 'Healthy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              System State: {diagnostics.overallStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {diagnostics?.services.map((svc, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#fff8f7] rounded-xl border border-[#f1f3f5]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">{svc.type}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-bold ${
                    svc.status === 'Operational'
                      ? 'text-emerald-600'
                      : svc.status === 'Degraded'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {svc.status === 'Operational' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {svc.status}
                </span>
              </div>
              <h4 className="font-bold text-[#271816] text-sm">{svc.name}</h4>
              <p className="text-xs text-[#5b403d] font-medium mt-1">{svc.details}</p>
              <div className="mt-3 pt-2 border-t border-[#f1f3f5] flex justify-between text-xs text-[#6c757d] font-medium">
                <span>Latency</span>
                <span className="font-mono font-bold text-[#271816]">{svc.latencyMs}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
