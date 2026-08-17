import { CURRENT_ROLE_PERMISSIONS_VERSION, Role } from '../models/role.model';
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
  // Notification Administration
  'notifications:send',
  'notifications:templates',
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
    // Repair individual missing system roles without overwriting customized permissions.
    await this.seedDefaultRoles();
    const roles = await Role.find().lean();

    // Count users for each role
    const items = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({
          $or: [{ role: role.name as any }, { roles: role.name as any }],
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
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array.');
    }
    const normalizedPermissions = Array.from(new Set(permissions));
    const invalidPermissions = normalizedPermissions.filter((permission) => !SYSTEM_PERMISSIONS.includes(permission));
    if (invalidPermissions.length > 0) {
      throw new Error(`Unsupported permissions: ${invalidPermissions.join(', ')}.`);
    }

    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found.');
    }
    if (role.name === 'Administrator') {
      const missingAdminPermissions = SYSTEM_PERMISSIONS.filter((permission) => !normalizedPermissions.includes(permission));
      if (missingAdminPermissions.length > 0) {
        throw new Error(`Administrator is system-protected and must retain all permissions. Missing: ${missingAdminPermissions.join(', ')}.`);
      }
    }

    const previousPermissions = [...role.permissions];
    const previousPermissionsVersion = role.permissionsVersion;
    role.permissions = normalizedPermissions;
    role.permissionsVersion = CURRENT_ROLE_PERMISSIONS_VERSION;
    await role.save();

    try {
      await AdminAuditLog.create({
        actorUserId: adminUser.id,
        actorName: adminUser.name,
        action: 'Update Role Permissions',
        actionCategory: 'Role Management',
        resourceType: 'Role',
        resourceId: roleId,
        previousValue: { permissions: previousPermissions },
        newValue: { permissions: normalizedPermissions },
        ipAddress,
        status: 'Success',
      });
    } catch (error) {
      role.permissions = previousPermissions;
      role.permissionsVersion = previousPermissionsVersion;
      await role.save();
      throw error;
    }

    return role;
  }

  private async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: 'Administrator',
        description: 'Full administrative access to manage users, roles, system configs, and monitoring logs.',
        isSystemProtected: true,
        permissions: SYSTEM_PERMISSIONS,
        permissionsVersion: CURRENT_ROLE_PERMISSIONS_VERSION,
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
          'sos:read',
          'content:read',
          'content:create',
        ],
        permissionsVersion: CURRENT_ROLE_PERMISSIONS_VERSION,
      },
      {
        name: 'HospitalStaff',
        description: 'Create and monitor SOS emergency blood requests for hospital emergency departments.',
        isSystemProtected: true,
        permissions: [
          'sos:read',
          'sos:create',
          'sos:cancel',
          'inventory:read',
          'content:read',
          'content:create',
        ],
        permissionsVersion: CURRENT_ROLE_PERMISSIONS_VERSION,
      },
      {
        name: 'Donor',
        description: 'Standard donor account for browsing campaigns, scheduling appointments, and receiving SOS alerts.',
        isSystemProtected: true,
        permissions: ['campaign:read', 'content:read'],
        permissionsVersion: CURRENT_ROLE_PERMISSIONS_VERSION,
      },
    ];

    await Role.bulkWrite(defaultRoles.map((role) => ({
      updateOne: {
        filter: { name: role.name },
        update: { $setOnInsert: role },
        upsert: true,
      },
    })));
  }
}
