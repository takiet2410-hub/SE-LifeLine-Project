import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from './firebase.config';
import { apiClient } from '../shared/api/apiClient';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
let messaging: any = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging not supported in this environment');
}

export const requestNotificationPermission = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' // Set VITE_FIREBASE_VAPID_KEY in .env or get from Firebase Console > Cloud Messaging > Web Push certificates
      });

      if (currentToken) {
        // Send the token to your server and update the UI if necessary
        await apiClient.post('/notifications/device-token', {
          fcmToken: currentToken,
          platform: 'web',
          deviceType: navigator.userAgent
        });
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const removeDeviceToken = async (token: string) => {
  try {
    await apiClient.delete('/notifications/device-token', {
      data: { fcmToken: token }
    });
  } catch (error) {
    console.error('Failed to remove device token:', error);
  }
};
