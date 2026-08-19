import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api';
import type { RoleItem } from '../types/admin.types';
import { Shield, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';

export const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoles();
      setRoles(data.roles);
      setAvailablePermissions(data.availablePermissions);
      if (data.roles.length > 0 && !selectedRole) {
        setSelectedRole(data.roles[0]);
        setSelectedPermissions(data.roles[0].permissions);
      }
    } catch {
      toast.error('Failed to load roles and permissions matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchRoles(), 0);
    return () => window.clearTimeout(timer);
    // Initial load only; subsequent refreshes are triggered after successful saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions);
  };

  const handleTogglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await adminApi.updateRolePermissions(selectedRole.id, selectedPermissions);
      toast.success(`Updated permission matrix for ${selectedRole.name}`);
      fetchRoles();
    } catch {
      toast.error('Failed to update role permissions');
    } finally {
      setSaving(false);
    }
  };

  const permissionCategories = [
    { name: 'Campaign Management', prefix: 'campaign:' },
    { name: 'Blood Inventory', prefix: 'inventory:' },
    { name: 'SOS Emergency System', prefix: 'sos:' },
    { name: 'Content & Articles', prefix: 'content:' },
    { name: 'Notification Administration', prefix: 'notifications:' },
    { name: 'System & Security', prefix: 'system:' },
    { name: 'User Management', prefix: 'users:' },
    { name: 'Role Management', prefix: 'roles:' },
  ];

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: System Roles List */}
        <div className="bg-white p-5 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-3">
          <h2 className="font-bold text-[#271816] text-base mb-2">System Roles</h2>
          {loading ? (
            <div className="text-xs text-slate-400 p-4">Loading system roles...</div>
          ) : (
            roles.map((r) => {
              const isSelected = selectedRole?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-[#93000b] bg-red-50/50'
                      : 'border-[#f1f3f5] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-[#93000b]' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm text-[#271816]">{r.name}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-[#271816] rounded-full">
                      {r.userCount} users
                    </span>
                  </div>
                  <p className="text-xs text-[#5b403d] font-medium mt-1 leading-snug">{r.description}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Permission Matrix */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-[#f1f3f5] shadow-xs space-y-6 min-w-0">
          {selectedRole ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f1f3f5] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[#271816]">
                      Permissions for: {selectedRole.name}
                    </h2>
                    {selectedRole.isSystemProtected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                        <Lock className="w-3 h-3" /> System Protected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5b403d] font-medium mt-0.5">{selectedRole.description}</p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 px-4 py-2 bg-[#93000b] hover:bg-[#780009] text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Matrix'}
                </button>
              </div>

              <div className="space-y-5">
                {permissionCategories.map((cat) => {
                  const perms = availablePermissions.filter((p) => p.startsWith(cat.prefix));
                  if (perms.length === 0) return null;

                  return (
                    <div key={cat.name} className="p-4 bg-[#fff8f7] rounded-xl border border-[#f1f3f5]">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-[#93000b] mb-3">
                        {cat.name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perms.map((p) => {
                          const isChecked = selectedPermissions.includes(p);
                          const isLockoutProtected = selectedRole.name === 'Administrator';
                          return (
                            <label
                              key={p}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                                isLockoutProtected ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                              } ${
                                isChecked
                                  ? 'bg-white border-red-300 text-[#271816] shadow-xs'
                                  : 'bg-transparent border-slate-200 text-[#6c757d]'
                              }`}
                            >
                              <span className="font-mono">{p}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isLockoutProtected}
                                onChange={() => handleTogglePermission(p)}
                                className="w-4 h-4 accent-[#93000b] rounded cursor-pointer disabled:cursor-not-allowed"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">Select a role to view permission matrix</div>
          )}
        </div>
      </div>
    </div>
  );
};
