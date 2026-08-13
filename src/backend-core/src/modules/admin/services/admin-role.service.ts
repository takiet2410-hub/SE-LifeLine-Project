import { Role, IRole } from '../models/role.model';
import { AdminAuditLog } from '../models/audit-log.model';
import { User } from '../../auth-account/models/user.model';

export const SYSTEM_PERMISSIONS = [
  // Campaign Management
  'campaign:read',
  'campaign:create',
  'campaign:edit',
  'campaign:delete',
  // Inventory Management
  'inventory:read',
  'inventory:stock_in',
  'inventory:stock_out',
  // SOS Emergency Management
  'sos:read',
  'sos:create',
  'sos:cancel',
  // Content & Articles
  'content:read',
  'content:create',
  'content:publish',
  // User & System Administration
  'users:read',
  'users:write',
  'roles:read',
  'roles:write',
  'system:config',
  'system:toggles',
  'system:logs',
];

export class AdminRoleService {
  async getRoles() {
    let roles = await Role.find().lean();

    if (!roles || roles.length === 0) {
      // Seed default system roles if database is empty
      await this.seedDefaultRoles();
      roles = await Role.find().lean();
    }

    // Count users for each role
    const items = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({
          $or: [{ role: role.name }, { roles: role.name }],
        });

        return {
          id: role._id.toString(),
          name: role.name,
          description: role.description,
          isSystemProtected: role.isSystemProtected,
          permissions: role.permissions,
          userCount,
        };
      })
    );

    return {
      roles: items,
      availablePermissions: SYSTEM_PERMISSIONS,
    };
  }

  async updateRolePermissions(
    adminUser: { id: string; name: string },
    roleId: string,
    permissions: string[],
    ipAddress: string
  ) {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found.');
    }

    const previousPermissions = [...role.permissions];
    role.permissions = permissions;
    await role.save();

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Update Role Permissions',
      actionCategory: 'Role Management',
      resourceType: 'Role',
      resourceId: roleId,
      previousValue: { permissions: previousPermissions },
      newValue: { permissions },
      ipAddress,
      status: 'Success',
    });

    return role;
  }

  private async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: 'Administrator',
        description: 'Full administrative access to manage users, roles, system configs, and monitoring logs.',
        isSystemProtected: true,
        permissions: SYSTEM_PERMISSIONS,
      },
      {
        name: 'BloodCenterStaff',
        description: 'Manage blood donation campaigns, donor registrations, and blood bag inventory.',
        isSystemProtected: true,
        permissions: [
          'campaign:read',
          'campaign:create',
          'campaign:edit',
          'inventory:read',
          'inventory:stock_in',
          'inventory:stock_out',
          'content:read',
          'content:create',
        ],
      },
      {
        name: 'HospitalStaff',
        description: 'Create and monitor SOS emergency blood requests for hospital emergency departments.',
        isSystemProtected: true,
        permissions: ['sos:read', 'sos:create', 'sos:cancel', 'inventory:read'],
      },
      {
        name: 'Donor',
        description: 'Standard donor account for browsing campaigns, scheduling appointments, and receiving SOS alerts.',
        isSystemProtected: true,
        permissions: ['campaign:read', 'content:read'],
      },
    ];

    await Role.insertMany(defaultRoles);
  }
}
