import admin from 'firebase-admin';

interface PushOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushServiceImpl {
  private initialized = false;

  private init() {
    if (!this.initialized && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
      } catch (error) {
        console.warn('Firebase Admin initialization failed:', error);
      }
    }
  }

  async send(options: PushOptions): Promise<boolean> {
    this.init();
    
    if (!this.initialized) {
      console.log('[Push] Firebase not configured, skipping push notification');
      return false;
    }

    try {
      // Get user's FCM tokens from database
      // This would typically come from a UserDevice collection
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
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        await this.removeInvalidTokens(failedTokens);
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('Push send error:', error);
      return false;
    }
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    // This would query a UserDevice or PushToken collection
    // For now, return empty array
    return [];
  }

  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    // Remove invalid FCM tokens from database
    console.log('[Push] Removing invalid tokens:', tokens);
  }

  async sendToTopic(topic: string, options: Omit<PushOptions, 'userId'>): Promise<boolean> {
    this.init();
    if (!this.initialized) return false;

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
