import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');
const role = z.enum(['Donor', 'BloodCenterStaff', 'HospitalStaff', 'Administrator']);
const accountStatus = z.enum(['PendingVerification', 'Active', 'Suspended']);

const rolesShape = {
  role: role.optional(),
  roles: z.array(role).min(1).max(2).optional(),
};

const validateRoleCombination = (data: { role?: string; roles?: string[] }, ctx: z.RefinementCtx) => {
  const assignedRoles = data.roles?.length ? data.roles : data.role ? [data.role] : [];
  const managementRoles = new Set(assignedRoles.filter((item) => item !== 'Donor'));
  if (managementRoles.size > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['roles'],
      message: 'Only one management role can be combined with Donor.',
    });
  }
};

const validateImmutableIdentityFields = (
  data: { fullName?: string; permanentAddress?: string },
  ctx: z.RefinementCtx
) => {
  if (data.fullName !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fullName'],
      message: 'Full Name is fixed from the CCCD identity profile and cannot be changed here.',
    });
  }
  if (data.permanentAddress !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['permanentAddress'],
      message: 'Permanent Address is fixed from the CCCD identity profile and cannot be changed here.',
    });
  }
};

const validateNewAccountStartsAsDonor = (data: { role?: string; roles?: string[] }, ctx: z.RefinementCtx) => {
  const assignedRoles = data.roles?.length ? data.roles : data.role ? [data.role] : ['Donor'];
  if (assignedRoles.some((assignedRole) => assignedRole !== 'Donor')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['roles'],
      message: 'A new account must start as Donor. Grant a staff role later from the edit flow.',
    });
  }
};

export const AdminUserListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(200).optional(),
    searchField: z.enum(['all', 'name', 'email', 'cccd', 'phone']).optional(),
    role: z.union([role, z.literal('All')]).optional(),
    accountStatus: z.union([accountStatus, z.literal('All')]).optional(),
    sortBy: z.enum(['createdAt', 'email', 'accountStatus', 'lastLoginAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const AdminUserIdSchema = z.object({
  params: z.object({ userId: objectId }),
});

export const AdminCreateUserSchema = z.object({
  body: z.object({
    idDocumentNumber: z.string().trim().regex(/^\d{12}$/, 'ID Document Number must contain exactly 12 digits.'),
    email: z.string().trim().toLowerCase().email().max(254),
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?\d{9,15}$/, 'Invalid phone number.').optional().or(z.literal('')),
    password: z.string().min(8).max(72),
    ...rolesShape,
    bloodCenterId: objectId.optional(),
    hospitalId: objectId.optional(),
    permanentAddress: z.string().trim().max(500).optional(),
    currentAddress: z.string().trim().max(500).optional(),
    address: z.string().trim().max(500).optional(),
  }).superRefine((data, ctx) => {
    validateRoleCombination(data, ctx);
    validateNewAccountStartsAsDonor(data, ctx);
  }),
});

export const AdminUpdateUserSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    phone: z.string().trim().regex(/^\+?\d{9,15}$/, 'Invalid phone number.').optional().or(z.literal('')),
    ...rolesShape,
    accountStatus: accountStatus.optional(),
    bloodCenterId: objectId.optional(),
    hospitalId: objectId.optional(),
    permanentAddress: z.string().trim().max(500).optional(),
    currentAddress: z.string().trim().max(500).optional(),
    address: z.string().trim().max(500).optional(),
  }).superRefine((data, ctx) => {
    validateRoleCombination(data, ctx);
    validateImmutableIdentityFields(data, ctx);
  }),
});

export const AdminDeleteUserSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({
    reason: z.string().trim().min(3).max(500),
    confirmationUsername: z.string().trim().toLowerCase().email(),
  }),
});

export const AdminRestoreUserSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({
    confirmationUsername: z.string().trim().toLowerCase().email(),
  }),
});

export const AdminPurgeUserDataSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({
    reason: z.string().trim().min(10).max(500),
    confirmationUsername: z.string().trim().toLowerCase().email(),
    adminPassword: z.string().min(1).max(72),
  }),
});

export const AdminRolePermissionsSchema = z.object({
  params: z.object({ roleId: objectId }),
  body: z.object({
    permissions: z.array(z.string().trim().min(1)).max(100),
  }),
});

export const AdminLogListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(200).optional(),
    category: z.string().trim().max(100).optional(),
    status: z.enum(['All', 'Success', 'Failure']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const configValidators = {
  donationIntervalDays: z.number().int().min(1).max(365),
  minDonorAge: z.number().int().min(16).max(65),
  maxDonorAge: z.number().int().min(18).max(80),
  maxCampaignCapacity: z.number().int().min(1).max(100_000),
  sosSearchRadiusKm: z.number().min(1).max(500),
  sosMaxRadiusKm: z.number().min(1).max(1_000),
  appointmentReminderHours: z.number().int().min(1).max(168),
  autoPublishArticles: z.boolean(),
} as const;

export const AdminUpdateConfigSchema = z.object({
  body: z.object({
    key: z.enum(Object.keys(configValidators) as [keyof typeof configValidators, ...(keyof typeof configValidators)[]]),
    value: z.unknown(),
  }).superRefine((data, ctx) => {
    const result = configValidators[data.key].safeParse(data.value);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: result.error.issues[0]?.message || 'Invalid configuration value.',
      });
    }
  }),
});

export const AdminUpdateToggleSchema = z.object({
  params: z.object({ key: z.string().trim().min(1).max(100) }),
  body: z.object({ isEnabled: z.boolean() }),
});
