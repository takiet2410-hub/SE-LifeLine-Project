import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { ConfigCategoryGroup, ConfigItem } from '../types/admin.types';
import { Sliders, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const SystemConfigPage: React.FC = () => {
  const [categories, setCategories] = useState<ConfigCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getConfigs();
      setCategories(data.categories);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải cấu hình hệ thống.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchConfigs(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleConfigChange = (catIdx: number, itemIdx: number, value: number | boolean) => {
    setCategories((current) => current.map((category, currentCatIdx) =>
      currentCatIdx !== catIdx
        ? category
        : {
            ...category,
            items: category.items.map((item, currentItemIdx) =>
              currentItemIdx === itemIdx ? { ...item, value } : item
            ),
          }
    ));
  };

  const handleSaveConfig = async (item: ConfigItem) => {
    try {
      setSavingKey(item.key);
      await adminApi.updateConfig(item.key, item.value);
      toast.success(`Đã lưu cấu hình: ${item.label}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Không thể cập nhật ${item.label}.`));
      await fetchConfigs();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#271816]">System Configuration</h1>
        <p className="text-sm font-medium text-[#6c757d]">
          Platform-wide operational parameters & eligibility threshold rules (AD-UC-05)
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading configurations...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((group, catIdx) => (
            <div
              key={group.category}
              className="bg-white p-4 sm:p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-[#f1f3f5] pb-3">
                <Sliders className="w-5 h-5 text-[#93000b]" />
                <h2 className="font-bold text-[#271816] text-base">{group.category}</h2>
              </div>

              <div className="space-y-4">
                {group.items.map((item, itemIdx) => {
                  const isSaving = savingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="p-4 bg-[#fff8f7] rounded-xl border border-[#f1f3f5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-sm text-[#271816]">
                            {item.label}
                          </label>
                          {item.unit && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-red-50 text-[#93000b] border border-red-100 rounded-full">
                              {item.unit}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-[#5b403d] font-medium mt-1 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof item.value === 'boolean' ? (
                          <button
                            onClick={() => {
                              handleConfigChange(catIdx, itemIdx, !item.value);
                              handleSaveConfig({ ...item, value: !item.value });
                            }}
                            className={`w-12 h-6 rounded-full transition relative cursor-pointer ${
                              item.value ? 'bg-[#93000b]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${
                                item.value ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={typeof item.value === 'number' ? item.value : ''}
                              onChange={(e) => handleConfigChange(catIdx, itemIdx, Number(e.target.value))}
                              onBlur={() => handleSaveConfig(item)}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#271816] text-center focus:ring-2 focus:ring-[#93000b] outline-hidden"
                            />
                          </div>
                        )}

                        {isSaving ? (
                          <span className="text-xs text-slate-400 font-mono">Saving...</span>
                        ) : (
                          <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
