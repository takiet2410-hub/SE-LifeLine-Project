import { NotificationService } from './notification.service';
import { NotificationTemplate } from '../models/NotificationTemplate';

interface DomainEvent {
  eventType: string;
  payload: any;
  timestamp: Date;
}

const EVENT_TEMPLATE_MAP: Record<string, { eventType: string; channels: ('in-app' | 'email' | 'push')[] }> = {
  AppointmentConfirmed: { eventType: 'AppointmentConfirmed', channels: ['in-app', 'email'] },
  AppointmentReminder24h: { eventType: 'AppointmentReminder24h', channels: ['in-app', 'push'] },
  AppointmentReminder2h: { eventType: 'AppointmentReminder2h', channels: ['in-app', 'push'] },
  CampaignPublished: { eventType: 'CampaignPublished', channels: ['in-app', 'email'] },
  DonorEligibilityReached: { eventType: 'DonorEligibilityReached', channels: ['in-app', 'email', 'push'] },
  ProfileVerified: { eventType: 'ProfileVerified', channels: ['in-app', 'email'] },
  SOSAlert: { eventType: 'SOSAlert', channels: ['in-app', 'push'] },
  SOSResponseConfirmed: { eventType: 'SOSResponseConfirmed', channels: ['in-app', 'email'] },
  SOSRequestFulfilled: { eventType: 'SOSRequestFulfilled', channels: ['in-app', 'push'] },
  AppointmentCancelled: { eventType: 'AppointmentCancelled', channels: ['in-app', 'email'] },
  AppointmentRescheduled: { eventType: 'AppointmentRescheduled', channels: ['in-app', 'push'] },
  BloodBagStatusChanged: { eventType: 'BloodBagStatusChanged', channels: ['in-app'] },
  CampaignReminder: { eventType: 'CampaignReminder', channels: ['in-app', 'email'] },
  DonationCompleted: { eventType: 'DonationCompleted', channels: ['in-app', 'email'] },
  EligibilityCheckFailed: { eventType: 'EligibilityCheckFailed', channels: ['in-app', 'email'] },
};

export class NotificationEventHandler {
  /**
   * Handle domain event and dispatch notifications
   */
  static async handleEvent(event: DomainEvent): Promise<void> {
    const config = EVENT_TEMPLATE_MAP[event.eventType];
    if (!config) {
      console.warn(`[Notification] Unknown event type: ${event.eventType}`);
      return;
    }

    try {
      // Get template
      const template = await NotificationTemplate.findOne({ 
        eventType: config.eventType, 
        locale: 'vi', 
        isActive: true 
      }).lean();

      if (!template) {
        console.warn(`[Notification] No template found for event: ${event.eventType}`);
        return;
      }

      // Render template with payload
      const { title, body, payload } = this.renderTemplate(template, event.payload);

      // Determine recipient IDs based on event type
      const recipientIds = await this.getRecipients(event.eventType, event.payload);

      if (recipientIds.length === 0) {
        console.log(`[Notification] No recipients for event: ${event.eventType}`);
        return;
      }

      // Send notifications
      await NotificationService.sendNotification({
        recipientIds,
        type: this.getNotificationType(event.eventType),
        title,
        body,
        payload,
        channels: config.channels,
      });

      console.log(`[Notification] Dispatched ${event.eventType} to ${recipientIds.length} recipients`);
    } catch (error) {
      console.error(`[Notification] Failed to handle event ${event.eventType}:`, error);
    }
  }

