import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, PackagePlus } from 'lucide-react';
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
      navigate('/bc/inventory');
    } catch (err) {
      toast.error('Nhập kho thất bại. Vui lòng kiểm tra lại dữ liệu.');
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
            <PackagePlus className="w-5 h-5 text-red-600" />
            <span>Nhập Kho Túi Mới (Stock In)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Đăng ký thông tin các đơn vị máu mới thu nhận sau khi kiểm định xét nghiệm
          </p>
        </div>
      </div>

      {/* Dynamic Multi-row Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đơn vị túi máu #{idx + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-slate-400 hover:text-red-600 p-1 transition-colors"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none bg-white font-bold text-red-600"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Ngày lấy máu" required>
                <input
                  type="date"
                  value={row.collectionDate}
                  onChange={(e) => updateRow(row.id, 'collectionDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Ngày hết hạn" required>
                <input
                  type="date"
                  value={row.expiryDate}
                  onChange={(e) => updateRow(row.id, 'expiryDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>

              <FormField label="Vị trí tủ lưu" required>
                <input
                  type="text"
                  value={row.storageLocation}
                  onChange={(e) => updateRow(row.id, 'storageLocation', e.target.value)}
                  placeholder="Khu A - Tủ 01"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none"
                />
              </FormField>
            </div>
          </div>
        ))}

        {/* Add Row Button */}
        <button
          type="button"
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-red-600 hover:text-red-600 text-slate-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-white/50"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm túi máu nữa</span>
        </button>

        {/* Action Controls */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
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
        onConfirm={() => navigate('/bc/inventory')}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
