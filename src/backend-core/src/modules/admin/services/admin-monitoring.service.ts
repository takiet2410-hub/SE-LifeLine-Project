import { AdminAuditLog, IAdminAuditLog } from '../models/audit-log.model';
import { User } from '../../auth-account/models/user.model';
import mongoose from 'mongoose';
import http from 'http';
import { Campaign } from '../../campaign/models/campaign.model';
import { isFirebaseInitialized } from '../../../config/firebase.config';
import { notificationQueue, scheduledTasksQueue } from '../../../config/queue.config';
import { redisConnection } from '../../../config/redis.config';
import { EmailService } from '../../notification/services/email.service';
import { verifyCloudinaryConnection } from '../../../utils/cloudinary.util';

const csvCell = (value: unknown): string => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export interface GetLogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class AdminMonitoringService {
  async getActivityLogs(query: GetLogsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.category && query.category !== 'All') {
      filter.actionCategory = query.category;
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { actorName: searchRegex },
        { action: searchRegex },
        { resourceType: searchRegex },
        { details: searchRegex },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AdminAuditLog.countDocuments(filter),
    ]);

    const items = logs.map((log) => ({
      id: log._id.toString(),
      timestamp: log.timestamp,
      actorName: log.actorName || 'System',
      action: log.action,
      actionCategory: log.actionCategory,
      resourceType: log.resourceType,
      resourceId: log.resourceId || 'N/A',
      ipAddress: log.ipAddress || '127.0.0.1',
      status: log.status,
      previousValue: log.previousValue,
      newValue: log.newValue,
      details: log.details,
    }));

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

  async exportLogsCsv(query: GetLogsQuery) {
    const firstPage = await this.getActivityLogs({ ...query, limit: 100, page: 1 });
    const items = [...firstPage.items];
    for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
      const result = await this.getActivityLogs({ ...query, limit: 100, page });
      items.push(...result.items);
    }
    const headers = ['Timestamp', 'Actor', 'Action', 'Category', 'Resource', 'IP Address', 'Status'];
    const rows = items.map((l) => [
      csvCell(new Date(l.timestamp).toISOString()),
      csvCell(l.actorName),
      csvCell(l.action),
      csvCell(l.actionCategory),
      csvCell(l.resourceType),
      csvCell(l.ipAddress),
      csvCell(l.status),
    ]);

    return ['\uFEFF' + headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async getDashboardMetrics() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const activeSessionCutoff = new Date(now.getTime() - 30 * 60 * 1000);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalUsers, activeUsers, activeSessions, totalLogs, failedLogs, newRegistrationsToday, userTrends, campaignTrends] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: 'Active', isDeleted: { $ne: true } }),
        User.countDocuments({ accountStatus: 'Active', lastLoginAt: { $gte: activeSessionCutoff } }),
        AdminAuditLog.countDocuments(),
        AdminAuditLog.countDocuments({ status: 'Failure' }),
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        User.aggregate([
          { $match: { createdAt: { $gte: trendStart } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        ]),
        Campaign.aggregate([
          { $match: { createdAt: { $gte: trendStart } } },
          { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        ]),
      ]);

    const errorRate = totalLogs > 0 ? ((failedLogs / totalLogs) * 100).toFixed(2) : '0.00';

    const countByMonth = (rows: Array<{ _id: { year: number; month: number }; count: number }>) =>
      new Map(rows.map((row) => [`${row._id.year}-${row._id.month}`, row.count]));
    const usersByMonth = countByMonth(userTrends);
    const campaignsByMonth = countByMonth(campaignTrends);
    const usageTrends = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      return {
        month: date.toLocaleString('en-US', { month: 'short' }),
        donors: usersByMonth.get(key) || 0,
        campaigns: campaignsByMonth.get(key) || 0,
      };
    });

    return {
      activeSessions,
      totalUsers,
      activeUsers,
      systemUptime: `${Math.floor(process.uptime())}s`,
      errorRate: `${errorRate}%`,
      newRegistrationsToday,
      usageTrends,
    };
  }

  async runDiagnostics() {
    return this.runSystemDiagnostics();
  }

  async runSystemDiagnostics() {
    // 1. Check MongoDB Ping & Latency
    const dbStart = Date.now();
    let dbStatus: 'Operational' | 'Degraded' | 'Down' = 'Operational';
    let dbLatency = 0;
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbLatency = Date.now() - dbStart;
      } else {
        dbStatus = 'Down';
      }
    } catch {
      dbStatus = 'Down';
    }

    // 2. Check AI Service Health
    const aiCheck = await this.pingHttpEndpoint('http://localhost:8000/health');

    // External providers used by notifications and the news feed. A configured
    // credential alone is not enough; verify the provider and active sender.
    const externalStart = Date.now();
    const [emailReady, mediaReady] = await Promise.all([
      EmailService.verifyConnection(),
      verifyCloudinaryConnection(),
    ]);
    const externalLatency = `${Date.now() - externalStart}ms`;
    const emailStatus: 'Operational' | 'Degraded' = emailReady ? 'Operational' : 'Degraded';
    const mediaStatus: 'Operational' | 'Degraded' = mediaReady ? 'Operational' : 'Degraded';

    // 3. Check the actual queue state. Firebase alone does not prove dispatch health.
    const firebaseReady = isFirebaseInitialized();
    let redisStatus: 'Operational' | 'Degraded' | 'Down' = 'Operational';
    let redisLatency = 'N/A';
    let notificationDetails = 'Queue state unavailable';
    let schedulerDetails = 'Scheduler state unavailable';
    let schedulerStatus: 'Operational' | 'Degraded' | 'Down' = 'Operational';
    let notifStatus: 'Operational' | 'Degraded' | 'Down' = 'Operational';

    try {
      const redisStart = Date.now();
      await redisConnection.ping();
      redisLatency = `${Date.now() - redisStart}ms`;
      const [counts, repeatableJobs] = await Promise.all([
        notificationQueue.getJobCounts('waiting', 'active', 'delayed', 'failed'),
        scheduledTasksQueue.getJobSchedulers(),
      ]);
      notifStatus = counts.failed > 0 || !firebaseReady ? 'Degraded' : 'Operational';
      notificationDetails = `${counts.waiting} chờ, ${counts.active} đang xử lý, ${counts.failed} thất bại; Firebase ${firebaseReady ? 'sẵn sàng' : 'chưa cấu hình'}`;
      const publisherRegistered = repeatableJobs.some((job: any) => job.name === 'publish-articles');
      schedulerStatus = publisherRegistered ? 'Operational' : 'Degraded';
      schedulerDetails = publisherRegistered
        ? 'Tác vụ tự động xuất bản bài viết đã được đăng ký'
        : 'Thiếu tác vụ tự động xuất bản bài viết';
    } catch (error: any) {
      redisStatus = 'Down';
      notifStatus = 'Down';
      schedulerStatus = 'Down';
      notificationDetails = `Không thể đọc hàng đợi: ${error?.message || 'Redis unavailable'}`;
      schedulerDetails = 'Không thể xác minh lịch xuất bản vì Redis không khả dụng';
    }
    const serviceStatuses: Array<'Operational' | 'Degraded' | 'Down'> = [
      dbStatus,
      aiCheck.status,
      redisStatus,
      notifStatus,
      schedulerStatus,
      emailStatus,
      mediaStatus,
    ];

    return {
      timestamp: new Date().toISOString(),
      overallStatus: serviceStatuses.every((status) => status === 'Operational') ? 'Healthy' : 'Issues Detected',
      services: [
        {
          name: 'Primary MongoDB Cluster',
          type: 'Database',
          status: dbStatus,
          latencyMs: `${dbLatency}ms`,
          details: dbStatus === 'Operational' ? 'Connected & Responsive' : 'Connection Error',
        },
        {
          name: 'AI Assistance Microservice',
          type: 'AI Service',
          status: aiCheck.status,
          latencyMs: aiCheck.latency,
          details: aiCheck.details,
        },
        {
          name: 'Notification Dispatch Engine',
          type: 'Message Queue',
          status: notifStatus,
          latencyMs: redisLatency,
          details: notificationDetails,
        },
        {
          name: 'Brevo Email Delivery',
          type: 'External API',
          status: emailStatus,
          latencyMs: externalLatency,
          details: emailReady ? 'API và địa chỉ người gửi đã được xác minh' : 'Không thể xác minh API hoặc địa chỉ người gửi',
        },
        {
          name: 'Cloudinary Media Storage',
          type: 'External API',
          status: mediaStatus,
          latencyMs: externalLatency,
          details: mediaReady ? 'Kết nối lưu trữ ảnh hoạt động' : 'Không thể xác minh kết nối lưu trữ ảnh',
        },
        {
          name: 'Scheduled News Publisher',
          type: 'Scheduled Job',
          status: schedulerStatus,
          latencyMs: redisLatency,
          details: schedulerDetails,
        },
      ],
    };
  }

  private pingHttpEndpoint(urlStr: string): Promise<{ status: 'Operational' | 'Degraded' | 'Down'; latency: string; details: string }> {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = http.get(urlStr, { timeout: 3000 }, (res) => {
        const latency = `${Date.now() - start}ms`;
        if (res.statusCode && res.statusCode < 400) {
          resolve({ status: 'Operational', latency, details: `HTTP ${res.statusCode} OK` });
        } else {
          resolve({ status: 'Degraded', latency, details: `HTTP ${res.statusCode}` });
        }
      });

      req.on('error', (err) => {
        resolve({ status: 'Degraded', latency: 'N/A', details: `Service Standby (${err.message})` });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'Down', latency: '3000ms', details: 'Connection Timed Out' });
      });
    });
  }
}
