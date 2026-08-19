import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest, type SOSStatus, type SOSUrgency } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { ArrowLeft, Download, Calendar, Filter, BarChart2, RefreshCw, ArrowDown, Minus, Plus, AlertCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface SOSReportFilters {
  dateRange: { from: Date; to: Date };
  bloodType: string;
  status: string;
  urgencyLevel: string;
}

interface ReportStats {
  totalRequests: number;
  fulfilledRequests: number;
  cancelledRequests: number;
  pendingRequests: number;
  totalUnitsRequested: number;
  totalUnitsFulfilled: number;
  avgResponseTimeHours: number;
  fulfillmentRate: number;
}

interface BloodTypeStats {
  bloodType: string;
  count: number;
  unitsRequested: number;
  unitsFulfilled: number;
}

export const SOSReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SOSReportFilters>({
    dateRange: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(new Date()) },
    bloodType: '',
    status: '',
    urgencyLevel: '',
  });
  
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [reportRows, setReportRows] = useState<SOSRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [bloodTypeStats, setBloodTypeStats] = useState<BloodTypeStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // The API intentionally caps a page at 100 records. Fetch every page so
      // report totals remain accurate without sending an invalid limit=1000.
      const firstPage = await sosApi.getSOSRequests({
        page: 1,
        limit: 100,
      });
      const remainingPages = firstPage.totalPages > 1
        ? await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
              sosApi.getSOSRequests({ page: index + 2, limit: 100 })
            )
          )
        : [];
      const allRequests = [firstPage, ...remainingPages].flatMap(page => page.data);
      
      // Filter by date range on frontend
      const filtered = allRequests.filter(req => {
        const reqDate = new Date(req.createdAt);
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return reqDate >= fromDate && reqDate <= toDate;
      });

      // Apply additional filters
      let finalFiltered = filtered;
      if (filters.bloodType) finalFiltered = finalFiltered.filter(r => r.bloodType === filters.bloodType);
      if (filters.status) finalFiltered = finalFiltered.filter(r => r.status === filters.status);
      if (filters.urgencyLevel) finalFiltered = finalFiltered.filter(r => r.urgencyLevel === filters.urgencyLevel);

      // Calculate stats
      const totalUnitsRequested = finalFiltered.reduce((sum, r) => sum + r.requiredQuantityMl, 0);
      const fulfilledRequests = finalFiltered.filter(r => r.status === 'Fulfilled');
      const cancelledRequests = finalFiltered.filter(r => r.status === 'Cancelled');
      const pendingRequests = finalFiltered.filter(r => r.status === 'Pending' || r.status === 'EvaluationInProgress');
      const totalUnitsFulfilled = fulfilledRequests.reduce((sum, r) => sum + r.requiredQuantityMl, 0);
      
      const reportStats: ReportStats = {
        totalRequests: finalFiltered.length,
        fulfilledRequests: fulfilledRequests.length,
        cancelledRequests: cancelledRequests.length,
        pendingRequests: pendingRequests.length,
        totalUnitsRequested,
        totalUnitsFulfilled,
        avgResponseTimeHours: 0, // Would need additional data
        fulfillmentRate: finalFiltered.length > 0 ? (fulfilledRequests.length / finalFiltered.length) * 100 : 0,
      };

      // Blood type breakdown
      const bloodTypeMap = new Map<string, BloodTypeStats>();
      finalFiltered.forEach(req => {
        const existing = bloodTypeMap.get(req.bloodType) || { bloodType: req.bloodType, count: 0, unitsRequested: 0, unitsFulfilled: 0 };
        existing.count++;
        existing.unitsRequested += req.requiredQuantityMl;
        if (req.status === 'Fulfilled') existing.unitsFulfilled += req.requiredQuantityMl;
        bloodTypeMap.set(req.bloodType, existing);
      });

      setStats(reportStats);
      setBloodTypeStats(Array.from(bloodTypeMap.values()));
      
      // Paginate for display
      const pageSize = 10;
      const totalPagesCount = Math.ceil(finalFiltered.length / pageSize);
      const start = (currentPage - 1) * pageSize;
      const paginated = finalFiltered.slice(start, start + pageSize);
      
      setRequests(paginated);
      setReportRows(finalFiltered);
      setTotalPages(totalPagesCount);
      setTotal(finalFiltered.length);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setLoadError('Không thể tải báo cáo SOS. Vui lòng thử lại hoặc liên hệ quản trị viên nếu lỗi tiếp diễn.');
      setRequests([]);
      setReportRows([]);
      setStats(null);
      setBloodTypeStats([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters, currentPage]);


  const handleFilterChange = (key: keyof SOSReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Request ID', 'Blood Type', 'Quantity (ml)', 'Urgency', 'Status', 'Request Date', 'Patient Reference', 'Hospital', 'Fulfillment Deadline'];
    const rows = reportRows.map(req => {
      const reqId = req.id || (req as any)._id;
      const hospitalName = (req.hospital as any)?.name || (req.hospitalId as any)?.name || 'N/A';
      return [
        reqId,
        req.bloodType,
        req.requiredQuantityMl,
        req.urgencyLevel,
        req.status,
        format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm'),
        req.patientReference || '',
        hospitalName,
        format(new Date(req.fulfillmentDeadline), 'yyyy-MM-dd HH:mm'),
      ];
    });
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sos-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const statuses: SOSStatus[] = ['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed'];
  const urgencies: SOSUrgency[] = ['Critical', 'High', 'Medium'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate('/hospital/sos-requests')}
            className="mb-4 p-2 hover:bg-brand-bg-muted rounded-full transition-colors text-brand-text-secondary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-brand-text-main">SOS Reports</h1>
          <p className="text-brand-text-secondary mt-1">Analyze emergency blood request trends and performance</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={isLoading || reportRows.length === 0}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-5">
        <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-brand-primary" />
          Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={format(filters.dateRange.from, 'yyyy-MM-dd')}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, from: new Date(e.target.value) })}
                className="flex-1 px-3 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
              />
              <span className="flex items-center text-brand-text-muted">to</span>
              <input
                type="date"
                value={format(filters.dateRange.to, 'yyyy-MM-dd')}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, to: new Date(e.target.value) })}
                className="flex-1 px-3 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Blood Type</label>
            <select
              value={filters.bloodType}
              onChange={(e) => handleFilterChange('bloodType', e.target.value)}
              className="w-full px-3 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
            >
              <option value="">All Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Urgency</label>
            <select
              value={filters.urgencyLevel}
              onChange={(e) => handleFilterChange('urgencyLevel', e.target.value)}
              className="w-full px-3 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
            >
              <option value="">All Levels</option>
              {urgencies.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  dateRange: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(new Date()) },
                  bloodType: '',
                  status: '',
                  urgencyLevel: '',
                });
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-brand-border-dark rounded-lg text-brand-text-secondary font-medium hover:bg-brand-bg-muted transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-info/10 text-brand-info rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-muted">Total Requests</p>
              <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.totalRequests}</h3>
            </div>
          </div>
          <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-success/10 text-brand-success rounded-lg">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-muted">Fulfilled</p>
              <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.fulfilledRequests}</h3>
            </div>
          </div>
          <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-warning/10 text-brand-warning rounded-lg">
              <Minus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-muted">Pending</p>
              <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.pendingRequests}</h3>
            </div>
          </div>
          <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-error/10 text-brand-error rounded-lg">
              <ArrowDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-muted">Fulfillment Rate</p>
              <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.fulfillmentRate.toFixed(1)}%</h3>
            </div>
          </div>
        </div>
      )}

      {/* Blood Type Breakdown Chart */}
      {bloodTypeStats.length > 0 && (
        <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-5">
          <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-brand-primary" />
            Blood Type Breakdown
          </h2>
          <div className="space-y-3">
            {bloodTypeStats.map((bt) => (
              <div key={bt.bloodType} className="p-3 bg-brand-bg-muted rounded-lg border border-brand-border">
                <div className="flex justify-between items-center mb-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs">{bt.bloodType}</span>
                  <span className="text-sm text-brand-text-muted">{bt.count} requests</span>
                </div>
                <div className="w-full bg-brand-border rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats?.totalRequests && stats.totalRequests > 0 ? (bt.count / stats.totalRequests) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-brand-text-muted mt-1">
                  <span>Requested: {bt.unitsRequested} ml</span>
                  <span>Fulfilled: {bt.unitsFulfilled} ml ({bt.unitsRequested > 0 ? ((bt.unitsFulfilled / bt.unitsRequested) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-text-main">SOS Requests</h2>
          <div className="flex gap-2">
            <span className="flex items-center text-sm text-brand-text-muted">
              Showing {requests.length} of {total} requests
            </span>
          </div>
        </div>

        {loadError && !isLoading && (
          <div role="alert" className="m-5 flex items-start gap-3 rounded-lg border border-brand-error/30 bg-brand-error/5 p-4 text-brand-error">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Không tải được dữ liệu báo cáo</p>
              <p className="mt-1 text-sm">{loadError}</p>
              <button type="button" onClick={fetchReports} className="mt-3 rounded-lg border border-brand-error/30 bg-white px-3 py-1.5 text-sm font-medium hover:bg-brand-error/10">
                Thử lại
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-brand-text-muted mt-2">Loading report data...</p>
          </div>
        )}

        {!isLoading && !loadError && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-bg-muted/50 text-brand-text-muted border-b border-brand-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Request ID</th>
                  <th className="px-6 py-4 font-medium">Blood Type</th>
                  <th className="px-6 py-4 font-medium">Quantity</th>
                  <th className="px-6 py-4 font-medium">Urgency</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Request Date</th>
                  <th className="px-6 py-4 font-medium">Patient Reference</th>
                  <th className="px-6 py-4 font-medium">Hospital</th>
                  <th className="px-6 py-4 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {requests.length > 0 ? (
                  requests.map((req) => {
                    const reqId = req.id || (req as any)._id;
                    const hospitalName = (req.hospital as any)?.name || (req.hospitalId as any)?.name || 'N/A';
                    return (
                    <tr key={reqId} className="hover:bg-brand-bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-brand-text-main">{reqId}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs">
                          {req.bloodType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-brand-text-secondary">{req.requiredQuantityMl} ml</td>
                      <td className="px-6 py-4"><SOSStatusBadge urgency={req.urgencyLevel} /></td>
                      <td className="px-6 py-4"><SOSStatusBadge status={req.status} /></td>
                      <td className="px-6 py-4 text-brand-text-muted">{format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                      <td className="px-6 py-4 text-brand-text-secondary">{req.patientReference || 'N/A'}</td>
                      <td className="px-6 py-4 text-brand-text-secondary">{hospitalName}</td>
                      <td className="px-6 py-4 text-brand-text-muted">{format(new Date(req.fulfillmentDeadline), 'MMM dd, yyyy HH:mm')}</td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-brand-text-muted">
                      No SOS requests found for the selected criteria.
                    </td>
                  </tr>
                )}
</tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-brand-border flex items-center justify-between">
              <p className="text-sm text-brand-text-muted">
                Page {currentPage} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-brand-border-dark rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-brand-border-dark rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
