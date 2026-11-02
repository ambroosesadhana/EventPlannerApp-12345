// Event details screen with Edit and Delete (delete asks for confirmation first).

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import { getEvent, deleteEvent } from '../utils/storage';
import { cancelEventReminder, describeReminder } from '../utils/notifications';
import { formatDate, formatTime, describeTimeUntil } from '../utils/dateUtils';
import { colors, radius, shadow } from '../theme';

// Small white tile showing one piece of information.
function InfoTile({ icon, label, value, style }) {
  return (
    <View style={[styles.tile, style]}>
      <View style={styles.tileIconWrap}>
        <Text style={styles.tileIcon}>{icon}</Text>
      </View>
      <View style={styles.tileTextWrap}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reload when coming back from the edit screen.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const found = await getEvent(eventId);
        if (active) {
          setEvent(found);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [eventId])
  );

  const confirmDelete = () => {
    Alert.alert('Delete event?', `"${event.name}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelEventReminder(event.notificationId);
            await deleteEvent(event.id);
            navigation.goBack();
          } catch (error) {
            console.warn('Delete failed:', error);
            Alert.alert('Could not delete', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <EmptyState
        icon="🕳️"
        title="Event not found"
        message="It may have been deleted."
        actionLabel="Go back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const when = new Date(event.dateTime);
  const isPast = when.getTime() < Date.now();
  const hasReminder = event.reminderMinutes !== null && event.reminderMinutes !== undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Teal hero with badge and title */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isPast ? 'Past event' : describeTimeUntil(when)}</Text>
        </View>
        <Text style={styles.title}>{event.name}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.tilesRow}>
          <InfoTile style={styles.tileHalf} icon="📅" label="Date" value={formatDate(when)} />
          <InfoTile style={styles.tileHalf} icon="🕒" label="Time" value={formatTime(when)} />
        </View>

        <InfoTile
          icon={hasReminder ? '🔔' : '🔕'}
          label="Reminder"
          value={hasReminder ? describeReminder(event.reminderMinutes) : 'No reminder'}
        />

        <View style={styles.descriptionCard}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={event.description ? styles.description : styles.descriptionEmpty}>
            {event.description || 'No description added.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.editText}>✏️  Edit event</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} activeOpacity={0.85}>
          <Text style={styles.deleteText}>🗑️  Delete event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  badgeText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  title: { color: colors.white, fontSize: 28, fontWeight: '800', lineHeight: 34 },

  body: { padding: 16 },
  tilesRow: { flexDirection: 'row', gap: 12 },
  tileHalf: { flex: 1 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tileIcon: { fontSize: 18 },
  tileTextWrap: { flex: 1 },
  tileLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tileValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },

  descriptionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    ...shadow,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  description: { fontSize: 16, color: colors.text, lineHeight: 24 },
  descriptionEmpty: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic' },

  editButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
    ...shadow,
    shadowOpacity: 0.25,
  },
  editText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  deleteButton: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: '800' },
});