import { isFirebaseInitialized } from '../../../config/firebase.config';
const admin = require('firebase-admin');
import { UserDevice } from '../models/UserDevice';

interface PushOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushServiceImpl {
  async send(options: PushOptions): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      console.log('[Push] Firebase not configured, skipping push notification');
      return false;
    }

    try {
      const tokens = await this.getUserTokens(options.userId);
      
      if (tokens.length === 0) {
        console.log(`[Push] No tokens for user ${options.userId}`);
        return false;
      }

      const message = {
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
        tokens,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'sos-alerts',
            icon: 'ic_notification',
            color: '#93000b',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title: options.title, body: options.body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        await this.removeInvalidTokens(failedTokens);
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('[Push] send error:', error);
      return false;
    }
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    try {
      const devices = await UserDevice.find({ userId }).select('fcmToken').lean();
      return devices.map(d => d.fcmToken);
    } catch (error) {
      console.error('[Push] Error fetching user tokens:', error);
      return [];
    }
  }

  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    if (tokens.length > 0) {
      console.log(`[Push] Removing ${tokens.length} invalid tokens`);
      await UserDevice.deleteMany({ fcmToken: { $in: tokens } });
    }
  }

  async sendToTopic(topic: string, options: Omit<PushOptions, 'userId'>): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      console.log('[Push] Firebase not configured, skipping topic push');
      return false;
    }

    try {
      await admin.messaging().send({
        topic,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data,
      });
      return true;
    } catch (error) {
      console.error('Topic push error:', error);
      return false;
    }
  }
}

export const PushService = new PushServiceImpl();
