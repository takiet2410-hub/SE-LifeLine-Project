import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../shared/auth.middleware';
import { AdminAuditLog } from './models/audit-log.model';

const categoryForPath = (path: string) => {
  if (path.includes('/roles')) return 'Role Management' as const;
  if (path.includes('/config')) return 'System Configuration' as const;
  if (path.includes('/toggles')) return 'Feature Toggle' as const;
  return 'User Management' as const;
};

export const auditAdminFailures = (req: AuthRequest, res: Response, next: NextFunction) => {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (isMutation) {
    res.once('finish', () => {
      if (res.statusCode < 400) return;
      const resourceId = [req.params?.userId, req.params?.roleId, req.params?.key]
        .find((value): value is string => typeof value === 'string');
      void AdminAuditLog.create({
        actorUserId: req.user?._id?.toString(),
        actorName: req.user?.email || 'Unknown Administrator',
        action: `${req.method} ${req.baseUrl}${req.path}`,
        actionCategory: categoryForPath(req.path),
        resourceType: 'AdminRequest',
        resourceId,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        status: 'Failure',
        details: `Administrative request failed with HTTP ${res.statusCode}.`,
      }).catch(() => undefined);
    });
  }
  next();
};