  /**
   * Render template with payload data
   */
  private static renderTemplate(template: any, payload: any): { title: string; body: string; payload: any } {
    const render = (str: string) => str
      .replace(/\{\{(\w+)\}\}/g, (_, key) => payload[key] ?? '')
      .replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, obj, key) => payload[obj]?.[key] ?? '');

    return {
      title: render(template.subject),
      body: render(template.bodyText),
      payload: { ...payload, deepLink: payload.deepLink || this.generateDeepLink(payload) },
    };
  }

  /**
   * Generate deep link based on payload
   */
  private static generateDeepLink(payload: any): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (payload.appointmentId) return `${baseUrl}/my-appointments/${payload.appointmentId}`;
    if (payload.campaignId) return `${baseUrl}/campaigns/${payload.campaignId}`;
    if (payload.sosRequestId) return `${baseUrl}/sos-alerts/${payload.sosRequestId}`;
    if (payload.hospitalId) return `${baseUrl}/hospital/sos-requests/${payload.sosRequestId}`;
    if (payload.bloodBagId) return `${baseUrl}/bc/inventory/${payload.bloodBagId}`;
    
    return baseUrl;
  }

  /**
   * Determine recipient IDs based on event type
   */
  private static async getRecipients(eventType: string, payload: any): Promise<string[]> {
    switch (eventType) {
      case 'AppointmentConfirmed':
      case 'AppointmentReminder24h':
      case 'AppointmentReminder2h':
      case 'AppointmentCancelled':
      case 'AppointmentRescheduled':
        return payload.donorId ? [payload.donorId] : [];

      case 'CampaignPublished':
      case 'CampaignReminder':
        // Get donors who match campaign criteria (blood type, location)
        // This would query the User collection with filters
        return await this.getEligibleDonorsForCampaign(payload.campaignId, payload.bloodType, payload.location);

      case 'DonorEligibilityReached':
        return payload.donorId ? [payload.donorId] : [];

      case 'ProfileVerified':
        return payload.userId ? [payload.userId] : [];

      case 'SOSAlert':
        // Get eligible donors for SOS (blood type, location, eligibility)
        return await this.getEligibleDonorsForSOS(payload.sosRequestId, payload.bloodType, payload.location, payload.urgencyLevel);

      case 'SOSResponseConfirmed':
      case 'SOSRequestFulfilled':
        return payload.donorId ? [payload.donorId] : [];

      case 'BloodBagStatusChanged':
        // Notify blood center staff
        return await this.getBloodCenterStaff(payload.bloodCenterId);

      case 'DonationCompleted':
        return payload.donorId ? [payload.donorId] : [];

      case 'EligibilityCheckFailed':
        return payload.donorId ? [payload.donorId] : [];

      default:
        return [];
    }
  }

  /**
   * Get eligible donors for campaign
   */
  private static async getEligibleDonorsForCampaign(campaignId: string, bloodType?: string, location?: any): Promise<string[]> {
    // This would query User collection with filters
    // For now, return empty array - implement based on User model
    return [];
  }

  /**
   * Get eligible donors for SOS
   */
  private static async getEligibleDonorsForSOS(sosRequestId: string, bloodType?: string, location?: any, urgencyLevel?: string): Promise<string[]> {
    // This would query User collection with blood type, location, and eligibility filters
    // For now, return empty array - implement based on User model
    return [];
  }

  /**
   * Get blood center staff
   */
  private static async getBloodCenterStaff(bloodCenterId?: string): Promise<string[]> {
    // Query User collection for staff with bloodCenterId
    return [];
  }

  /**
   * Map event type to notification type
   */
  private static getNotificationType(eventType: string): 'SOS' | 'Campaign' | 'Routine' | 'Appointment' {
    if (eventType.startsWith('SOS')) return 'SOS';
    if (eventType.startsWith('Campaign')) return 'Campaign';
    if (eventType.startsWith('Appointment')) return 'Appointment';
    return 'Routine';
  }
}

// Event emitter for internal use
class NotificationEventEmitter {
  private static handlers: Map<string, Function[]> = new Map();

  static on(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  static async emit(event: DomainEvent) {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(h => h(event)));
    
    // Also call the main handler
    await NotificationEventHandler.handleEvent(event);
  }
}

export const notificationEvents = NotificationEventEmitter;

// Convenience functions for other modules to emit events
export async function emitAppointmentConfirmed(payload: any) {
  await notificationEvents.emit({ eventType: 'AppointmentConfirmed', payload, timestamp: new Date() });
}

export async function emitAppointmentReminder24h(payload: any) {
  await notificationEvents.emit({ eventType: 'AppointmentReminder24h', payload, timestamp: new Date() });
}

export async function emitAppointmentReminder2h(payload: any) {
  await notificationEvents.emit({ eventType: 'AppointmentReminder2h', payload, timestamp: new Date() });
}

export async function emitCampaignPublished(payload: any) {
  await notificationEvents.emit({ eventType: 'CampaignPublished', payload, timestamp: new Date() });
}

export async function emitDonorEligibilityReached(payload: any) {
  await notificationEvents.emit({ eventType: 'DonorEligibilityReached', payload, timestamp: new Date() });
}

export async function emitProfileVerified(payload: any) {
  await notificationEvents.emit({ eventType: 'ProfileVerified', payload, timestamp: new Date() });
}

export async function emitSOSAlert(payload: any) {
  await notificationEvents.emit({ eventType: 'SOSAlert', payload, timestamp: new Date() });
}

export async function emitSOSResponseConfirmed(payload: any) {
  await notificationEvents.emit({ eventType: 'SOSResponseConfirmed', payload, timestamp: new Date() });
}

export async function emitSOSRequestFulfilled(payload: any) {
  await notificationEvents.emit({ eventType: 'SOSRequestFulfilled', payload, timestamp: new Date() });
}

export async function emitAppointmentCancelled(payload: any) {
  await notificationEvents.emit({ eventType: 'AppointmentCancelled', payload, timestamp: new Date() });
}

export async function emitDonationCompleted(payload: any) {
  await notificationEvents.emit({ eventType: 'DonationCompleted', payload, timestamp: new Date() });
}