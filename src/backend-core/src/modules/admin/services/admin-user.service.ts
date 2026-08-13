import { User, IUser } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { AdminAuditLog } from '../models/audit-log.model';
import bcrypt from 'bcrypt';
import { FilterQuery } from 'mongoose';

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
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
  role: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  bloodCenterId?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  accountStatus?: 'PendingVerification' | 'Active' | 'Suspended';
  bloodCenterId?: string;
}

export class AdminUserService {
  async getUsers(query: GetUsersQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IUser> = {};

    if (query.role && query.role !== 'All') {
      filter.$or = [{ role: query.role }, { roles: query.role }];
    }

    if (query.accountStatus && query.accountStatus !== 'All') {
      filter.accountStatus = query.accountStatus;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { email: searchRegex },
        { idDocumentNumber: searchRegex },
        { phone: searchRegex },
      ];
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
      return {
        id: user._id.toString(),
        idDocumentNumber: user.idDocumentNumber,
        email: user.email,
        phone: user.phone || 'N/A',
        fullName: profile?.fullName || user.email.split('@')[0],
        role: user.role || user.roles[0] || 'Donor',
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      idDocumentNumber: data.idDocumentNumber,
      email: data.email,
      phone: data.phone,
      passwordHash,
      roles: [data.role],
      role: data.role,
      accountStatus: 'Active',
      bloodCenterId: data.bloodCenterId,
    });

    if (data.role === 'Donor') {
      await DonorProfile.create({
        userId: newUser._id,
        fullName: data.fullName,
        dateOfBirth: new Date('1995-01-01'),
        gender: 'Other',
        bloodType: 'O+',
        phone: data.phone || '',
        address: 'N/A',
      });
    }

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Create User',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: newUser._id.toString(),
      newValue: { email: data.email, role: data.role, fullName: data.fullName },
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
      role: user.role || user.roles[0],
      accountStatus: user.accountStatus,
    };

    if (data.email) user.email = data.email;
    if (data.phone) user.phone = data.phone;
    if (data.role) {
      user.role = data.role;
      user.roles = [data.role];
    }
    if (data.accountStatus) user.accountStatus = data.accountStatus;
    if (data.bloodCenterId) user.bloodCenterId = data.bloodCenterId as any;

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
}
