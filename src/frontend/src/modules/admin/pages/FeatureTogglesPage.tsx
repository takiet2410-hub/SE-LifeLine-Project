import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { FeatureToggleItem } from '../types/admin.types';
import { ToggleLeft, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const FeatureTogglesPage: React.FC = () => {
  const [toggles, setToggles] = useState<FeatureToggleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingToggle, setPendingToggle] = useState<{ item: FeatureToggleItem; targetState: boolean } | null>(null);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getToggles();
      setToggles(data.toggles);
    } catch (err: any) {
      toast.error('Failed to fetch feature toggles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToggles();
  }, []);

  const handleToggleClick = (item: FeatureToggleItem) => {
    const targetState = !item.isEnabled;
    // If disabling a feature with active affected services/dependencies, show warning modal
    if (!targetState && item.affectedServices.length > 0) {
      setPendingToggle({ item, targetState });
    } else {
      executeToggleUpdate(item.key, targetState);
    }
  };

  const executeToggleUpdate = async (key: string, isEnabled: boolean) => {
    try {
      await adminApi.updateToggle(key, isEnabled);
      toast.success(`Feature toggle state updated.`);
      setPendingToggle(null);
      fetchToggles();
    } catch (err: any) {
      toast.error('Failed to update feature toggle.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#271816]">Feature Toggles</h1>
        <p className="text-sm font-medium text-[#6c757d]">
          Enable or disable platform modules without redeployment (AD-UC-06)
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading feature switches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toggles.map((item) => (
            <div
              key={item.key}
              className={`p-6 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                item.isEnabled
                  ? 'bg-white border-[#f1f3f5] shadow-xs'
                  : 'bg-slate-50/80 border-[#f1f3f5] opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <ToggleLeft className={`w-6 h-6 ${item.isEnabled ? 'text-[#93000b]' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-[#271816] text-base">{item.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleClick(item)}
                    className={`w-14 h-7 rounded-full transition relative p-0.5 cursor-pointer ${
                      item.isEnabled ? 'bg-[#93000b]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 bg-white rounded-full block shadow-md transition transform ${
                        item.isEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#5b403d] font-medium leading-relaxed mb-4">{item.description}</p>

                {item.affectedServices.length > 0 && (
                  <div className="p-3.5 bg-[#fff8f7] rounded-xl border border-[#f1f3f5]">
                    <span className="text-[10px] font-bold text-[#93000b] uppercase tracking-wider block mb-1.5">
                      Controlled Services
                    </span>
                    <ul className="space-y-1">
                      {item.affectedServices.map((svc) => (
                        <li key={svc} className="text-xs text-[#271816] font-semibold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#93000b] rounded-full" />
                          {svc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f3f5] flex justify-between text-[11px] font-semibold text-[#6c757d]">
                <span>Updated by: <strong className="text-[#271816]">{item.updatedBy || 'System'}</strong></span>
                <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Modal for Disabling Feature with Affected Services (AF-02) */}
      {pendingToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Impact Warning</h3>
              </div>
              <button
                onClick={() => setPendingToggle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Disabling <strong>{pendingToggle.item.name}</strong> will impact active platform microservices:
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block uppercase">
                Affected Services:
              </span>
              {pendingToggle.item.affectedServices.map((s) => (
                <div key={s} className="text-xs text-amber-900 dark:text-amber-300 font-medium flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {s}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPendingToggle(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => executeToggleUpdate(pendingToggle.item.key, false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md"
              >
                Proceed & Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
