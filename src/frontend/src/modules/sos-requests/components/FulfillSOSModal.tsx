import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Ban,
  Clock,
  Droplet,
  Filter,
  Check,
} from 'lucide-react';
import { inventoryApi } from '../../blood-inventory/services/inventoryApi';
import { sosApi } from '../services/sosApi';
import type { SOSRequest } from '../services/sosApi';
import {
  getCompatibleDonorBloodTypes,
  evaluateBloodBagForSOS,
} from '../../../shared/utils/bloodTypeUtils';
import { toast } from 'sonner';

interface FulfillSOSModalProps {
  request: SOSRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FilterTab = 'sendable' | 'exact' | 'all';

export const FulfillSOSModal: React.FC<FulfillSOSModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('sendable');
  const [selectedBloodTypeFilter, setSelectedBloodTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchBags();
      setSelectedBagIds([]);
      setSearch('');
      setFilterTab('sendable');
      setSelectedBloodTypeFilter('ALL');
    }
  }, [isOpen]);

  const fetchBags = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getInventory({
        status: 'Available',
        limit: 200,
      });
      if (res.success && Array.isArray(res.data)) {
        setBags(res.data);
      } else {
        setBags([]);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu kho máu');
    } finally {
      setLoading(false);
    }
  };

  const recipientBloodType = request.bloodType || '';
  const compatibleBloodTypes = useMemo(
    () => getCompatibleDonorBloodTypes(recipientBloodType),
    [recipientBloodType]
  );

  const currentReceived = request.receivedQuantityMl ?? (
    (request.shipments || []).filter((s: any) => s.status === 'Received').reduce((acc: number, s: any) => acc + (s.volumeMl || 0), 0) +
    (request.directDonations || []).reduce((acc: number, d: any) => acc + (d.volumeMl || 0), 0)
  );
  const currentInTransit = request.inTransitQuantityMl || 0;
  const remainingMl = Math.max(
    0,
    request.requiredQuantityMl - currentReceived - currentInTransit
  );

  // Evaluate all bags against SOS requirements
  const evaluatedBags = useMemo(() => {
    return bags.map((bag) => {
      const evaluation = evaluateBloodBagForSOS(bag, recipientBloodType);
      return {
        ...bag,
        evaluation,
      };
    });
  }, [bags, recipientBloodType]);

  // Filter bags based on current tab, blood type selector, and search term
  const filteredBags = useMemo(() => {
    let list = evaluatedBags;

    // Filter by Tab
    if (filterTab === 'sendable') {
      list = list.filter((b) => b.evaluation.isSendable);
    } else if (filterTab === 'exact') {
      list = list.filter((b) => b.evaluation.isExactMatch && !b.evaluation.isExpired);
    }

    // Filter by Blood Type dropdown
    if (selectedBloodTypeFilter !== 'ALL') {
      list = list.filter(
        (b) => (b.bloodType || '').toUpperCase() === selectedBloodTypeFilter.toUpperCase()
      );
    }

    // Filter by search query
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.bagCode?.toLowerCase().includes(term) ||
          b.bloodType?.toLowerCase().includes(term) ||
          b.storageLocation?.toLowerCase().includes(term)
      );
    }

    // Sort: sendable first, exact matches first, closest expiry date first (FEFO)
    return list.sort((a, b) => {
      if (a.evaluation.isSendable && !b.evaluation.isSendable) return -1;
      if (!a.evaluation.isSendable && b.evaluation.isSendable) return 1;

      if (a.evaluation.isExactMatch && !b.evaluation.isExactMatch) return -1;
      if (!a.evaluation.isExactMatch && b.evaluation.isExactMatch) return 1;

      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return dateA - dateB;
    });
  }, [evaluatedBags, filterTab, selectedBloodTypeFilter, search]);

  // Volume calculations
  const selectedVolume = useMemo(() => {
    return selectedBagIds.reduce((sum, id) => {
      const bag = bags.find((b) => (b._id || b.id) === id);
      return sum + (bag?.volumeMl || 0);
    }, 0);
  }, [selectedBagIds, bags]);

  const isFulfilledAmount = selectedVolume >= remainingMl && remainingMl > 0;
  const progressPercent = remainingMl > 0 ? Math.min(100, Math.round((selectedVolume / remainingMl) * 100)) : 0;

  // Counts for tabs
  const sendableCount = useMemo(
    () => evaluatedBags.filter((b) => b.evaluation.isSendable).length,
    [evaluatedBags]
  );
  const exactMatchCount = useMemo(
    () => evaluatedBags.filter((b) => b.evaluation.isExactMatch && !b.evaluation.isExpired).length,
    [evaluatedBags]
  );

  const handleToggleSelect = (bagId: string, isSendable: boolean) => {
    if (!isSendable) {
      toast.warning('Túi máu này không đủ điều kiện gửi (không tương thích hoặc đã hết hạn)');
      return;
    }
    setSelectedBagIds((prev) =>
      prev.includes(bagId) ? prev.filter((id) => id !== bagId) : [...prev, bagId]
    );
  };

  // Smart Auto-Select using FEFO (First-Expired, First-Out) prioritizing exact match
  const handleAutoSelect = () => {
    const sendableBags = evaluatedBags
      .filter((b) => b.evaluation.isSendable)
      .sort((a, b) => {
        // Exact match first
        if (a.evaluation.isExactMatch && !b.evaluation.isExactMatch) return -1;
        if (!a.evaluation.isExactMatch && b.evaluation.isExactMatch) return 1;
        // Closest expiry date first
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

    const chosenIds: string[] = [];
    let currentVolume = 0;

    for (const bag of sendableBags) {
      const id = bag._id || bag.id;
      chosenIds.push(id);
      currentVolume += bag.volumeMl || 0;
      if (currentVolume >= remainingMl) {
        break;
      }
    }

    if (chosenIds.length === 0) {
      toast.error('Không tìm thấy túi máu gửi được nào trong kho.');
      return;
    }

    setSelectedBagIds(chosenIds);
    if (currentVolume >= remainingMl) {
      toast.success(`Đã tự động chọn ${chosenIds.length} túi máu (${currentVolume}ml) đáp ứng đủ yêu cầu!`);
    } else {
      toast.info(`Đã chọn toàn bộ ${chosenIds.length} túi máu gửi được (${currentVolume}ml / ${remainingMl}ml).`);
    }
  };

  const handleClearSelection = () => {
    setSelectedBagIds([]);
  };

  const handleSubmit = async () => {
    if (selectedBagIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 túi máu để gửi');
      return;
    }

    if (!isFulfilledAmount) {
      const confirmPartial = confirm(
        `Thể tích đã chọn (${selectedVolume}ml) chưa đủ toàn bộ yêu cầu (${remainingMl}ml).\n\nBạn có chắc chắn muốn xuất kho và gửi trước ${selectedVolume}ml cho bệnh viện không? Phần còn thiếu sẽ tiếp tục được điều phối.`
      );
      if (!confirmPartial) return;
    }

    try {
      setSubmitting(true);
      await sosApi.fulfillFromInventory(request.id || (request as any)._id, selectedBagIds);
      toast.success(
        isFulfilledAmount
          ? 'Gửi máu đáp ứng đủ 100% yêu cầu SOS thành công!'
          : `Đã xuất kho gửi trước ${selectedVolume}ml cho bệnh viện thành công!`
      );
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          error.message ||
          'Không thể hoàn thành yêu cầu gửi máu'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Droplet className="w-5 h-5 fill-brand-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Xuất kho đáp ứng yêu cầu SOS
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {request.id || (request as any)._id}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Lựa chọn các túi máu gửi được từ kho của Trung tâm để điều phối cho bệnh viện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Requirement & Compatibility Card */}
          <div className="bg-gradient-to-r from-red-50/80 via-white to-amber-50/60 border border-red-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-brand-primary text-white font-extrabold text-base shadow-sm">
                  {recipientBloodType}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Nhu cầu còn thiếu:
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {remainingMl} ml
                    </span>
                    <span className="text-xs text-gray-500">
                      (Tổng cần: {request.requiredQuantityMl}ml)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-0.5">
                    <span>Đã nhận: <strong className="text-emerald-700">{currentReceived}ml</strong></span>
                    {currentInTransit > 0 && (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        📦 Đang chuyển: {currentInTransit}ml
                      </span>
                    )}
                    <span>• Mức độ: <strong className="text-brand-primary">{request.urgencyLevel}</strong></span>
                  </div>
                </div>
              </div>

              {/* Compatible Types List */}
              <div className="flex flex-col sm:items-end">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Nhóm máu tương thích cho phép:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {compatibleBloodTypes.map((type) => {
                    const isExact = type === recipientBloodType;
                    return (
                      <span
                        key={type}
                        className={`text-xs px-2 py-0.5 rounded-md font-bold transition-all ${
                          isExact
                            ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-primary'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {type} {isExact && '★'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Volume Progress Bar */}
            <div className="pt-2 border-t border-red-100/60">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-brand-primary" />
                  Thể tích đã chọn:
                  <strong
                    className={`ml-1 text-sm font-bold ${
                      isFulfilledAmount ? 'text-emerald-600' : 'text-brand-primary'
                    }`}
                  >
                    {selectedVolume} ml
                  </strong>{' '}
                  / {remainingMl} ml
                </span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                    isFulfilledAmount
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isFulfilledAmount
                    ? `✓ Đạt yêu cầu (${progressPercent}%)`
                    : `Còn thiếu ${Math.max(0, remainingMl - selectedVolume)} ml (${progressPercent}%)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isFulfilledAmount
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-brand-primary to-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="space-y-3">
            {/* Filter Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('sendable')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    filterTab === 'sendable'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Túi máu gửi được
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                      filterTab === 'sendable'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {sendableCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('exact')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    filterTab === 'exact'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>★ Khớp chính xác ({recipientBloodType})</span>
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                      filterTab === 'exact'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {exactMatchCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    filterTab === 'all'
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>Tất cả trong kho</span>
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                      filterTab === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {bags.length}
                  </span>
                </button>
              </div>

              {/* Action Buttons: Auto-select & Clear */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSelect}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
                  title="Tự động chọn túi tương thích theo hạn dùng gần nhất (FEFO)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Tự động chọn tối ưu
                </button>

                {selectedBagIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Bỏ chọn ({selectedBagIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Search & Blood Type Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã túi máu, vị trí lưu trữ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={selectedBloodTypeFilter}
                  onChange={(e) => setSelectedBloodTypeFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none bg-white text-gray-700 cursor-pointer"
                >
                  <option value="ALL">Lọc theo nhóm máu: Tất cả</option>
                  {compatibleBloodTypes.map((type) => (
                    <option key={type} value={type}>
                      {type} (Tương thích {type === recipientBloodType ? '★' : ''})
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
                    .filter((t) => !compatibleBloodTypes.includes(t))
                    .map((type) => (
                      <option key={type} value={type}>
                        {type} (Không tương thích)
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Blood Bags Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                  <p className="text-sm">Đang tải danh sách túi máu trong kho...</p>
                </div>
              ) : filteredBags.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                  <p className="text-sm font-medium text-gray-700">
                    Không tìm thấy túi máu phù hợp với điều kiện lọc
                  </p>
                  <p className="text-xs text-gray-400">
                    Thử chuyển sang tab "Tất cả trong kho" hoặc kiểm tra lại từ khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50/90 text-gray-600 font-semibold sticky top-0 backdrop-blur-xs border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-12 text-center">Chọn</th>
                      <th className="p-3">Mã túi máu</th>
                      <th className="p-3">Nhóm máu</th>
                      <th className="p-3">Thể tích</th>
                      <th className="p-3">Hạn sử dụng</th>
                      <th className="p-3">Khả năng gửi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBags.map((bag) => {
                      const bagId = bag._id || bag.id;
                      const isSelected = selectedBagIds.includes(bagId);
                      const { isSendable, isExactMatch, isCompatible, isExpired, daysRemaining, reason } =
                        bag.evaluation;

                      return (
                        <tr
                          key={bagId}
                          onClick={() => handleToggleSelect(bagId, isSendable)}
                          className={`transition-colors select-none ${
                            !isSendable
                              ? 'opacity-55 bg-gray-50/60 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-gray-50/90'
                          } ${isSelected ? 'bg-brand-primary/5 hover:bg-brand-primary/10' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={!isSendable}
                              onClick={() => handleToggleSelect(bagId, isSendable)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all mx-auto ${
                                !isSendable
                                  ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-brand-primary border-brand-primary text-white shadow-2xs'
                                  : 'border-gray-300 bg-white hover:border-brand-primary'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </td>

                          {/* Bag Code */}
                          <td className="p-3 font-semibold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <span>{bag.bagCode}</span>
                              {bag.storageLocation && (
                                <span className="text-[11px] text-gray-400 font-normal">
                                  ({bag.storageLocation})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Blood Type Badge */}
                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md font-extrabold text-xs ${
                                isExactMatch
                                  ? 'bg-brand-primary text-white shadow-2xs'
                                  : isCompatible
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {bag.bloodType}
                            </span>
                          </td>

                          {/* Volume */}
                          <td className="p-3 font-medium text-gray-800">
                            {bag.volumeMl} ml
                          </td>

                          {/* Expiry Date */}
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {new Date(bag.expiryDate).toLocaleDateString('vi-VN')}
                              </span>
                              <span
                                className={`text-[11px] font-medium flex items-center gap-1 ${
                                  isExpired
                                    ? 'text-red-600 font-bold'
                                    : daysRemaining <= 7
                                    ? 'text-amber-600 font-semibold'
                                    : 'text-gray-500'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {isExpired
                                  ? 'Đã hết hạn'
                                  : `Còn ${daysRemaining} ngày`}
                              </span>
                            </div>
                          </td>

                          {/* Compatibility Status Badge */}
                          <td className="p-3">
                            {isExactMatch && !isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Trùng khớp chính xác
                              </span>
                            ) : isCompatible && !isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                Tương thích cho phép
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200" title={reason}>
                                <Ban className="w-3.5 h-3.5 text-red-600" />
                                Đã hết hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600" title={reason}>
                                <Ban className="w-3.5 h-3.5 text-gray-400" />
                                Không tương thích
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              Đã chọn: <strong className="text-gray-900">{selectedBagIds.length} túi máu</strong>
            </div>
            <div
              className={`text-base sm:text-lg font-extrabold flex items-center gap-2 ${
                isFulfilledAmount ? 'text-emerald-600' : selectedVolume > 0 ? 'text-amber-600' : 'text-gray-900'
              }`}
            >
              <span>{selectedVolume} ml</span>
              <span className="text-xs font-normal text-gray-500">
                / {remainingMl} ml yêu cầu
              </span>
              {selectedVolume > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  isFulfilledAmount ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isFulfilledAmount ? 'Đủ 100%' : `Gửi trước ${progressPercent}%`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-300 rounded-xl font-semibold text-xs sm:text-sm text-gray-600 hover:bg-white hover:border-gray-400 transition-colors shadow-2xs disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedBagIds.length === 0 || submitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-sm flex items-center gap-2 ${
                selectedBagIds.length === 0 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isFulfilledAmount
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md cursor-pointer'
                    : 'bg-[#93000b] hover:bg-[#750009] active:scale-98 shadow-md cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý xuất kho...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {isFulfilledAmount ? 'Xác nhận gửi đủ máu' : `Xuất kho gửi trước (${selectedVolume}ml)`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
