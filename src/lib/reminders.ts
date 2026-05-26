import type { UserProfile } from '../types';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }

  return Notification.permission;
}

export function showBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    body,
    tag: 'kcal-reminder',
    icon: '/app-icon.svg'
  });
}

export function shouldFireDailyReminder(profile: UserProfile, now = new Date()): boolean {
  if (!profile.notificationsEnabled || !profile.reminderTime) {
    return false;
  }

  const todayKey = `kcal-reminder-${profile.id}-${now.toISOString().slice(0, 10)}`;
  if (localStorage.getItem(todayKey)) {
    return false;
  }

  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (current < profile.reminderTime) {
    return false;
  }

  localStorage.setItem(todayKey, 'sent');
  return true;
}
