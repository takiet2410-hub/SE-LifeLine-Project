import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { ConfigCategoryGroup, ConfigItem } from '../types/admin.types';
import { Sliders, Check } from 'lucide-react';
import { toast } from 'sonner';

export const SystemConfigPage: React.FC = () => {
  const [categories, setCategories] = useState<ConfigCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getConfigs();
      setCategories(data.categories);
    } catch (err: any) {
      toast.error('Failed to load system configuration values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleConfigChange = (catIdx: number, itemIdx: number, val: any) => {
    const nextCategories = [...categories];
    nextCategories[catIdx].items[itemIdx].value = val;
    setCategories(nextCategories);
  };

  const handleSaveConfig = async (item: ConfigItem) => {
    try {
      setSavingKey(item.key);
      await adminApi.updateConfig(item.key, item.value);
      toast.success(`Saved configuration: ${item.label}`);
    } catch (err: any) {
      toast.error(`Failed to update ${item.label}`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Configuration</h1>
        <p className="text-sm text-slate-500">
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
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sliders className="w-5 h-5 text-red-600" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">{group.category}</h2>
              </div>

              <div className="space-y-4">
                {group.items.map((item, itemIdx) => {
                  const isSaving = savingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.label}
                          </label>
                          {item.unit && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                              {item.unit}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof item.value === 'boolean' ? (
                          <button
                            onClick={() => {
                              handleConfigChange(catIdx, itemIdx, !item.value);
                              handleSaveConfig({ ...item, value: !item.value });
                            }}
                            className={`w-12 h-6 rounded-full transition relative ${
                              item.value ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
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
                              value={item.value}
                              onChange={(e) => handleConfigChange(catIdx, itemIdx, Number(e.target.value))}
                              onBlur={() => handleSaveConfig(item)}
                              className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-center focus:ring-2 focus:ring-red-500 outline-hidden"
                            />
                          </div>
                        )}

                        {isSaving ? (
                          <span className="text-xs text-slate-400 font-mono">Saving...</span>
                        ) : (
                          <Check className="w-4 h-4 text-emerald-500 opacity-60" />
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
