import { User, IUser } from '../../auth-account/models/user.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { AdminAuditLog } from '../models/audit-log.model';
import { geocodeAddress } from '../../../shared/geocoding.util';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { Badge } from '../../auth-account/models/badge.model';
import { Notification } from '../../notification/models/Notification';
import { NotificationPreference } from '../../notification/models/NotificationPreference';
import { UserDevice } from '../../notification/models/UserDevice';
import { ChatConversation } from '../../chatbot/models/chat-conversation.model';
import { ChatMessage } from '../../chatbot/models/chat-message.model';

const VALID_ROLES = ['Donor', 'BloodCenterStaff', 'HospitalStaff', 'Administrator'] as const;
type UserRole = typeof VALID_ROLES[number];

const csvCell = (value: unknown): string => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

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
  hospitalId?: string;
  permanentAddress?: string;
  currentAddress?: string;
  address?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: 'Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator';
  roles?: ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
  accountStatus?: 'PendingVerification' | 'Active' | 'Suspended';
  bloodCenterId?: string;
  hospitalId?: string;
  permanentAddress?: string;
  currentAddress?: string;
  address?: string;
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

  const invalidRole = inputRoles.find((role) => !VALID_ROLES.includes(role as UserRole));
  if (invalidRole) {
    throw new Error(`Unsupported role '${invalidRole}'.`);
  }

  const normalizedRoles = Array.from(new Set(['Donor', ...inputRoles])) as ('Donor' | 'BloodCenterStaff' | 'HospitalStaff' | 'Administrator')[];
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
          $or: [{ fullName: searchRegex }, { _id: { $in: donorUserIds } }],
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
            { fullName: searchRegex },
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

    const items = users.map((user) => this.formatUser(user, donorMap.get(user._id.toString())));

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

  async getUserById(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID.');
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User account not found.');
    }
    const profile = await DonorProfile.findOne({ userId: user._id }).lean();
    return this.formatUser(user, profile);
  }

  async exportUsersCsv(query: GetUsersQuery) {
    const firstPage = await this.getUsers({ ...query, limit: 100, page: 1 });
    const items = [...firstPage.items];
    for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
      const result = await this.getUsers({ ...query, limit: 100, page });
      items.push(...result.items);
    }
    const headers = ['ID Document', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Registration Date'];
    const rows = items.map((u) => [
      csvCell(u.idDocumentNumber),
      csvCell(u.fullName),
      csvCell(u.email),
      csvCell(u.phone),
      csvCell(u.role),
      csvCell(u.accountStatus),
      csvCell(new Date(u.createdAt).toISOString()),
    ]);

    return ['\uFEFF' + headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async createUser(adminUser: { id: string; name: string }, data: CreateUserData, ipAddress: string) {
    const existing = await User.findOne({
      $or: [{ email: data.email.toLowerCase() }, { idDocumentNumber: data.idDocumentNumber }],
    });

    if (existing) {
      throw new Error(
        existing.isDeleted
          ? 'A deactivated account already uses this email or ID Document Number. Reactivate that account instead.'
          : 'User with this email or ID Document Number already exists.'
      );
    }

    const { roles, primaryRole } = validateAndNormalizeRoles(data);
    if (roles.some((role) => role !== 'Donor')) {
      throw new Error('Tài khoản mới phải bắt đầu với vai trò Donor. Hãy tạo Donor trước rồi xét cấp quyền công tác ở bước chỉnh sửa.');
    }
    await this.validateStaffOrganization(roles, data.hospitalId, data.bloodCenterId);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      idDocumentNumber: data.idDocumentNumber,
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      phone: data.phone,
      passwordHash,
      roles,
      role: primaryRole,
      accountStatus: 'Active',
      bloodCenterId: roles.includes('BloodCenterStaff') ? data.bloodCenterId : undefined,
      hospitalId: roles.includes('HospitalStaff') ? data.hospitalId : undefined,
      permanentAddress: data.permanentAddress || data.address,
      currentAddress: data.currentAddress || data.address,
    });

    try {
      if (roles.includes('Donor')) {
        const permanentAddr = data.permanentAddress || data.address || 'TP. Hồ Chí Minh';
        const currentAddr = data.currentAddress || data.address || permanentAddr;
        const coords = await geocodeAddress(currentAddr || permanentAddr);

        await DonorProfile.create({
          userId: newUser._id,
          fullName: data.fullName,
          idDocumentNumber: data.idDocumentNumber,
          dateOfBirth: new Date('1995-01-01'),
          gender: 'Other',
          bloodType: 'O+',
          phoneNumber: data.phone || '0900000000',
          permanentAddress: permanentAddr,
          currentAddress: currentAddr ? { fullAddress: currentAddr } : undefined,
          location: coords ? { type: 'Point', coordinates: coords } : undefined,
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
    } catch (error) {
      await DonorProfile.deleteOne({ userId: newUser._id });
      await User.deleteOne({ _id: newUser._id });
      throw error;
    }

    return newUser;
  }

  async updateUser(adminUser: { id: string; name: string }, userId: string, data: UpdateUserData, ipAddress: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }
    if (user.privacyPurgedAt) {
      throw new Error('A privacy-purged account cannot be edited or restored. Create a new account instead.');
    }
    if (data.fullName !== undefined) {
      throw new Error('Full Name là dữ liệu định danh theo CCCD và không thể thay đổi tại trang phân quyền.');
    }
    if (data.permanentAddress !== undefined) {
      throw new Error('Địa chỉ thường trú là dữ liệu định danh theo CCCD và không thể thay đổi tại trang phân quyền.');
    }

    const previousValue = {
      email: user.email,
      role: user.role || user.roles?.[0],
      roles: user.roles,
      accountStatus: user.accountStatus,
    };

    const currentRoles = Array.from(new Set([user.role, ...(user.roles || [])].filter(Boolean))) as UserRole[];
    const currentlyActiveAdmin = currentRoles.includes('Administrator') && user.accountStatus === 'Active' && !user.isDeleted;
    const normalized = data.roles || data.role ? validateAndNormalizeRoles(data) : undefined;
    const nextRoles = normalized?.roles || currentRoles;
    const nextStatus = data.accountStatus || user.accountStatus;
    const remainsActiveAdmin = nextRoles.includes('Administrator') && nextStatus === 'Active';
    const nextHospitalId = data.hospitalId || user.hospitalId?.toString();
    const nextBloodCenterId = data.bloodCenterId || user.bloodCenterId?.toString();

    if (adminUser.id === userId && !remainsActiveAdmin) {
      throw new Error('Administrators cannot remove their own Administrator role or suspend their own account.');
    }
    if (currentlyActiveAdmin && !remainsActiveAdmin) {
      const activeAdminCount = await this.countActiveAdministrators();
      if (activeAdminCount <= 1) {
        throw new Error('The last active Administrator account cannot be demoted or suspended.');
      }
    }

    await this.validateStaffOrganization(nextRoles, nextHospitalId, nextBloodCenterId);

    if (data.email !== undefined && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const duplicate = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: user._id } });
      if (duplicate) throw new Error('Another account already uses this email address.');
      user.email = data.email.toLowerCase();
    }
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.roles || data.role) {
      user.roles = normalized!.roles as any;
      user.role = normalized!.primaryRole as any;
    }
    if (data.accountStatus) {
      user.accountStatus = data.accountStatus;
      if (data.accountStatus === 'Active') {
        user.isDeleted = false;
        user.deletedAt = undefined;
        user.deletedBy = undefined;
        user.deletionReason = undefined;
        user.sessionExpiresAt = undefined;
      }
    }
    if (data.currentAddress !== undefined || data.address !== undefined) {
      user.currentAddress = data.currentAddress || data.address;
    }
    user.hospitalId = nextRoles.includes('HospitalStaff') ? nextHospitalId as any : undefined;
    user.bloodCenterId = nextRoles.includes('BloodCenterStaff') ? nextBloodCenterId as any : undefined;

    await user.save();

    if (user.roles?.includes('Donor') || user.role === 'Donor') {
      const existingProfile = await DonorProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        const permanentAddr = data.permanentAddress || data.address || 'TP. Hồ Chí Minh';
        const currentAddr = data.currentAddress || data.address || permanentAddr;
        const coords = await geocodeAddress(currentAddr || permanentAddr);
        await DonorProfile.create({
          userId: user._id,
          fullName: data.fullName || user.email.split('@')[0],
          idDocumentNumber: user.idDocumentNumber,
          dateOfBirth: new Date('1995-01-01'),
          gender: 'Other',
          bloodType: 'O+',
          phoneNumber: data.phone || user.phone || '0900000000',
          permanentAddress: permanentAddr,
          currentAddress: currentAddr ? { fullAddress: currentAddr } : undefined,
          location: coords ? { type: 'Point', coordinates: coords } : undefined,
          emergencyOptIn: true,
        });
      } else {
        const profileUpdates: any = {};
        if (data.currentAddress || data.address) {
          const addrStr = data.currentAddress || data.address;
          profileUpdates.currentAddress = { fullAddress: addrStr };
        }

        if (data.currentAddress || data.address) {
          const targetAddress =
            data.currentAddress ||
            data.address ||
            (existingProfile?.currentAddress as any)?.fullAddress ||
            existingProfile?.permanentAddress;

          if (targetAddress) {
            const coords = await geocodeAddress(targetAddress);
            if (coords) {
              profileUpdates.location = { type: 'Point', coordinates: coords };
            }
          }
        }

        if (Object.keys(profileUpdates).length > 0) {
          await DonorProfile.updateOne({ userId: user._id }, { $set: profileUpdates });
        }
      }
    }

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Update User',
      actionCategory: 'User Management',
      resourceType: 'User',
      resourceId: userId,
      previousValue,
      newValue: {
        email: user.email,
        role: user.role,
        roles: user.roles,
        accountStatus: user.accountStatus,
        hospitalId: user.hospitalId,
        bloodCenterId: user.bloodCenterId,
      },
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

    const userRoles = Array.from(new Set([user.role, ...(user.roles || [])].filter(Boolean)));
    if (userRoles.includes('Administrator') && user.accountStatus === 'Active' && !user.isDeleted) {
      const activeAdminCount = await this.countActiveAdministrators();
      if (activeAdminCount <= 1) {
        throw new Error('The last active Administrator account cannot be suspended.');
      }
    }

    // Verify confirmation phrase
    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('Confirmation username does not match account email.');
    }

    const previousValue = { accountStatus: user.accountStatus, email: user.email, isDeleted: user.isDeleted };
    const deletionSnapshot = {
      accountStatus: user.accountStatus,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      deletionReason: user.deletionReason,
      sessionExpiresAt: user.sessionExpiresAt,
    };

    // Soft delete preserves historical relations while revoking access immediately.
    user.accountStatus = 'Suspended';
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = adminUser.id;
    user.deletionReason = reason;
    user.sessionExpiresAt = new Date(); // Revoke sessions
    await user.save();

    try {
      await AdminAuditLog.create({
        actorUserId: adminUser.id,
        actorName: adminUser.name,
        action: 'Soft Delete User (Suspend)',
        actionCategory: 'User Management',
        resourceType: 'User',
        resourceId: userId,
        previousValue,
        newValue: { accountStatus: 'Suspended', isDeleted: true, reason },
        details: `Reason for deletion: ${reason}`,
        ipAddress,
        status: 'Success',
      });
    } catch (error) {
      user.accountStatus = deletionSnapshot.accountStatus;
      user.isDeleted = deletionSnapshot.isDeleted;
      user.deletedAt = deletionSnapshot.deletedAt;
      user.deletedBy = deletionSnapshot.deletedBy;
      user.deletionReason = deletionSnapshot.deletionReason;
      user.sessionExpiresAt = deletionSnapshot.sessionExpiresAt;
      await user.save();
      throw error;
    }

    return { message: 'User account successfully suspended/deactivated.' };
  }

  async restoreUser(
    adminUser: { id: string; name: string },
    userId: string,
    confirmationUsername: string,
    ipAddress: string
  ) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User account not found.');
    if (user.privacyPurgedAt) {
      throw new Error('This account has already been privacy-purged and cannot be restored. Create a new account instead.');
    }
    if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('Confirmation username does not match account email.');
    }
    if (user.accountStatus !== 'Suspended' && !user.isDeleted) {
      throw new Error('Only suspended or deactivated accounts can be restored.');
    }

    const snapshot = {
      accountStatus: user.accountStatus,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      deletionReason: user.deletionReason,
      sessionExpiresAt: user.sessionExpiresAt,
    };
    user.accountStatus = 'Active';
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.deletedBy = undefined;
    user.deletionReason = undefined;
    user.sessionExpiresAt = undefined;
    await user.save();

    try {
      await AdminAuditLog.create({
        actorUserId: adminUser.id,
        actorName: adminUser.name,
        action: 'Restore User Account',
        actionCategory: 'User Management',
        resourceType: 'User',
        resourceId: userId,
        previousValue: { accountStatus: snapshot.accountStatus, isDeleted: snapshot.isDeleted },
        newValue: { accountStatus: 'Active', isDeleted: false },
        ipAddress,
        status: 'Success',
      });
    } catch (error) {
      user.accountStatus = snapshot.accountStatus;
      user.isDeleted = snapshot.isDeleted;
      user.deletedAt = snapshot.deletedAt;
      user.deletedBy = snapshot.deletedBy;
      user.deletionReason = snapshot.deletionReason;
      user.sessionExpiresAt = snapshot.sessionExpiresAt;
      await user.save();
      throw error;
    }

    return { message: 'User account restored successfully.' };
  }

  async purgePersonalData(
    adminUser: { id: string; name: string },
    userId: string,
    reason: string,
    confirmationUsername: string,
    adminPassword: string,
    ipAddress: string
  ) {
    if (adminUser.id === userId) {
      throw new Error('Administrators cannot purge their own account.');
    }

    const actingAdmin = await User.findById(adminUser.id);
    if (!actingAdmin || !(await bcrypt.compare(adminPassword, actingAdmin.passwordHash))) {
      throw new Error('Administrator re-authentication failed.');
    }

    const replacementPasswordHash = await bcrypt.hash(randomUUID(), 10);
    const tombstoneEmail = `deleted+${userId}@lifeline.invalid`;
    const tombstoneDocument = `deleted-${userId}`;
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User account not found.');
        if (user.privacyPurgedAt) throw new Error('Personal data has already been purged for this account.');
        if (user.accountStatus !== 'Suspended' || !user.isDeleted) {
          throw new Error('The account must be suspended before personal data can be purged.');
        }
        if (confirmationUsername.toLowerCase() !== user.email.toLowerCase()) {
          throw new Error('Confirmation username does not match account email.');
        }

        const userRoles = Array.from(new Set([user.role, ...(user.roles || [])].filter(Boolean)));
        if (userRoles.includes('Administrator')) {
          throw new Error('Administrator accounts cannot be privacy-purged. Demote the account through the controlled role workflow first.');
        }

        const profile = await DonorProfile.findOne({ userId: user._id }).session(session);
        if (profile) {
          const conversationIds = await ChatConversation.distinct('_id', { donorId: profile._id }).session(session);
          if (conversationIds.length > 0) {
            await ChatMessage.deleteMany({ conversationId: { $in: conversationIds } }, { session });
            await ChatConversation.deleteMany({ _id: { $in: conversationIds } }, { session });
          }

          await DonorProfile.updateOne(
            { _id: profile._id },
            {
              $set: {
                fullName: 'Deleted Donor',
                dateOfBirth: new Date('1900-01-01T00:00:00.000Z'),
                idDocumentNumber: tombstoneDocument,
                phoneNumber: 'REDACTED',
                permanentAddress: 'REDACTED',
                bloodType: 'Unknown',
                totalDonations: 0,
                xp: 0,
                donorLevel: 1,
                emergencyOptIn: false,
                avatarUrl: '',
                achievements: [],
              },
              $unset: {
                currentAddress: 1,
                location: 1,
                lastDonationDate: 1,
                email: 1,
                gender: 1,
              },
            },
            { session }
          );
        }

        await Promise.all([
          UserDevice.deleteMany({ userId: user._id }, { session }),
          Notification.deleteMany({ recipientUserId: user._id }, { session }),
          NotificationPreference.deleteMany({ userId: user._id }, { session }),
          Badge.deleteMany({ donorId: user._id }, { session }),
        ]);

        user.email = tombstoneEmail;
        user.idDocumentNumber = tombstoneDocument;
        user.fullName = 'Deleted User';
        user.phone = undefined;
        user.passwordHash = replacementPasswordHash;
        user.roles = ['Donor'];
        user.role = 'Donor';
        user.bloodCenterId = undefined;
        user.permanentAddress = undefined;
        user.currentAddress = undefined;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLoginAt = undefined;
        user.sessionExpiresAt = new Date();
        user.deletionReason = reason;
        user.privacyPurgedAt = new Date();
        user.privacyPurgedBy = adminUser.id;
        await user.save({ session });

        // Preserve the audit trail structure while removing PII captured by older entries.
        await AdminAuditLog.updateMany(
          { resourceType: 'User', resourceId: userId },
          {
            $set: {
              previousValue: { redacted: true },
              newValue: { redacted: true },
              details: 'Personal data redacted by the privacy purge workflow.',
            },
          },
          { session }
        );
        await AdminAuditLog.create([{
          actorUserId: adminUser.id,
          actorName: adminUser.name,
          action: 'Privacy Purge User Data',
          actionCategory: 'User Management',
          resourceType: 'User',
          resourceId: userId,
          newValue: { privacyPurged: true, identifiersReleased: true },
          details: `Privacy purge completed. Reason: ${reason}`,
          ipAddress,
          status: 'Success',
        }], { session });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Transaction numbers are only allowed') || message.includes('replica set member or mongos')) {
        throw new Error(
          'Privacy purge requires MongoDB transaction support. Use MongoDB Atlas or configure the local MongoDB instance as a replica set.',
          { cause: error }
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return {
      message: 'Personal data purged. The previous email and ID Document Number can now be registered again.',
    };
  }

  private formatUser(user: any, profile?: any) {
    const userRoles = Array.from(
      new Set(['Donor', user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean))
    ) as UserRole[];
    const hasSOSLocation = Boolean(
      profile?.location?.type === 'Point' &&
      Array.isArray(profile.location.coordinates) &&
      profile.location.coordinates.length === 2 &&
      profile.location.coordinates.every((coordinate: unknown) => typeof coordinate === 'number' && Number.isFinite(coordinate))
    );
    const sosEligibilityIssues = [
      !profile || profile.bloodType === 'Unknown' ? 'BLOOD_TYPE_UNKNOWN' : null,
      !hasSOSLocation ? 'LOCATION_MISSING' : null,
      profile?.emergencyOptIn === false ? 'SOS_OPTED_OUT' : null,
      user.accountStatus !== 'Active' ? 'ACCOUNT_NOT_ACTIVE' : null,
      user.isDeleted ? 'ACCOUNT_DELETED' : null,
    ].filter(Boolean);

    return {
      id: user._id.toString(),
      idDocumentNumber: user.idDocumentNumber,
      email: user.email,
      phone: user.phone || 'N/A',
      fullName: profile?.fullName || user.fullName || user.email.split('@')[0],
      permanentAddress: profile?.permanentAddress || user.permanentAddress || '',
      currentAddress:
        profile?.currentAddress?.fullAddress ||
        (typeof profile?.currentAddress === 'string' ? profile.currentAddress : '') ||
        user.currentAddress ||
        '',
      hospitalId: user.hospitalId?.toString(),
      bloodCenterId: user.bloodCenterId?.toString(),
      role: user.role || userRoles[0] || 'Donor',
      roles: userRoles.length > 0 ? userRoles : ['Donor'],
      accountStatus: user.accountStatus,
      isDeleted: Boolean(user.isDeleted),
      privacyPurgedAt: user.privacyPurgedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      sosEligibility: {
        eligible: sosEligibilityIssues.length === 0,
        bloodType: profile?.bloodType || 'Unknown',
        emergencyOptIn: profile?.emergencyOptIn !== false,
        hasLocation: hasSOSLocation,
        issues: sosEligibilityIssues,
      },
    };
  }

  private countActiveAdministrators() {
    return User.countDocuments({
      accountStatus: 'Active',
      isDeleted: { $ne: true },
      $or: [{ role: 'Administrator' }, { roles: 'Administrator' }],
    });
  }

  private async validateStaffOrganization(
    roles: UserRole[],
    hospitalId?: string,
    bloodCenterId?: string
  ): Promise<void> {
    if (roles.includes('HospitalStaff')) {
      if (!hospitalId) {
        throw new Error('Phải chọn bệnh viện công tác khi cấp quyền HospitalStaff.');
      }
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        throw new Error(`Mã bệnh viện (hospitalId: '${hospitalId}') không hợp lệ.`);
      }
      const hospital = await Hospital.findById(hospitalId).select('_id').lean();
      if (!hospital) {
        throw new Error(`Bệnh viện với ID '${hospitalId}' không tồn tại trong hệ thống.`);
      }
    }

    if (roles.includes('BloodCenterStaff')) {
      if (!bloodCenterId) {
        throw new Error('Phải chọn trung tâm máu công tác khi cấp quyền BloodCenterStaff.');
      }
      if (!mongoose.Types.ObjectId.isValid(bloodCenterId)) {
        throw new Error(`Mã Blood Center (bloodCenterId: '${bloodCenterId}') không hợp lệ.`);
      }
      const center = await BloodCenter.findById(bloodCenterId).select('_id').lean();
      if (!center) {
        throw new Error(`Blood Center với ID '${bloodCenterId}' không tồn tại trong hệ thống.`);
      }
    }
  }
}
