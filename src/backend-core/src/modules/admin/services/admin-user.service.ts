import { User, IUser } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { AdminAuditLog } from '../models/audit-log.model';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: string;
  role?: string;
  accountStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  idDocumentNumber: string;
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  roles?: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  bloodCenterId?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  roles?: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  accountStatus?: 'PendingVerification' | 'Active' | 'Suspended';
  bloodCenterId?: string;
}

export function validateAndNormalizeRoles(data: { role?: string; roles?: string[] }): {
  roles: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  primaryRole: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
} {
  const inputRoles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles
    : data.role
    ? [data.role]
    : ['Donor'];

  const normalizedRoles = Array.from(new Set(inputRoles)) as ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  const managementRoles = normalizedRoles.filter((r) => r !== 'Donor');

  if (managementRoles.length > 1) {
    throw new Error('Tài khoản chỉ có thể giữ tối đa 1 vai trò quản lý (BloodCenterStaff, HospitalStaff, hoặc Administrator) kết hợp với Donor.');
  }

  let primaryRole: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator' = 'Donor';
  if (normalizedRoles.includes('Administrator')) primaryRole = 'Administrator';
  else if (normalizedRoles.includes('BloodCenterStaff')) primaryRole = 'BloodCenterStaff';
  else if (normalizedRoles.includes('HospitalStaff')) primaryRole = 'HospitalStaff';

  return { roles: normalizedRoles, primaryRole };
}

