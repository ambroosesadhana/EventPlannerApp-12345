// Shared colours, radii and shadow style so the whole app looks consistent.
// Theme: fresh teal / green.

export const colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  primarySoft: '#E6F7F4',
  accent: '#10B981',
  background: '#F1FAF8',
  card: '#FFFFFF',
  text: '#0F2E2B',
  textMuted: '#5F7A77',
  border: '#D3E9E5',
  danger: '#E11D48',
  dangerLight: '#FFE4EA',
  pastBackground: '#EDF3F2',
  white: '#FFFFFF',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadow = {
  shadowColor: '#0F766E',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// Each event card gets one of these colours (picked from the event id).
export const palette = [
  { main: '#0D9488', soft: '#CCFBF1' }, // teal
  { main: '#6366F1', soft: '#E0E7FF' }, // indigo
  { main: '#F59E0B', soft: '#FEF3C7' }, // amber
  { main: '#EC4899', soft: '#FCE7F3' }, // pink
  { main: '#3B82F6', soft: '#DBEAFE' }, // blue
  { main: '#F97316', soft: '#FFEDD5' }, // orange
  { main: '#8B5CF6', soft: '#EDE9FE' }, // violet
];

export function accentFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000003;
  return palette[hash % palette.length];
}