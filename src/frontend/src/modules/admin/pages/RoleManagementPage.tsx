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
    } catch (err: any) {
      toast.error('Failed to load roles and permissions matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
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
    } catch (err: any) {
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
    { name: 'System & Security', prefix: 'system:' },
    { name: 'User Management', prefix: 'users:' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Role & Permission Matrix</h1>
        <p className="text-sm text-slate-500">Configure role-based access control policies (AD-UC-03)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: System Roles List */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base mb-2">System Roles</h2>
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
                      ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{r.name}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                      {r.userCount} users
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{r.description}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Permission Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Permissions for: {selectedRole.name}
                    </h2>
                    {selectedRole.isSystemProtected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-semibold rounded-full border border-purple-200">
                        <Lock className="w-3 h-3" /> System Protected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50"
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
                    <div key={cat.name} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                        {cat.name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perms.map((p) => {
                          const isChecked = selectedPermissions.includes(p);
                          return (
                            <label
                              key={p}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-800 border-red-300 dark:border-red-900 text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <span className="font-mono">{p}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p)}
                                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
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
