import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { User } from '../modules/auth-account/models/user.model';
import { CURRENT_ROLE_PERMISSIONS_VERSION, Role } from '../modules/admin/models/role.model';

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Administrator: [
    'campaign:read', 'campaign:create', 'campaign:edit', 'campaign:delete',
    'inventory:read', 'inventory:stock_in', 'inventory:stock_out',
    'sos:read', 'sos:create', 'sos:cancel',
    'content:read', 'content:create', 'content:publish',
    'notifications:send', 'notifications:templates',
    'users:read', 'users:write', 'roles:read', 'roles:write',
    'system:config', 'system:toggles', 'system:logs',
  ],
  BloodCenterStaff: [
    'campaign:read', 'campaign:create', 'campaign:edit',
    'inventory:read', 'inventory:stock_in', 'inventory:stock_out',
    'sos:read',
    'content:read', 'content:create',
  ],
  HospitalStaff: [
    'sos:read', 'sos:create', 'sos:cancel', 'inventory:read',
    'content:read', 'content:create',
  ],
  Donor: ['campaign:read', 'content:read'],
};

const ROLE_PERMISSION_MIGRATIONS: Record<string, { version: number; add: string[] }> = {
  Administrator: {
    version: CURRENT_ROLE_PERMISSIONS_VERSION,
    add: ['notifications:send', 'notifications:templates'],
  },
  BloodCenterStaff: {
    version: CURRENT_ROLE_PERMISSIONS_VERSION,
    add: ['sos:read'],
  },
  HospitalStaff: {
    version: 2,
    add: ['content:read', 'content:create'],
  },
};

export interface AuthRequest extends Request {
  user?: any; // Ideally typed to User doc or payload
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      const user = await User.findById(decoded.userId);

      if (!user || user.accountStatus === 'Suspended' || user.isDeleted) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tài khoản đã bị đình chỉ hoặc không hợp lệ' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token is invalid or expired' });
    }
  } else {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authorization token is missing' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    const userRoles = Array.from(
      new Set([
        req.user.role,
        ...(Array.isArray(req.user.roles) ? req.user.roles : [])
      ].filter(Boolean))
    );
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: `Access denied. Action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

export const authorizePermissions = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const userRoles = Array.from(
      new Set([req.user.role, ...(Array.isArray(req.user.roles) ? req.user.roles : [])].filter(Boolean))
    );

    try {
      const roles = await Role.find({ name: { $in: userRoles } }).lean();
      const storedPermissions = new Map<string, string[]>();

      for (const role of roles) {
        const migration = ROLE_PERMISSION_MIGRATIONS[role.name];
        let permissions = role.permissions || [];

        if (migration && (role.permissionsVersion || 0) < migration.version) {
          permissions = Array.from(new Set([...permissions, ...migration.add]));
          await Role.updateOne(
            {
              _id: role._id,
              $or: [
                { permissionsVersion: { $exists: false } },
                { permissionsVersion: { $lt: migration.version } },
              ],
            },
            {
              $addToSet: { permissions: { $each: migration.add } },
              $set: { permissionsVersion: migration.version },
            }
          );
        }

        storedPermissions.set(role.name, permissions);
      }
      const granted = new Set(userRoles.flatMap((role) =>
        storedPermissions.get(role) || DEFAULT_ROLE_PERMISSIONS[role] || []
      ));
      const hasPermission = granted.has('*') || requiredPermissions.every((permission) => granted.has(permission));
      if (!hasPermission) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: `Access denied. Missing permission: ${requiredPermissions.join(', ')}`,
        });
      }
      return next();
    } catch {
      return res.status(503).json({
        code: 'AUTHORIZATION_UNAVAILABLE',
        message: 'Permission service is temporarily unavailable.',
      });
    }
  };
};

