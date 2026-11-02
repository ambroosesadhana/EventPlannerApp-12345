// Date helpers: formatting, "time until" text and search keys.
// Manual formatting is used (instead of Intl) so the output is the same on every device.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

/** e.g. "Thu, 05 Nov 2026" */
export function formatDate(date) {
  return `${DAYS_SHORT[date.getDay()]}, ${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** e.g. "09:30 AM" */
export function formatTime(date) {
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(hours12)}:${pad(date.getMinutes())} ${suffix}`;
}

/** e.g. "Thu, 05 Nov 2026 • 09:30 AM" */
export function formatDateTime(date) {
  return `${formatDate(date)} • ${formatTime(date)}`;
}

/** e.g. "05" — used on the date tile of an event card */
export function formatDay(date) {
  return pad(date.getDate());
}

/** e.g. "NOV" — used on the date tile of an event card */
export function formatMonthShort(date) {
  return MONTHS_SHORT[date.getMonth()].toUpperCase();
}

/** e.g. "Thu" */
export function formatWeekday(date) {
  return DAYS_SHORT[date.getDay()];
}

/**
 * Returns every text form of a date a user might type when searching,
 * all lower-case: 2026-11-05, 05/11/2026, 5 nov 2026, 5 november 2026, thu ...
 */
export function dateSearchKeys(date) {
  const d = pad(date.getDate());
  const dPlain = String(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const short = MONTHS_SHORT[date.getMonth()];
  const long = MONTHS_LONG[date.getMonth()];

  return [
    `${y}-${m}-${d}`,
    `${d}/${m}/${y}`,
    `${d}-${m}-${y}`,
    `${d} ${short} ${y}`,
    `${dPlain} ${short} ${y}`,
    `${d} ${long} ${y}`,
    `${dPlain} ${long} ${y}`,
    `${long} ${y}`,
    formatDate(date),
  ].map((s) => s.toLowerCase());
}

/** Friendly "In 2 days" style text for the badge on each event card. */
export function describeTimeUntil(date, now = new Date()) {
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Starting now';
  if (minutes < 60) return `In ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `In ${hours} hr`;

  const days = Math.floor(hours / 24);
  return `In ${days} day${days > 1 ? 's' : ''}`;
}

/** Next full hour from now — used as the default time for a new event. */
export function defaultEventDateTime() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}