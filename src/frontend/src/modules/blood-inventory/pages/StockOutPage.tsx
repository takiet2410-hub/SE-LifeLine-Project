import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckSquare, Square, ClipboardList } from 'lucide-react';
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
  const [reason, setReason] = useState<'Dispatch' | 'Disposal' | 'Transfer' | 'Other'>('Dispatch');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCancelDialog(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-red-600" />
            <span>Xuất Kho Túi Máu (Stock Out)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Chọn các túi máu xuất kho theo quy tắc ưu tiên FEFO (Hết hạn trước - Xuất trước)
          </p>
        </div>
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
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách túi máu sẵn có ({availableBags.length})
            </h3>
            <span className="text-xs text-slate-400">📋 Sắp xếp: Hết hạn trước lên đầu</span>
          </div>

          {loading ? (
            <SkeletonLoader type="table" rows={4} />
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
              {availableBags.map((bag) => {
                const isSelected = selectedBagIds.includes(bag._id);
                const diffDays = differenceInDays(new Date(bag.expiryDate), new Date());
                const isNearExpiry = diffDays >= 0 && diffDays <= 7;

                return (
                  <div
                    key={bag._id}
                    onClick={() => toggleSelectBag(bag._id)}
                    className={`p-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer my-1 ${
                      isSelected
                        ? 'bg-red-50 border border-red-200'
                        : isNearExpiry
                        ? 'bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60'
                        : 'hover:bg-slate-50'
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
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin xuất kho
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <span className="text-slate-500 block">Số túi máu đã chọn:</span>
              <span className="text-xl font-black text-red-600">{selectedBagIds.length} túi</span>
            </div>

            <FormField label="Lý do xuất kho" required>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white font-medium"
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
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
              />
            </FormField>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || selectedBagIds.length === 0}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors disabled:opacity-40"
            >
              {isSubmitting ? 'Đang xuất kho...' : `Xác nhận xuất ${selectedBagIds.length} túi máu`}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="w-full py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
