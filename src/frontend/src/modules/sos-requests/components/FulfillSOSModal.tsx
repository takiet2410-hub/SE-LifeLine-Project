import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../../blood-inventory/services/inventoryApi';
import { sosApi } from '../services/sosApi';
import type { SOSRequest } from '../services/sosApi';
import { toast } from 'sonner';

interface FulfillSOSModalProps {
  request: SOSRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FulfillSOSModal: React.FC<FulfillSOSModalProps> = ({ request, isOpen, onClose, onSuccess }) => {
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBags();
      setSelectedBagIds([]);
    }
  }, [isOpen]);

  const fetchBags = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getInventory({
        // bloodType: request.bloodType,
        status: 'Available',
        limit: 100
      });
      if (res.success) {
        setBags(res.data);
      }
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (bagId: string) => {
    setSelectedBagIds(prev =>
      prev.includes(bagId) ? prev.filter(id => id !== bagId) : [...prev, bagId]
    );
  };

  const handleSubmit = async () => {
    if (selectedBagIds.length === 0) return;
    try {
      setSubmitting(true);
      await sosApi.fulfillFromInventory(request.id || (request as any)._id, selectedBagIds);
      toast.success('Successfully fulfilled SOS Request from inventory!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Failed to fulfill request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBags = bags.filter(b => b.bagCode.toLowerCase().includes(search.toLowerCase()));
  const remainingMl = request.requiredQuantityMl - (request.collectedQuantityMl || 0);
  const selectedVolume = selectedBagIds.reduce((sum, id) => {
    const bag = bags.find(b => b._id === id || b.id === id);
    return sum + (bag?.volumeMl || 0);
  }, 0);

  const isFulfilledAmount = selectedVolume >= remainingMl;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#f1f3f5] flex items-center justify-between bg-[#f8f9fa]">
          <h2 className="text-[18px] font-bold text-[#271816]">
            Fulfill Request from Inventory
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#6c757d]" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 flex gap-4 text-brand-primary items-center">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Requirement: {remainingMl}ml of {request.bloodType}</p>
              <p className="text-sm opacity-90">Select available blood bags from your center to fulfill this emergency request.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]" />
            <input
              type="text"
              placeholder="Search by Bag Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#dee2e6] rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div className="border border-[#f1f3f5] rounded-xl overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-[#6c757d]">Loading available bags...</div>
              ) : filteredBags.length === 0 ? (
                <div className="p-8 text-center text-[#6c757d]">No available bags found matching criteria.</div>
              ) : (
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#f8f9fa] text-[#6c757d] font-medium sticky top-0">
                    <tr>
                      <th className="p-3 w-12">Select</th>
                      <th className="p-3">Bag Code</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3">Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBags.map(bag => {
                      const bagId = bag._id || bag.id;
                      const isSelected = selectedBagIds.includes(bagId);
                      return (
                        <tr
                          key={bagId}
                          onClick={() => handleToggleSelect(bagId)}
                          className={`border-t border-[#f1f3f5] cursor-pointer hover:bg-[#f8f9fa] transition-colors ${isSelected ? 'bg-brand-primary/5' : ''}`}
                        >
                          <td className="p-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-[#dee2e6]'}`}>
                              {isSelected && <CheckCircle className="w-4 h-4" />}
                            </div>
                          </td>
                          <td className="p-3 font-medium">{bag.bagCode}</td>
                          <td className="p-3">{bag.volumeMl}ml</td>
                          <td className="p-3">{new Date(bag.expiryDate).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#f1f3f5] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <p className="text-[14px] text-[#6c757d]">Selected Volume:</p>
            <p className={`text-[18px] font-bold ${isFulfilledAmount ? 'text-brand-success' : 'text-brand-text-main'}`}>
              {selectedVolume}ml / {remainingMl}ml
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 border border-[#dee2e6] rounded-xl font-medium text-[#6c757d] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedBagIds.length === 0 || submitting || !isFulfilledAmount}
              className={`px-6 py-2 rounded-xl font-medium text-white transition-colors ${selectedBagIds.length === 0 || submitting || !isFulfilledAmount
                ? 'bg-[#dee2e6] cursor-not-allowed'
                : 'bg-brand-primary hover:bg-brand-primary/90 shadow-sm'
                }`}
            >
              {submitting ? 'Processing...' : 'Submit Fulfillment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
