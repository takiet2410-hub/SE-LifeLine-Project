import type { NotificationData } from '../services/mockData';

/**
 * Extracts an articleId from a notification object if it references an article.
 */
export const getArticleIdFromNotification = (notif?: NotificationData | null): string | null => {
  if (!notif) return null;

  if (notif.payload?.articleId) return String(notif.payload.articleId);
  if (notif.payload?.sourceRefType === 'Article' && notif.payload?.sourceRefId) {
    return String(notif.payload.sourceRefId);
  }
  if (notif.sourceRefType === 'Article' && notif.sourceRefId) {
    return String(notif.sourceRefId);
  }

  const deepLink = notif.payload?.deepLink;
  if (deepLink) {
    const match = deepLink.match(/(?:news|content)\/([a-f0-9]{24})/i) || deepLink.match(/(?:news|content)\/([^/?#]+)/i);
    if (match && match[1]) return match[1];
  }

  return null;
};

/**
 * Returns the correct article route based on user role or current path.
 * - Admin -> /admin/content/:articleId
 * - Hospital Staff -> /hospital/content/:articleId
 * - Blood Center Staff -> /bc/content/:articleId
 * - Donor / Public -> /news/:articleId
 */
export const getArticleRouteForRole = (articleId: string, currentPathOrRole: string): string => {
  const p = (currentPathOrRole || '').toLowerCase();
  if (p.includes('/admin') || p === 'administrator') {
    return `/admin/content/${articleId}`;
  }
  if (p.includes('/hospital') || p === 'hospitalstaff') {
    return `/hospital/content/${articleId}`;
  }
  if (p.includes('/bc') || p === 'bloodcenterstaff') {
    return `/bc/content/${articleId}`;
  }
  return `/news/${articleId}`;
};
