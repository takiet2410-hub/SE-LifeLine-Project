importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAlFAas2VeC7Bm_dE8koppEjDPCFBDH26s",
  authDomain: "lifeline-95cfd.firebaseapp.com",
  projectId: "lifeline-95cfd",
  storageBucket: "lifeline-95cfd.firebasestorage.app",
  messagingSenderId: "841099012329",
  appId: "1:841099012329:web:9cc8618c61dd572ed26878"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
