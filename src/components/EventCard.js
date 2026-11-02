// One row in the events list: coloured date tile, details, and a badge.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, shadow, accentFor } from '../theme';
import {
  formatDay,
  formatMonthShort,
  formatWeekday,
  formatTime,
  describeTimeUntil,
} from '../utils/dateUtils';

export default function EventCard({ event, onPress }) {
  const when = new Date(event.dateTime);
  const isPast = when.getTime() < Date.now();
  const accent = accentFor(event.id);

  const tileColor = isPast ? colors.border : accent.main;
  const badgeBg = isPast ? colors.border : accent.soft;
  const badgeText = isPast ? colors.textMuted : accent.main;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, isPast && styles.cardPast]}
    >
      {/* Solid coloured date tile */}
      <View style={[styles.dateTile, { backgroundColor: tileColor }]}>
        <Text style={[styles.dateDay, isPast && styles.dateTextPast]}>{formatDay(when)}</Text>
        <Text style={[styles.dateMonth, isPast && styles.dateTextPast]}>
          {formatMonthShort(when)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, isPast && styles.namePast]} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.meta}>
          🕒 {formatWeekday(when)} • {formatTime(when)}
        </Text>
        {!!event.description && (
          <Text style={styles.description} numberOfLines={1}>
            {event.description}
          </Text>
        )}
      </View>

      <View style={styles.side}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{describeTimeUntil(when)}</Text>
        </View>
        {event.notificationId && !isPast ? <Text style={styles.bell}>🔔</Text> : <View />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    ...shadow,
  },
  cardPast: { backgroundColor: colors.pastBackground, shadowOpacity: 0, elevation: 0 },
  dateTile: {
    width: 60,
    height: 64,
    borderRadius: radius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 24, fontWeight: '800', color: colors.white, lineHeight: 28 },
  dateMonth: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  dateTextPast: { color: colors.textMuted },
  body: { flex: 1, paddingHorizontal: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  namePast: { color: colors.textMuted },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  description: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  side: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '800' },
  bell: { fontSize: 15 },
});