import { env } from './env.config';
import fs from 'fs';
import path from 'path';

let initialized = false;

export const initFirebase = () => {
  if (initialized) return;

  try {
    const { initializeApp, cert, getApps } = require('firebase-admin/app');

    let serviceAccount: any = null;

    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const rawEnv = env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/^"|"$/g, '');
      if (rawEnv.startsWith('{')) {
        serviceAccount = JSON.parse(rawEnv);
      } else {
        const localFilePath = path.resolve(process.cwd(), rawEnv);
        if (fs.existsSync(localFilePath)) {
          serviceAccount = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
        }
      }
    } else {
      const localFilePath = path.join(__dirname, '../../../../firebase-service-account.json');
      if (fs.existsSync(localFilePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
      }
    }

    if (serviceAccount) {
      // Check if already initialized
      const apps = getApps();
      if (apps.length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
        });
      }
      initialized = true;
      console.log('[Firebase] Successfully initialized Admin SDK for FCM');
    } else {
      console.warn('[Firebase] No service account found. Push notifications will be disabled.');
    }
  } catch (error) {
    console.error('[Firebase] Failed to initialize Admin SDK (non-fatal):', error);
    // Don't throw - allow app to start without FCM
  }
};

export const isFirebaseInitialized = () => initialized;