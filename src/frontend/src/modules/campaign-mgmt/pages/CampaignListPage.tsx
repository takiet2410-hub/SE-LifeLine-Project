import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Users,
  Activity,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  CheckCheck,
  Building2,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../../services/apiClient';
import { confirmAppointmentByBloodCenterApi } from '../../booking-location/api/bookingApi';
import type { CampaignData, RegistrationData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/common/DataTable';
import type { Column } from '../../../components/common/DataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { format } from 'date-fns';

export const CampaignListPage: React.FC = () => {
  const navigate = useNavigate();

  // Active View Tab: 'campaigns' | 'pendingRegistrations'
  const [activeTab, setActiveTab] = useState<'campaigns' | 'pendingRegistrations'>('campaigns');

  // Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [allCampaignList, setAllCampaignList] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ totalCount: 0, activeCount: 0, totalRegistered: 0, totalCapacity: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 6;

  // Pending Registrations State
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationData[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingCampaignFilter, setPendingCampaignFilter] = useState('All');
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const pendingPageSize = 8;

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    registrationId: string;
    donorName: string;
    reason: string;
  }>({
    isOpen: false,
    registrationId: '',
    donorName: '',
    reason: '',
  });

  // Batch Approve Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDateSafe = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response: any = await apiService.getCampaigns({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      });

      const items = Array.isArray(response?.data) ? response.data : [];
      setCampaigns(items);

      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }

      if (response?.stats) {
        setStats({
          totalCount: response.stats.totalCount || 0,
          activeCount: response.stats.activeCount || 0,
          totalRegistered: response.stats.totalRegistered || 0,
          totalCapacity: response.stats.totalCapacity || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all campaigns for dropdown selection
  const fetchAllCampaignsList = async () => {
    try {
      const response: any = await apiService.getCampaigns({ page: 1, limit: 100 });
      const items = Array.isArray(response?.data) ? response.data : [];
      setAllCampaignList(items);
    } catch (err) {
      console.error('Error fetching full campaign list:', err);
    }
  };

  // Fetch pending registrations across all campaigns
  const fetchPendingRegistrations = async () => {
    setPendingLoading(true);
    try {
      const data = await apiService.getRegistrations('all', '', 'Pending');
      setPendingRegistrations(data);
    } catch (err) {
      console.error('Error fetching pending registrations:', err);
      setPendingRegistrations([]);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    fetchAllCampaignsList();
    fetchPendingRegistrations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Handle Approve Single Registration
  const handleApproveRegistration = async (row: RegistrationData) => {
    const id = row._id;
    setActionLoadingId(id);
    try {
      const confirmRes = await confirmAppointmentByBloodCenterApi(id);
      if (!confirmRes.success) {
        // Fallback to updateRegistration
        await apiService.updateRegistration(id, { status: 'Confirmed' });
      }

      toast.success(`✨ Đã phê duyệt đơn của "${row.donorName}" & cấp thẻ E-Ticket thành công!`);

      // Update local state
      setPendingRegistrations((prev) => prev.filter((r) => r._id !== id));
      // Refresh campaign stats
      fetchCampaigns();
    } catch (err) {
      toast.error('Phê duyệt đơn đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Single Registration
  const handleConfirmReject = async () => {
    const { registrationId, donorName, reason } = rejectModal;
    if (!registrationId) return;

    setActionLoadingId(registrationId);
    try {
      await apiService.updateRegistration(registrationId, {
        status: 'Rejected',
        screeningNotes: reason ? `Lý do từ chối: ${reason}` : 'Từ chối bởi cán bộ y tế trung tâm.',
      });

      toast.info(`Đã từ chối đơn đăng ký của "${donorName}".`);
      setPendingRegistrations((prev) => prev.filter((r) => r._id !== registrationId));
      setRejectModal({ isOpen: false, registrationId: '', donorName: '', reason: '' });
      fetchCampaigns();
    } catch (err) {
      toast.error('Thao tác từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Batch Approve All Filtered Pending Registrations
  const handleBatchApprove = async () => {
    if (filteredPendingRegistrations.length === 0) return;
    setBatchProcessing(true);
    setBatchModalOpen(false);

    let successCount = 0;
    let failCount = 0;

    for (const reg of filteredPendingRegistrations) {
      try {
        const confirmRes = await confirmAppointmentByBloodCenterApi(reg._id);
        if (!confirmRes.success) {
          await apiService.updateRegistration(reg._id, { status: 'Confirmed' });
        }
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`✨ Đã phê duyệt và cấp thẻ E-Ticket thành công cho ${successCount} người hiến máu!`);
    }
    if (failCount > 0) {
      toast.error(`Có ${failCount} đơn phê duyệt không thành công.`);
    }

    fetchPendingRegistrations();
    fetchCampaigns();
    setBatchProcessing(false);
  };

  // Deduplicate campaign options for the filter dropdown
  const uniqueCampaignOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    allCampaignList.forEach((c) => {
      const id = c._id || (c as any).id;
      const name = c.name?.trim();
      if (id && name && !map.has(name)) {
        map.set(name, { id, name });
      }
    });

    // Ensure any campaign present in pending registrations is also available in the dropdown
    pendingRegistrations.forEach((r) => {
      const id = r.campaignId;
      const name = r.campaignName?.trim();
      if (id && name && !map.has(name)) {
        map.set(name, { id, name });
      }
    });

    return Array.from(map.values());
  }, [allCampaignList, pendingRegistrations]);

  // Filter pending registrations based on search and campaign filter
  const filteredPendingRegistrations = useMemo(() => {
    let list = pendingRegistrations;

    if (pendingCampaignFilter && pendingCampaignFilter !== 'All') {
      const targetCamp = uniqueCampaignOptions.find((c) => c.id === pendingCampaignFilter);
      list = list.filter(
        (r) =>
          r.campaignId === pendingCampaignFilter ||
          (targetCamp && r.campaignName?.trim() === targetCamp.name)
      );
    }

    if (pendingSearch.trim()) {
      const q = pendingSearch.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r._id && r._id.toLowerCase().includes(q)) ||
          (r.donorName && r.donorName.toLowerCase().includes(q)) ||
          (r.donorIdCard && r.donorIdCard.includes(q)) ||
          (r.donorPhone && r.donorPhone.includes(q)) ||
          (r.campaignName && r.campaignName.toLowerCase().includes(q)) ||
          (r.campaignVenue && r.campaignVenue.toLowerCase().includes(q))
      );
    }

    return list;
  }, [pendingRegistrations, pendingCampaignFilter, pendingSearch, uniqueCampaignOptions]);

  const pendingTotalPages = Math.ceil(filteredPendingRegistrations.length / pendingPageSize) || 1;
  const paginatedPending = filteredPendingRegistrations.slice(
    (pendingCurrentPage - 1) * pendingPageSize,
    pendingCurrentPage * pendingPageSize
  );

  // Calculated Summary KPI Metrics
  const totalCount = stats.totalCount;
  const activeCount = stats.activeCount;
  const totalRegistered = stats.totalRegistered;
  const pendingCount = pendingRegistrations.length;

  // Columns for Campaigns Table
  const campaignColumns: Column<CampaignData>[] = [
    {
      header: 'Tên chiến dịch',
      className: 'max-w-[220px]',
      accessor: (row: CampaignData) => {
        const id = row._id || (row as any).id;
        return (
          <div className="space-y-0.5 max-w-[200px] sm:max-w-[220px]">
            <p
              className="font-bold text-[#271816] text-[13px] sm:text-[14px] truncate hover:text-[#93000b] transition-colors cursor-pointer"
              title={row.name || 'Chiến dịch Hiến máu'}
              onClick={() => navigate(`/bc/campaigns/${id}`)}
            >
              {row.name || 'Chiến dịch Hiến máu'}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[#6c757d] truncate" title={row.venue || (row as any).fullAddress || 'TP. Hồ Chí Minh'}>
              <MapPin className="w-3 h-3 text-[#93000b] shrink-0" />
              <span className="truncate">{row.venue || (row as any).fullAddress || 'TP. Hồ Chí Minh'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Thời gian',
      accessor: (row: CampaignData) => (
        <div className="text-[11px] sm:text-[12px] space-y-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1 text-[#271816] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#93000b] shrink-0" />
            <span>{formatDateSafe(row.startDateTime)}</span>
          </div>
          <p className="text-[#6c757d] pl-4 text-[10px] sm:text-[11px]">đến {formatDateSafe(row.endDateTime)}</p>
        </div>
      ),
    },
    {
      header: 'Nhóm máu ưu tiên',
      accessor: (row: CampaignData) => {
        const groups =
          Array.isArray(row.targetBloodGroups) && row.targetBloodGroups.length > 0
            ? row.targetBloodGroups
            : ['A+', 'B+', 'O+'];
        return (
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {groups.slice(0, 3).map((group, i) => (
              <span
                key={`${group}-${i}`}
                className="px-1.5 py-0.2 text-[10px] font-bold bg-red-50 text-[#93000b] rounded border border-red-200 shadow-2xs"
              >
                {group}
              </span>
            ))}
            {groups.length > 3 && (
              <span className="px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                +{groups.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Tiến độ đăng ký',
      accessor: (row: CampaignData) => {
        const reg = row.registeredCount || (row as any).capacityProgress?.registered || 0;
        const cap = row.capacity || (row as any).capacityProgress?.total || 100;
        const percent = Math.min(100, Math.round((reg / Math.max(1, cap)) * 100));
        return (
          <div className="w-24 sm:w-28 space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-[#271816] font-mono">{reg}/{cap}</span>
              <span className="text-[#93000b]">{percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 100 ? 'bg-amber-500' : 'bg-[#93000b]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: (row: CampaignData) => <StatusBadge status={row.status || 'Active'} />,
    },
    {
      header: 'Thao tác',
      accessor: (row: CampaignData) => {
        const id = row._id || (row as any).id;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/bc/campaigns/${id}`)}
              className="p-1.5 bg-white border border-[#f1f3f5] hover:bg-slate-50 hover:border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Xem chi tiết chiến dịch"
            >
              <Eye className="w-3.5 h-3.5 text-[#93000b]" />
            </button>
            <button
              onClick={() => navigate(`/bc/campaigns/${id}/edit`)}
              className="p-1.5 bg-white border border-[#f1f3f5] hover:bg-slate-50 hover:border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Chỉnh sửa thông tin chiến dịch"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
            </button>
            <button
              onClick={() => navigate(`/bc/campaigns/${id}/registrations`)}
              className="p-1.5 text-white bg-[#93000b] hover:bg-[#7a0009] rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Danh sách người đăng ký"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  // Columns for Pending Registrations Table
  const pendingColumns: Column<RegistrationData>[] = [
    {
      header: 'Mã Đơn & CCCD',
      accessor: (row: RegistrationData) => {
        const code = row._id ? `#REG-${row._id.slice(-6).toUpperCase()}` : '#REG-8821';
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1a1a2e] text-white rounded">
              {code}
            </span>
            <p className="text-[11px] text-[#6c757d] font-mono">
              CCCD: {row.donorIdCard ? row.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2') : 'Chưa cập nhật'}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Người hiến máu',
      accessor: (row: RegistrationData) => {
        const name = row.donorName || (row as any).donor?.fullName || (row as any).donorId?.fullName || 'Người hiến máu';
        const phone = row.donorPhone || (row as any).donor?.phoneNumber || (row as any).donorId?.phone || 'Chưa cập nhật SĐT';
        const bt = row.donorBloodType;
        const hasBt = bt && bt !== 'Unknown' && bt !== 'Chưa biết' && bt !== 'Chưa xác định' && bt !== '?';

        return (
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[#271816] text-[13px]">{name}</p>
              {hasBt ? (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-red-50 text-[#93000b] rounded border border-red-200">
                  {bt}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[10px] text-slate-500 bg-slate-100 rounded">
                  Chưa biết nhóm
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6c757d] mt-0.5">
              <Phone className="w-3 h-3 text-[#93000b] shrink-0" />
              <span>{phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Chiến dịch & Địa điểm',
      accessor: (row: RegistrationData) => {
        const cName = row.campaignName || 'Chiến dịch Hiến máu';
        const cVenue = row.campaignVenue || 'TP. Hồ Chí Minh';
        return (
          <div className="space-y-0.5 max-w-[220px]">
            <p
              className="font-semibold text-[#271816] text-[13px] truncate hover:text-[#93000b] transition-colors cursor-pointer"
              title={cName}
              onClick={() => navigate(`/bc/campaigns/${row.campaignId}`)}
            >
              {cName}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[#6c757d] truncate" title={cVenue}>
              <MapPin className="w-3 h-3 text-[#93000b] shrink-0" />
              <span className="truncate">{cVenue}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Lịch hẹn tiếp nhận',
      accessor: (row: RegistrationData) => {
        const dateFormatted = formatDateSafe(row.appointmentDate);
        const timeSlotStr = row.timeSlot || (row as any).appointmentTime || (row as any).time;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[12px] font-bold text-[#271816]">
              <Calendar className="w-3.5 h-3.5 text-[#93000b] shrink-0" />
              <span>{dateFormatted}</span>
            </div>
            {timeSlotStr ? (
              <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-red-50 text-red-700 rounded border border-red-200">
                {timeSlotStr}
              </span>
            ) : (
              <span className="text-[11px] text-[#6c757d]">Khung giờ tiêu chuẩn</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Sàng lọc trực tuyến',
      accessor: (row: RegistrationData) => {
        const sf = (row as any).screeningForm || (row as any).screening;
        const outcome = sf?.outcome || 'PASS';
        if (outcome === 'PASS' || outcome === 'Pass') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đạt sơ bộ</span>
            </span>
          );
        }
        if (outcome === 'REJECT' || outcome === 'Reject') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full">
              <XCircle className="w-3 h-3 text-red-600" />
              <span>Cần kiểm tra lại</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Cần rà soát</span>
          </span>
        );
      },
    },
    {
      header: 'Thao tác nhanh',
      accessor: (row: RegistrationData) => {
        const isLoading = actionLoadingId === row._id;
        return (
          <div className="flex items-center gap-1.5">
            <button
              disabled={isLoading}
              onClick={() => handleApproveRegistration(row)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Phê duyệt đơn & cấp vé E-Ticket"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Đang duyệt...' : 'Phê duyệt'}</span>
            </button>
            <button
              disabled={isLoading}
              onClick={() =>
                setRejectModal({
                  isOpen: true,
                  registrationId: row._id,
                  donorName: row.donorName,
                  reason: '',
                })
              }
              className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Từ chối đơn đăng ký"
            >
              <XCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                navigate(`/bc/campaigns/${row.campaignId || 'all'}/registrations/${row._id}`)
              }
              className="p-1.5 bg-white hover:bg-slate-50 text-[#6c757d] hover:text-[#271816] border border-[#f1f3f5] rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Xem phiếu khám sàng lọc chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Overview Summary Cards (Display Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số chiến dịch */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#93000b] flex items-center justify-center shrink-0 border border-red-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Tổng số chiến dịch</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Card 2: Đang tiếp nhận */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Đang tiếp nhận</p>
            <p className="text-[24px] font-bold text-emerald-700 leading-tight mt-0.5">{activeCount}</p>
          </div>
        </div>

        {/* Card 3: Tổng lượt đăng ký */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Tổng lượt đăng ký</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalRegistered}</p>
          </div>
        </div>

        {/* Card 4: Đơn chờ phê duyệt */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              pendingCount > 0
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              Đơn chờ phê duyệt
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </p>
            <p className="text-[24px] font-bold text-amber-700 leading-tight mt-0.5">
              {pendingCount} <span className="text-[13px] font-semibold text-[#6c757d]">đơn</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pending Alert Notification Banner (if pendingCount > 0 and not on pending tab) */}
      {pendingCount > 0 && activeTab === 'campaigns' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-amber-900">
                Có {pendingCount} đơn đăng ký hiến máu đang chờ Trung Tâm xác nhận
              </p>
              <p className="text-[12px] text-amber-700">
                Phê duyệt đơn để hệ thống tự động phát hành vé E-Ticket và gửi email xác nhận cho người hiến.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pendingRegistrations')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Xem và duyệt ngay ({pendingCount} đơn)</span>
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Tabs & Action Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#dee2e6] gap-3 pb-2 sm:pb-0">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 px-4 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'campaigns'
                ? 'border-[#93000b] text-[#93000b]'
                : 'border-transparent text-[#6c757d] hover:text-[#271816]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Danh Sách Chiến Dịch</span>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pendingRegistrations')}
            className={`pb-3 px-4 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pendingRegistrations'
                ? 'border-[#93000b] text-[#93000b]'
                : 'border-transparent text-[#6c757d] hover:text-[#271816]'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Đơn Đăng Ký Chờ Phê Duyệt</span>
            {pendingCount > 0 ? (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-200 animate-pulse">
                {pendingCount} đơn mới
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-500 font-semibold">
                0
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 pb-2 sm:pb-2.5 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => {
              fetchCampaigns();
              fetchPendingRegistrations();
              toast.success('Đã làm mới dữ liệu!');
            }}
            className="p-2 bg-white border border-[#dee2e6] hover:bg-slate-50 text-[#6c757d] hover:text-[#271816] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/bc/campaigns/create')}
            className="px-3.5 py-2 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CAMPAIGN LIST VIEW */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filter and Search Control Bar */}
          <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên chiến dịch, địa điểm..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Trạng thái:</span>
              {[
                { id: 'All', label: 'Tất cả' },
                { id: 'Draft', label: 'Bản nháp' },
                { id: 'Upcoming', label: 'Sắp diễn ra' },
                { id: 'Active', label: 'Đang mở' },
                { id: 'Completed', label: 'Đã hoàn thành' },
                { id: 'Cancelled', label: 'Đã hủy' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-[#93000b] text-white shadow-2xs'
                      : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign List Data Table */}
          <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs">
            <DataTable
              columns={campaignColumns}
              data={campaigns}
              keyExtractor={(item: CampaignData) => item._id || (item as any).id || 'cam'}
              isLoading={loading}
              emptyMessage="Không tìm thấy chiến dịch hiến máu nào phù hợp với bộ lọc."
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: PENDING REGISTRATIONS VIEW */}
      {activeTab === 'pendingRegistrations' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Controls Bar */}
          <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={pendingSearch}
                  onChange={(e) => {
                    setPendingSearch(e.target.value);
                    setPendingCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên người hiến, CCCD, SĐT, mã phiếu hoặc chiến dịch..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
                />
              </div>

              {/* Campaign Filter Dropdown */}
              <select
                value={pendingCampaignFilter}
                onChange={(e) => {
                  setPendingCampaignFilter(e.target.value);
                  setPendingCurrentPage(1);
                }}
                className="px-3 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] outline-none font-medium max-w-xs truncate cursor-pointer"
              >
                <option value="All">🏥 Tất cả chiến dịch ({pendingRegistrations.length} đơn)</option>
                {uniqueCampaignOptions.map((c) => {
                  const countForCampaign = pendingRegistrations.filter(
                    (r) => r.campaignId === c.id || r.campaignName?.trim() === c.name
                  ).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {countForCampaign > 0 ? `(${countForCampaign} đơn)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Batch Approve Action Button */}
            {filteredPendingRegistrations.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={batchProcessing}
                  onClick={() => setBatchModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {batchProcessing
                      ? 'Đang xử lý...'
                      : `Phê duyệt tất cả (${filteredPendingRegistrations.length} đơn)`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Pending Registrations Data Table */}
          <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs">
            <DataTable
              columns={pendingColumns}
              data={paginatedPending}
              keyExtractor={(item: RegistrationData) => item._id || 'reg'}
              isLoading={pendingLoading}
              emptyMessage="Hiện không có đơn đăng ký hiến máu nào đang chờ phê duyệt. Tất cả hồ sơ đã được xử lý!"
              currentPage={pendingCurrentPage}
              totalPages={pendingTotalPages}
              onPageChange={(page) => setPendingCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* Modal Reject Registration */}
      <ConfirmDialog
        isOpen={rejectModal.isOpen}
        title="Từ chối đơn đăng ký hiến máu"
        message={`Bạn có chắc chắn muốn từ chối đơn đăng ký của "${rejectModal.donorName}"?`}
        confirmLabel="Xác nhận từ chối"
        cancelLabel="Đóng"
        variant="danger"
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectModal({ isOpen: false, registrationId: '', donorName: '', reason: '' })}
      >
        <div className="mt-3 text-left">
          <label className="text-[12px] font-semibold text-[#271816] block mb-1">
            Lý do từ chối (Gửi thông báo tới người hiến):
          </label>
          <textarea
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Nhập lý do từ chối (VD: Trùng lịch tiếp nhận, chưa đủ thời gian giãn cách...)"
            rows={3}
            className="w-full p-2.5 text-[13px] border border-[#dee2e6] rounded-xl outline-none focus:border-[#93000b] transition-all"
          />
        </div>
      </ConfirmDialog>

      {/* Modal Batch Approve All */}
      <ConfirmDialog
        isOpen={batchModalOpen}
        title="Phê duyệt hàng loạt đơn đăng ký"
        message={`Hệ thống sẽ phê duyệt toàn bộ ${filteredPendingRegistrations.length} đơn đăng ký đang lọc và tự động phát hành thẻ E-Ticket cho các người hiến. Bạn có chắc chắn muốn tiếp tục?`}
        confirmLabel="Xác nhận duyệt tất cả"
        cancelLabel="Hủy"
        variant="primary"
        onConfirm={handleBatchApprove}
        onCancel={() => setBatchModalOpen(false)}
      />
    </div>
  );
};

export default CampaignListPage;
