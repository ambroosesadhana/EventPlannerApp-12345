// Local notification helpers (expo-notifications).

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatTime } from './dateUtils';

export const CHANNEL_ID = 'event-reminders';

// Becomes true only if the Android channel was created successfully.
let channelReady = false;

// Show the notification even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// value = minutes before the event; null = no reminder
export const REMINDER_OPTIONS = [
  { label: 'No reminder', value: null },
  { label: 'At event time', value: 0 },
  { label: '5 min before', value: 5 },
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
];

export function describeReminder(minutes) {
  const option = REMINDER_OPTIONS.find((o) => o.value === minutes);
  return option ? option.label : 'No reminder';
}

/** Android needs a notification channel (also required before asking permission on Android 13+). */
export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Event reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D9488',
    });
    channelReady = true;
  } catch (error) {
    // Expo Go can fail here; reminders still work on the default channel.
    console.warn('Channel setup skipped:', error);
  }
}

/**
 * Makes sure we have permission to show notifications.
 * Returns true if granted, false if the user said no.
 */
export async function ensureNotificationPermission() {
  await setupNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.status === 'denied' && current.canAskAgain === false) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules a local notification for the event.
 * Returns the notification id, or null if no reminder is needed / the time already passed.
 */
export async function scheduleEventReminder(event) {
  if (event.reminderMinutes === null || event.reminderMinutes === undefined) return null;

  const eventTime = new Date(event.dateTime);
  const triggerTime = new Date(eventTime.getTime() - event.reminderMinutes * 60 * 1000);
  if (triggerTime.getTime() <= Date.now()) return null;

  const body =
    event.reminderMinutes === 0
      ? `Starting now (${formatTime(eventTime)})`
      : `Starts at ${formatTime(eventTime)} — ${describeReminder(event.reminderMinutes).toLowerCase()}`;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `📅 ${event.name}`,
      body,
      sound: true,
      data: { eventId: event.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerTime,
      ...(channelReady ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

export async function cancelEventReminder(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Could not cancel notification:', error);
  }
}