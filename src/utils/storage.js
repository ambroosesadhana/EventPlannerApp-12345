// Local storage for events (AsyncStorage). Everything is saved on the device as one JSON list.
//
// Event shape:
// {
//   id: string,
//   name: string,
//   description: string,
//   dateTime: string (ISO),
//   reminderMinutes: number | null,   // minutes before the event, null = no reminder
//   notificationId: string | null,    // id returned by expo-notifications
//   createdAt: string (ISO)
// }

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@event_planner_events_v1';

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Loads all events. Never throws — a corrupted store simply returns an empty list. */
export async function loadEvents() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && e.id && e.name && e.dateTime && !isNaN(new Date(e.dateTime).getTime())
    );
  } catch (error) {
    console.warn('Could not load events:', error);
    return [];
  }
}

async function saveEvents(events) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export async function getEvent(id) {
  const events = await loadEvents();
  return events.find((e) => e.id === id) || null;
}

export async function addEvent(event) {
  const events = await loadEvents();
  await saveEvents([...events, event]);
}

export async function updateEvent(updated) {
  const events = await loadEvents();
  await saveEvents(events.map((e) => (e.id === updated.id ? updated : e)));
}

export async function deleteEvent(id) {
  const events = await loadEvents();
  await saveEvents(events.filter((e) => e.id !== id));
}
