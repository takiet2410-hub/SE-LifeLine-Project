import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, History, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../services/inventoryApi';
import type { BloodBagData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { FormField } from '../../../components/common/FormField';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format, differenceInDays } from 'date-fns';

export const BloodBagDetailPage: React.FC = () => {
  const { bagId } = useParams<{ bagId: string }>();
  const navigate = useNavigate();

  const [bag, setBag] = useState<BloodBagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [newStatus, setNewStatus] = useState<BloodBagData['status']>('Available');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bagId) {
      inventoryApi.getBloodBagById(bagId).then((data) => {
        setBag(data);
        if (data) {
          setNewStatus(data.status);
        }
        setLoading(false);
      });
    }
  }, [bagId]);

  if (loading) return <SkeletonLoader type="form" />;
  if (!bag) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy túi máu.</p>
        <button
          onClick={() => navigate('/bc/inventory')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Quay lại danh sách kho
        </button>
      </div>
    );
  }

  const isExpired = bag.status === 'Expired' || differenceInDays(new Date(bag.expiryDate), new Date()) < 0;
  const isUsed = bag.status === 'Used';
  const isLocked = isExpired || isUsed || bag.status === 'Discarded';

  // Valid status transitions based on current status (BC-UC-14)
  const getValidTransitions = (current: BloodBagData['status']) => {
    if (current === 'Available') return ['Available', 'Reserved', 'Used', 'Expired', 'Discarded'];
    if (current === 'Reserved') return ['Reserved', 'Available', 'Used', 'Discarded'];
    return [current]; // Terminal states: Used, Expired, Discarded
  };

  const validTransitions = getValidTransitions(bag.status);

  const handleSaveStatus = async () => {
    if (!bagId || isLocked) return;
    setIsSubmitting(true);
    try {
      const updated = await inventoryApi.updateStatus(bagId, newStatus, reason);
      setBag(updated);
      setIsEditing(false);
      setReason('');
      toast.success('Cập nhật trạng thái túi máu thành công!');
    } catch (err) {
      toast.error('Cập nhật thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bc/inventory')}
            className="h-10 px-3.5 rounded-xl bg-white border border-[#f1f3f5] hover:bg-slate-50 text-[#6c757d] hover:text-[#271816] transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Kho Máu</span>
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-mono">{bag.bagCode}</h2>
            <StatusBadge status={bag.status} />
          </div>
        </div>

        {!isEditing && (
          <button
            disabled={isLocked}
            onClick={() => {
              if (!isLocked) setIsEditing(true);
            }}
            className={`h-10 px-4 text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors ${
              isLocked
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-[#93000b] hover:bg-[#7a0009] text-white cursor-pointer'
            }`}
            title={
              isExpired
                ? 'Túi máu đã hết hạn sử dụng (không thể cập nhật)'
                : isUsed
                ? 'Túi máu đã được xuất dùng (không thể cập nhật)'
                : 'Cập nhật trạng thái túi máu'
            }
          >
            <Edit3 className="w-4 h-4" />
            <span>Cập nhật trạng thái</span>
          </button>
        )}
      </div>

      {/* Expired Warning Banner (BC-UC-14 AF-02) */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-bold">Túi máu đã hết hạn sử dụng!</p>
            <p className="text-xs text-red-700 mt-0.5">
              Theo quy định an toàn huyết học, trạng thái túi máu đã hết hạn không thể thay đổi thủ công.
            </p>
          </div>
        </div>
      )}

      {/* Used Info Banner */}
      {isUsed && !isExpired && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-800 text-sm">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <p className="font-bold">Túi máu đã được xuất kho / sử dụng!</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Túi máu đã hoàn tất chu trình sử dụng và được lưu trữ hồ sơ vĩnh viễn (không thể thay đổi trạng thái).
            </p>
          </div>
        </div>
      )}

      {/* Donor & Campaign Context */}
      {(() => {
        const donorObj = typeof bag.donorSourceId === 'object' ? (bag.donorSourceId as any) : null;
        const campObj = typeof bag.campaignSourceId === 'object' ? (bag.campaignSourceId as any) : null;

        const donorName = donorObj?.fullName || (bag as any).donorName || 'Chưa cập nhật';
        const donorPhone = donorObj?.phoneNumber || donorObj?.phone || 'Chưa cập nhật';

        const campaignName = campObj?.name || (bag as any).campaignName || 'Chiến dịch tiếp nhận máu';
        const campaignVenue = campObj?.venue || campObj?.fullAddress || 'TT Truyền Máu';
        const campaignCode = campObj?.campaignCode || 'CP-2026-001';

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[13px]">👤</span>
                <span>Hồ Sơ Người Hiến</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Họ & Tên</span>
                  <span className="font-bold text-slate-800">{donorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Số điện thoại</span>
                  <span className="font-medium text-slate-800">{donorPhone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Kết quả Test Sinh Hóa</span>
                  <span className={`font-bold ${bag.testResult === 'Pass' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {bag.testResult === 'Pass' ? '✅ Đạt tiêu chuẩn' : (bag.testResult || 'Đang chờ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-[13px]">🚩</span>
                <span>Chiến Dịch Tiếp Nhận</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mã chiến dịch</span>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{campaignCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tên chiến dịch</span>
                  <span className="font-bold text-slate-800 text-right line-clamp-1 max-w-[220px]" title={campaignName}>
                    {campaignName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Địa điểm lấy máu</span>
                  <span className="font-medium text-slate-800 text-right line-clamp-1 max-w-[220px]" title={campaignVenue}>
                    {campaignVenue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Bag Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            <span>Thông tin kỹ thuật túi máu</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nhóm máu</span>
              <span className="font-black text-red-600 text-base">{bag.bloodType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Thể tích đơn vị</span>
              <span className="font-bold text-slate-800">{bag.volumeMl} ml</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Ngày lấy máu</span>
              <span className="font-medium text-slate-800">
                {format(new Date(bag.collectionDate), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Ngày hết hạn</span>
              <span className="font-bold text-amber-700">
                {format(new Date(bag.expiryDate), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Vị trí lưu trữ</span>
              <span className="font-semibold text-slate-800">{bag.storageLocation}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Status Change Form or Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Thay đổi trạng thái túi máu
              </h3>

              <FormField label="Trạng thái mới" required>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white font-medium"
                >
                  {validTransitions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Lý do chuyển trạng thái">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập ghi chú lý do thay đổi..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu trạng thái mới'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                <span>Lịch sử thay đổi trạng thái (Audit Log)</span>
              </h3>

              {bag.statusHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có ghi nhận thay đổi trạng thái.</p>
              ) : (
                <div className="space-y-3">
                  {bag.statusHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800">
                          {entry.previousStatus} → <span className="text-red-600">{entry.newStatus}</span>
                        </span>
                        <span className="text-slate-400 font-normal">
                          {format(new Date(entry.changedAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-slate-500">Thực hiện bởi: {entry.changedBy}</p>
                      {entry.reason && (
                        <p className="text-slate-600 font-medium italic">Lý do: {entry.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
