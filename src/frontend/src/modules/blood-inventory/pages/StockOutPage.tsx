import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Square, ClipboardList, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../services/inventoryApi';
import type { BloodBagData } from '../../../services/mockData';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format, differenceInDays } from 'date-fns';

export const StockOutPage: React.FC = () => {
  const navigate = useNavigate();

  const [availableBags, setAvailableBags] = useState<BloodBagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');
  const searchParams = new URLSearchParams(window.location.search);
  const initialReason = searchParams.get('reason') as 'Dispatch' | 'Disposal' | 'Transfer' | 'Other' || 'Dispatch';
  const [reason, setReason] = useState<'Dispatch' | 'Disposal' | 'Transfer' | 'Other'>(initialReason);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    // Fetch available bags sorted by FEFO (expiryDate ASC)
    inventoryApi.getInventory({ status: 'Available' }).then((res) => {
      const sortedByFefo = [...res.data].sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      setAvailableBags(sortedByFefo);
      setLoading(false);
    });
  }, []);

  const nearExpiryBags = availableBags.filter((b) => {
    const diffDays = differenceInDays(new Date(b.expiryDate), new Date());
    return diffDays >= 0 && diffDays <= 7;
  });

  const filteredBags = availableBags.filter((b) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      (b.bagCode && b.bagCode.toLowerCase().includes(q)) ||
      (b.storageLocation && b.storageLocation.toLowerCase().includes(q)) ||
      (b._id && b._id.toLowerCase().includes(q));
    const matchesBloodType = bloodTypeFilter === 'All' || b.bloodType === bloodTypeFilter;
    return matchesSearch && matchesBloodType;
  });

  const toggleSelectBag = (id: string) => {
    if (selectedBagIds.includes(id)) {
      setSelectedBagIds(selectedBagIds.filter((bId) => bId !== id));
    } else {
      setSelectedBagIds([...selectedBagIds, id]);
    }
  };

  const handleSelectAllFefo = () => {
    const fefoIds = nearExpiryBags.map((b) => b._id);
    setSelectedBagIds((prev) => Array.from(new Set([...prev, ...fefoIds])));
    toast.info(`Đã tự động chọn ${fefoIds.length} túi máu gần hết hạn theo FEFO`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBagIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 túi máu để xuất kho');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.stockOut(selectedBagIds, reason, notes);
      toast.success(`Đã xuất kho thành công ${selectedBagIds.length} túi máu!`);
      navigate('/bc/inventory');
    } catch (err) {
      toast.error('Xuất kho thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    if (selectedBagIds.length > 0) {
      setShowCancelDialog(true);
    } else {
      navigate('/bc/inventory');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExit}
          className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Kho Máu</span>
        </button>
      </div>

      {/* 📋 FEFO Recommendation Panel (BC-UC-16 Special Requirement) */}
      {nearExpiryBags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              <span>Khuyến nghị ưu tiên xuất kho FEFO (First Expired, First Out)</span>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
              {nearExpiryBags.length} túi gần hết hạn (≤ 7 ngày)
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            Hệ thống phát hiện có <strong>{nearExpiryBags.length} túi máu</strong> sắp hết hạn trong 7 ngày tới. Bạn nên ưu tiên xuất các túi máu này trước để tránh lãng phí.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSelectAllFefo}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              ✓ Chọn tất cả túi máu gần hết hạn theo FEFO
            </button>
          </div>
        </div>
      )}

      {/* Main Stock Out Selection Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selection Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-3.5 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách túi máu sẵn có ({filteredBags.length}/{availableBags.length})
            </h3>
          </div>

          {/* Search & Blood Type Filter Bar */}
          <div className="space-y-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo Mã túi máu (BB-...), Vị trí lưu trữ..."
                className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 focus:border-[#93000b] rounded-lg text-xs text-[#271816] placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Blood Type Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1">Nhóm máu:</span>
              {['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBloodTypeFilter(type)}
                  className={`h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                    bloodTypeFilter === type
                      ? 'bg-[#93000b] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type === 'All' ? 'Tất cả' : type}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonLoader type="table" rows={4} />
          ) : filteredBags.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Không tìm thấy túi máu nào phù hợp với điều kiện tìm kiếm/lọc.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
              {filteredBags.map((bag) => {
                const isSelected = selectedBagIds.includes(bag._id);
                const diffDays = differenceInDays(new Date(bag.expiryDate), new Date());
                const isNearExpiry = diffDays >= 0 && diffDays <= 7;

                return (
                  <div
                    key={bag._id}
                    onClick={() => toggleSelectBag(bag._id)}
                    className={`p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer my-1 ${
                      isSelected
                        ? 'bg-red-50 border border-red-200'
                        : isNearExpiry
                        ? 'bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-red-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {bag.bagCode}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-black bg-red-600 text-white rounded">
                            {bag.bloodType}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">{bag.volumeMl}ml</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Vị trí: {bag.storageLocation}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-semibold ${isNearExpiry ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                        Hạn: {format(new Date(bag.expiryDate), 'dd/MM/yyyy')}
                      </p>
                      {isNearExpiry && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                          Còn {diffDays} ngày
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Reason & Submit Summary Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin xuất kho
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
              <span className="text-slate-500 block">Số túi máu đã chọn:</span>
              <span className="text-2xl font-black text-[#93000b]">{selectedBagIds.length} túi</span>
            </div>

            <FormField label="Lý do xuất kho" required>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="Dispatch">Cấp phát cho bệnh viện (Dispatch)</option>
                <option value="Transfer">Điều chuyển cơ sở khác (Transfer)</option>
                <option value="Disposal">Hủy bỏ túi hỏng/hết hạn (Disposal)</option>
                <option value="Other">Lý do khác (Other)</option>
              </select>
            </FormField>

            <FormField label="Ghi chú thêm">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập tên bệnh viện tiếp nhận hoặc ghi chú..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || selectedBagIds.length === 0}
              className="w-full h-10 bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
            >
              {isSubmitting ? 'Đang xuất kho...' : `Xác nhận xuất ${selectedBagIds.length} túi máu`}
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="w-full h-9 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </form>

      {/* Discard Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy xuất kho?"
        message="Danh sách túi máu đã chọn sẽ không được xuất. Bạn có chắc muốn hủy không?"
        onConfirm={() => navigate('/bc/inventory')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