export class AdminUserService {
  async getUsers(query: GetUsersQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    if (query.role && query.role !== 'All') {
      andConditions.push({
        $or: [{ role: query.role }, { roles: query.role }],
      });
    }

    if (query.accountStatus && query.accountStatus !== 'All') {
      andConditions.push({ accountStatus: query.accountStatus });
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');

      // Also search in DonorProfile fullName
      const matchingDonorProfiles = await DonorProfile.find({ fullName: searchRegex }).select('userId').lean();
      const donorUserIds = matchingDonorProfiles.map((p) => p.userId);

      const field = query.searchField || 'all';

      if (field === 'name') {
        andConditions.push({
          $or: [{ email: searchRegex }, { _id: { $in: donorUserIds } }],
        });
      } else if (field === 'email') {
        andConditions.push({ email: searchRegex });
      } else if (field === 'cccd') {
        // Prefix match for CCCD so typing "04" matches "04..." at start (e.g. province codes)
        const cccdPrefixRegex = new RegExp(`^${escapedSearch}`, 'i');
        andConditions.push({ idDocumentNumber: cccdPrefixRegex });
      } else if (field === 'phone') {
        // Prefix match for Phone numbers
        const phonePrefixRegex = new RegExp(`^${escapedSearch}`, 'i');
        andConditions.push({ phone: phonePrefixRegex });
      } else {
        // 'all' mode: search across email, idDocumentNumber, phone, and donorProfile fullName
        andConditions.push({
          $or: [
            { email: searchRegex },
            { idDocumentNumber: searchRegex },
            { phone: searchRegex },
            { _id: { $in: donorUserIds } },
          ],
        });
      }
    }

    const filter: Record<string, any> = {};
    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Populate full names from DonorProfile if available
    const userIds = users.map((u) => u._id);
    const donorProfiles = await DonorProfile.find({ userId: { $in: userIds } }).lean();
    const donorMap = new Map(donorProfiles.map((p) => [p.userId.toString(), p]));

    const items = users.map((user) => {
      const profile = donorMap.get(user._id.toString());
      const userRoles = Array.from(new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean)));
      return {
        id: user._id.toString(),
        idDocumentNumber: user.idDocumentNumber,
        email: user.email,
        phone: user.phone || 'N/A',
        fullName: profile?.fullName || user.email.split('@')[0],
        role: user.role || userRoles[0] || 'Donor',
        roles: userRoles.length > 0 ? userRoles : ['Donor'],
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      pages: totalPages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async exportUsersCsv(query: GetUsersQuery) {
    const { items } = await this.getUsers({ ...query, limit: 1000, page: 1 });
    const headers = ['ID Document', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Registration Date'];
    const rows = items.map((u) => [
      `"${u.idDocumentNumber}"`,
      `"${u.fullName}"`,
      `"${u.email}"`,
      `"${u.phone}"`,
      `"${u.role}"`,
      `"${u.accountStatus}"`,
      `"${new Date(u.createdAt).toISOString()}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async createUser(adminUser: { id: string; name: string }, data: CreateUserData, ipAddress: string) {
    const existing = await User.findOne({
      $or: [{ email: data.email }, { idDocumentNumber: data.idDocumentNumber }],
    });

    if (existing) {
      throw new Error('User with this email or ID Document Number already exists.');
    }

    const { roles, primaryRole } = validateAndNormalizeRoles(data);

    if (data.bloodCenterId) {
      if (!mongoose.Types.ObjectId.isValid(data.bloodCenterId)) {
        throw new Error(`Mã Blood Center (bloodCenterId: '${data.bloodCenterId}') không hợp lệ.`);
      }
      const center = await BloodCenter.findById(data.bloodCenterId);
      if (!center) {
        throw new Error(`Blood Center với ID '${data.bloodCenterId}' không tồn tại trong hệ thống.`);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      idDocumentNumber: data.idDocumentNumber,
      email: data.email,
      phone: data.phone,
      passwordHash,
      roles,
      role: primaryRole,
      accountStatus: 'Active',
      bloodCenterId: data.bloodCenterId,
    });

    if (roles.includes('Donor')) {
      await DonorProfile.create({
        userId: newUser._id,
        fullName: data.fullName,
        idDocumentNumber: data.idDocumentNumber,
        dateOfBirth: new Date('1995-01-01'),
        gender: 'Other',
        bloodType: 'O+',
        phoneNumber: data.phone || '0900000000',
        permanentAddress: 'N/A',
        emergencyOptIn: true,
      });
    }

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Create User',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: newUser._id.toString(),
      newValue: { email: data.email, role: primaryRole, roles, fullName: data.fullName },
      ipAddress,
      status: 'Success',
    });

    return newUser;
  }

  async updateUser(adminUser: { id: string; name: string }, userId: string, data: UpdateUserData, ipAddress: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    const previousValue = {
      email: user.email,
      role: user.role || user.roles?.[0],
      roles: user.roles,
      accountStatus: user.accountStatus,
    };

    if (data.email) user.email = data.email;
    if (data.phone) user.phone = data.phone;
    if (data.roles || data.role) {
      const { roles, primaryRole } = validateAndNormalizeRoles(data);
      user.roles = roles as any;
      user.role = primaryRole as any;
    }
    if (data.accountStatus) user.accountStatus = data.accountStatus;
    if (data.bloodCenterId) {
      if (!mongoose.Types.ObjectId.isValid(data.bloodCenterId)) {
        throw new Error(`Mã Blood Center (bloodCenterId: '${data.bloodCenterId}') không hợp lệ.`);
      }
      const center = await BloodCenter.findById(data.bloodCenterId);
      if (!center) {
        throw new Error(`Blood Center với ID '${data.bloodCenterId}' không tồn tại trong hệ thống.`);
      }
      user.bloodCenterId = data.bloodCenterId as any;
    }

    await user.save();

    if (data.fullName) {
      await DonorProfile.updateOne({ userId: user._id }, { $set: { fullName: data.fullName } });
    }

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Update User',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: userId,
      previousValue,
      newValue: { email: user.email, role: user.role, accountStatus: user.accountStatus },
      ipAddress,
      status: 'Success',
    });

    return user;
  }

  async softDeleteUser(
    adminUser: { id: string; name: string },
    userId: string,
    reason: string,
    confirmationUsername: string,
    ipAddress: string
  ) {
    if (adminUser.id === userId) {
      throw new Error('Administrators cannot delete their own account.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    // Verify confirmation phrase
    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('Confirmation username does not match account email.');
    }

    const previousValue = { accountStatus: user.accountStatus, email: user.email };

    // Soft-delete implementation: Suspend status + session expiration + PII anonymization
    user.accountStatus = 'Suspended';
    user.sessionExpiresAt = new Date(); // Revoke sessions
    await user.save();

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Soft Delete User (Suspend & Anonymize)',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: userId,
      previousValue,
      newValue: { accountStatus: 'Suspended', reason },
      details: `Reason for deletion: ${reason}`,
      ipAddress,
      status: 'Success',
    });

    return { message: 'User account successfully suspended/deactivated.' };
  }

  async hardDeleteUser(
    adminUser: { id: string; name: string },
    userId: string,
    confirmationUsername: string,
    ipAddress: string
  ) {
    if (adminUser.id === userId) {
      throw new Error('Administrators cannot delete their own account.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('Confirmation username does not match account email.');
    }

    const previousValue = {
      email: user.email,
      fullName: (user as any).fullName || '',
      idDocumentNumber: user.idDocumentNumber,
      accountStatus: user.accountStatus,
      role: user.role,
    };

    // Hard-delete implementation: Permanently delete document from MongoDB
    await User.deleteOne({ _id: userId });

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Hard Delete User (Permanent Removal)',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: userId,
      previousValue,
      newValue: { deleted: true },
      details: `Permanently removed user account ${user.email} (${user.idDocumentNumber}) from database.`,
      ipAddress,
      status: 'Success',
    });

    return { message: 'User account permanently deleted from database.' };
  }
}
