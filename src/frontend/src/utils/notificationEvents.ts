// Custom event bus for notifying components when notifications state changes
export const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

export const notifyNotificationsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
};
