import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { Plus, Search, Filter, ArrowRight, Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const SOSDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isHospital = authUser.role === 'HospitalStaff';
  
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
    fulfilled: 0,
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await sosApi.getSOSRequests({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm || undefined,
        bloodType: bloodTypeFilter || undefined,
        urgencyLevel: urgencyFilter || undefined,
      });
      setRequests(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      
      // Calculate stats from all requests (we need to fetch all for accurate stats)
      // For now, calculate from current page data
      const criticalCount = response.data.filter(r => r.urgencyLevel === 'Critical').length;
      const pendingCount = response.data.filter(r => r.status === 'Pending' || r.status === 'EvaluationInProgress').length;
      const fulfilledCount = response.data.filter(r => r.status === 'Fulfilled').length;
      
      setStats({
        total: response.total,
        critical: criticalCount,
        pending: pendingCount,
        fulfilled: fulfilledCount,
      });
    } catch (error) {
      console.error('Failed to fetch SOS requests:', error);
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách yêu cầu SOS'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, debouncedSearchTerm, bloodTypeFilter, urgencyFilter]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-main">SOS Requests Dashboard</h1>
          <p className="text-brand-text-secondary mt-1">Monitor and manage emergency blood requests</p>
        </div>
        {isHospital && (
          <button 
            onClick={() => navigate('/hospital/sos-requests/create')}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create SOS Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-info/10 text-brand-info rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-muted">Total Requests</p>
            <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-error/10 text-brand-error rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-muted">Critical Urgency</p>
            <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.critical}</h3>
          </div>
        </div>
        <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-warning/10 text-brand-warning rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-muted">Pending Review</p>
            <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.pending}</h3>
          </div>
        </div>
        <div className="bg-brand-bg-card p-5 rounded-xl border border-brand-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-success/10 text-brand-success rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-muted">Fulfilled</p>
            <h3 className="text-2xl font-bold text-brand-text-main mt-1">{stats.fulfilled}</h3>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-text-main">Recent SOS Requests</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-5 h-5 text-brand-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search Request ID or Patient..." 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm w-full sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              aria-label="Filter SOS requests"
              aria-expanded={isFilterOpen}
              className={`relative p-2 border rounded-lg transition-colors ${
                bloodTypeFilter || urgencyFilter
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border-dark text-brand-text-secondary hover:bg-brand-bg-muted'
              }`}
            >
              <Filter className="w-5 h-5" />
              {(bloodTypeFilter || urgencyFilter) && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-primary ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="border-b border-brand-border bg-brand-bg-muted/40 px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(180px,240px)_minmax(180px,240px)_auto] gap-4 items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-brand-text-secondary">Blood type</span>
                <select
                  aria-label="Filter by blood type"
                  value={bloodTypeFilter}
                  onChange={(event) => {
                    setBloodTypeFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-brand-border-dark bg-white px-3 text-sm text-brand-text-main outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">All blood types</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-brand-text-secondary">Urgency</span>
                <select
                  aria-label="Filter by urgency"
                  value={urgencyFilter}
                  onChange={(event) => {
                    setUrgencyFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-brand-border-dark bg-white px-3 text-sm text-brand-text-main outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">All urgency levels</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setBloodTypeFilter('');
                  setUrgencyFilter('');
                  setCurrentPage(1);
                }}
                disabled={!bloodTypeFilter && !urgencyFilter}
                className="h-10 rounded-lg border border-brand-border-dark bg-white px-4 text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-brand-text-muted mt-2">Loading SOS requests...</p>
          </div>
        )}

        {!isLoading && (
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
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {requests.length > 0 ? (
                  requests.map((req) => {
                    const reqId = req.id || (req as any)._id;
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
                      <td className="px-6 py-4 text-brand-text-muted">{req.createdAt ? format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm') : ''}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(isHospital ? `/hospital/sos-requests/${reqId}` : `/bc/sos-requests/${reqId}`)}
                          className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors inline-flex"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-brand-text-muted">
                      No SOS requests found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-sm text-brand-text-muted">
              Showing page {currentPage} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-brand-border-dark rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
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
