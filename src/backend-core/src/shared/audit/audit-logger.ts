import { AuditLog } from './audit-log.model';

export class AuditLogger {
  /**
   * Log an event to the immutable audit log database collection
   * and print a structured JSON log to stdout.
   */
  static async log(params: {
    actorId: string;
    action: string;
    targetId?: string;
    targetType: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const timestamp = new Date();
      const logEntry = new AuditLog({
        ...params,
        timestamp,
      });

      await logEntry.save();

      // Print structured JSON log to stdout
      console.log(
        JSON.stringify({
          level: 'info',
          msg: `Audit log recorded: ${params.action}`,
          audit: {
            ...params,
            timestamp,
          },
        })
      );
    } catch (error) {
      // Catch error to prevent crashing main transaction, but log to stderr
      console.error('Failed to write audit log:', error);
    }
  }
}
