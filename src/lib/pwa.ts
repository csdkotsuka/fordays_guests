'use client';
// PWA：Service Worker 登録・通知・締め切りリマインド（AGENTS.md §7）

import { DEADLINE_DAY, NOTIFY_DAYS_BEFORE, daysUntil, fmtDate, nextDeadline } from './date';

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notifyPermission = (): NotificationPermission | 'unsupported' =>
  notifySupported() ? Notification.permission : 'unsupported';

export async function enableNotifications(): Promise<boolean> {
  if (!notifySupported()) return false;
  const p = await Notification.requestPermission();
  if (p === 'granted') await registerSW();
  // TODO: Firebase 接続後、ここで Web Push 購読（VAPID）を作成し Firestore に保存する
  return p === 'granted';
}

export async function showLocalNotification(title: string, body: string, url = '/') {
  if (notifyPermission() !== 'granted') return false;
  const reg = (await navigator.serviceWorker?.getRegistration()) ?? (await registerSW());
  const opts = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url }, tag: url };
  if (reg) await reg.showNotification(title, opts);
  else new Notification(title, opts);
  return true;
}

/**
 * 締め切り通知（アプリを開いたときに判定。1日1回まで）。
 * 本番はサーバー（Cloudflare Workers の Cron）から Web Push で送る。docs/NOTIFICATIONS.md 参照。
 */
export async function checkDeadlineReminder() {
  if (notifyPermission() !== 'granted') return;
  const deadline = nextDeadline();
  const days = daysUntil(deadline);
  if (!NOTIFY_DAYS_BEFORE.includes(days)) return;
  const key = `fd-notified-${deadline.toISOString().slice(0, 10)}-${days}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  await showLocalNotification(
    days === 0 ? '今日が締め切りです' : `締め切りまで あと${days}日`,
    `定期購入の変更は ${fmtDate(deadline)} まで`,
    '/m/change/',
  );
}

export { DEADLINE_DAY };
