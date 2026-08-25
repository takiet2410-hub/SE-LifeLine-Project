import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../services/inventoryApi';
import { FormField } from '../../../components/common/FormField';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

interface StockInRow {
  id: string;
  bloodType: string;
  volumeMl: number;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
}

export const StockInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackToList = () => {
    const invSearch = location.state?.fromInventorySearch || location.state?.fromSearch || '';
    navigate(`/bc/inventory${invSearch}`);
  };

  const [rows, setRows] = useState<StockInRow[]>([
    {
      id: 'row-1',
      bloodType: 'O+',
      volumeMl: 350,
      collectionDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString().split('T')[0],
      storageLocation: 'Khu A - Tủ đông 01',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        bloodType: 'O+',
        volumeMl: 350,
        collectionDate: lastRow?.collectionDate || new Date().toISOString().split('T')[0],
        expiryDate: lastRow?.expiryDate || new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString().split('T')[0],
        storageLocation: lastRow?.storageLocation || 'Khu A - Tủ đông 01',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof StockInRow, value: any) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.volumeMl <= 0) {
        toast.error(`Dòng ${i + 1}: Thể tích phải lớn hơn 0`);
        return;
      }
      if (new Date(r.expiryDate) <= new Date(r.collectionDate)) {
        toast.error(`Dòng ${i + 1}: Ngày hết hạn phải sau ngày lấy máu`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const entries = rows.map((r) => ({
        bloodType: r.bloodType,
        volumeMl: r.volumeMl,
        collectionDate: new Date(r.collectionDate).toISOString(),
        expiryDate: new Date(r.expiryDate).toISOString(),
        storageLocation: r.storageLocation,
      }));

      await inventoryApi.stockIn(entries);
      toast.success(`Đã nhập thành công ${rows.length} túi máu mới vào kho!`);
      handleBackToList();
    } catch (err) {
      toast.error('Nhập kho thất bại. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowCancelDialog(true)}
          className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Kho Máu</span>
        </button>
      </div>

      {/* Dynamic Multi-row Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đơn vị túi máu #{idx + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer"
                  title="Xóa dòng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <FormField label="Nhóm máu" required>
                <select
                  value={row.bloodType}
                  onChange={(e) => updateRow(row.id, 'bloodType', e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white font-bold text-red-600 cursor-pointer"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Thể tích (ml)" required>
                <input
                  type="number"
                  value={row.volumeMl}
                  onChange={(e) => updateRow(row.id, 'volumeMl', Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Ngày lấy máu" required>
                <input
                  type="date"
                  value={row.collectionDate}
                  onChange={(e) => updateRow(row.id, 'collectionDate', e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Ngày hết hạn" required>
                <input
                  type="date"
                  value={row.expiryDate}
                  onChange={(e) => updateRow(row.id, 'expiryDate', e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Vị trí tủ lưu" required>
                <input
                  type="text"
                  value={row.storageLocation}
                  onChange={(e) => updateRow(row.id, 'storageLocation', e.target.value)}
                  placeholder="Khu A - Tủ 01"
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>
            </div>
          </div>
        ))}

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="w-full h-11 border-2 border-dashed border-slate-300 hover:border-red-600 hover:text-red-600 text-slate-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-white/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm túi máu nữa</span>
        </button>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="h-10 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 text-sm font-semibold text-white bg-[#93000b] hover:bg-[#7a0009] rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang lưu...' : `Xác nhận nhập ${rows.length} túi máu`}</span>
          </button>
        </div>
      </form>

      {/* Discard Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Hủy nhập kho?"
        message="Thông tin túi máu vừa điền sẽ không được lưu. Bạn có chắc muốn hủy không?"
        onConfirm={handleBackToList}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
