import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Heart, Sparkles, CheckCircle2, ShieldCheck, AlertCircle, X, Phone, CreditCard, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { sosApi, type SOSRequest } from '../services/sosApi';

interface RecordDirectDonationModalProps {
  request: SOSRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordDirectDonationModal: React.FC<RecordDirectDonationModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [donorName, setDonorName] = useState('');
  const [idDocumentNumber, setIdDocumentNumber] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [bloodType, setBloodType] = useState(request.bloodType || 'O+');
  const [fastTrackCode, setFastTrackCode] = useState('');
  const [volumeMl, setVolumeMl] = useState<number>(350);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick donors who already accepted the SOS
  const [acceptedDonorsList, setAcceptedDonorsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedDonor(null);
      setDonorName('');
      setIdDocumentNumber('');
      setDonorPhone('');
      setBloodType(request.bloodType || 'O+');
      setFastTrackCode('');
      setVolumeMl(350);
      setNote('');
      loadAcceptedDonors();
    }
  }, [isOpen, request]);

  const loadAcceptedDonors = async () => {
    try {
      const res = await sosApi.lookupDonor(request.id || (request as any)._id, 'SOS-');
      if (res.success && Array.isArray(res.data)) {
        setAcceptedDonorsList(res.data);
      }
    } catch (e) {
      // silent
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await sosApi.lookupDonor(request.id || (request as any)._id, searchQuery.trim());
      if (res.success && Array.isArray(res.data)) {
        setSearchResults(res.data);
        if (res.data.length === 1) {
          selectDonor(res.data[0]);
        } else if (res.data.length === 0) {
          toast.info('Không tìm thấy tài khoản donor phù hợp. Bạn có thể nhập thông tin trực tiếp bên dưới.');
        }
      }
    } catch (error: any) {
      toast.error('Lỗi khi tra cứu người hiến');
    } finally {
      setIsSearching(false);
    }
  };

  const selectDonor = (donor: any) => {
    setSelectedDonor(donor);
    setDonorName(donor.fullName || '');
    setIdDocumentNumber(donor.idDocumentNumber !== 'N/A' ? donor.idDocumentNumber : '');
    setDonorPhone(donor.phoneNumber !== 'N/A' ? donor.phoneNumber : '');
    setBloodType(donor.bloodType && donor.bloodType !== 'Unknown' ? donor.bloodType : request.bloodType);
    setFastTrackCode(donor.fastTrackCode || '');
    toast.success(`Đã chọn: ${donor.fullName}`);
  };

  const clearSelectedDonor = () => {
    setSelectedDonor(null);
    setDonorName('');
    setIdDocumentNumber('');
    setDonorPhone('');
    setFastTrackCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      toast.error('Vui lòng nhập họ tên người hiến máu');
      return;
    }
    if (!volumeMl || volumeMl <= 0) {
      toast.error('Vui lòng chọn hoặc nhập số ml máu hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        volumeMl: Number(volumeMl),
        fastTrackCode: fastTrackCode.trim() || undefined,
        donorId: selectedDonor?.donorId,
        donorName: donorName.trim(),
        idDocumentNumber: idDocumentNumber.trim() || undefined,
        donorPhone: donorPhone.trim() || undefined,
        bloodType: bloodType || request.bloodType,
        note: note.trim() || undefined
      };

      const res = await sosApi.recordDirectDonation(request.id || (request as any)._id, payload);
      toast.success(res.message || `Đã tiếp nhận thành công ${volumeMl}ml từ ${donorName}!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Tiếp nhận hiến máu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentReceived = request.receivedQuantityMl || request.collectedQuantityMl || 0;
  const currentInTransit = request.inTransitQuantityMl || 0;
  const remainingNeeded = Math.max(0, request.requiredQuantityMl - currentReceived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-red-50/80 to-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Tiếp Nhận Hiến Máu Trực Tiếp (Walk-in / SOS Donor)
              </h2>
              <p className="text-xs text-gray-600">
                Ghi nhận máu lấy tại viện theo Mã SOS, CCCD hoặc thông tin người hiến
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target & Status Summary */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Mục tiêu ca SOS:</span>
              <p className="text-sm font-bold text-gray-900">
                Nhóm {request.bloodType} — {request.requiredQuantityMl} ml
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Đã nhận / Còn thiếu:</span>
              <p className="text-sm font-bold text-emerald-700">
                {currentReceived} ml <span className="text-gray-400 font-normal">/</span>{' '}
                <span className="text-red-600 font-bold">{remainingNeeded} ml cần thêm</span>
              </p>
            </div>
          </div>

          {/* Section 1: Donor Search / Fast Track Code */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              1. Tra Cứu Người Hiến Máu (Mã SOS / CCCD / SĐT)
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập Mã SOS (vd: SOS-4D1A6B), số CCCD hoặc SĐT..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Đang tìm...' : 'Tra cứu'}
              </button>
            </form>

            {/* Quick accepted donors tags if available */}
            {acceptedDonorsList.length > 0 && !selectedDonor && (
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                  ⚡ Donor vừa bấm sẵn sàng giúp ca SOS này:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {acceptedDonorsList.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDonor(d)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{d.fullName}</span>
                      <span className="font-mono text-[10px] bg-emerald-200/80 px-1 py-0.2 rounded font-bold">
                        {d.fastTrackCode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results list */}
            {searchResults.length > 0 && !selectedDonor && (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-xs max-h-40 overflow-y-auto">
                {searchResults.map((d, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectDonor(d)}
                    className="p-2.5 hover:bg-red-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{d.fullName}</span>{' '}
                      <span className="text-gray-500 font-mono text-[11px]">({d.idDocumentNumber})</span>
                      <div className="text-[11px] text-gray-500">SĐT: {d.phoneNumber} — Nhóm máu: {d.bloodType}</div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[11px] font-bold"
                    >
                      Chọn
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Donor Badge Card */}
            {selectedDonor && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedDonor.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-950">{selectedDonor.fullName}</span>
                      {selectedDonor.fastTrackCode && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                          {selectedDonor.fastTrackCode}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Tự động cộng <strong>+150 XP</strong> & cập nhật lịch sử hiến máu khi xác nhận
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedDonor}
                  className="text-xs text-emerald-800 hover:text-red-600 font-semibold px-2 py-1"
                >
                  Đổi
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Donor Info Inputs */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              2. Thông Tin Người Hiến & Lượng Máu Lấy
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Họ và tên người hiến *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Số CCCD / Định danh
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={idDocumentNumber}
                    onChange={(e) => setIdDocumentNumber(e.target.value)}
                    placeholder="049206001105"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nhóm máu hiến
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            {/* Volume Selection Preset Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                Thể tích máu tiếp nhận (ml) *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[250, 350, 450].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolumeMl(v)}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      volumeMl === v
                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {v} ml
                  </button>
                ))}
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(Number(e.target.value))}
                    placeholder="Tùy chọn"
                    className="w-full text-center py-2 px-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                    ml
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Ghi chú / Mã túi máu nội bộ (Tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Lấy tại Phòng cấp cứu, túi mã BAG-2026-001..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            Cộng thêm: <strong className="text-red-700 font-bold">+{volumeMl} ml</strong> vào ca SOS
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-xs sm:text-sm text-gray-600 hover:bg-white transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !donorName.trim() || volumeMl <= 0}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận tiếp nhận ({volumeMl}ml)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
