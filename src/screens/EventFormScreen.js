// Create / Edit event screen (same form for both).
// If route.params.eventId is given we are editing, otherwise we are creating.

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addEvent, updateEvent, getEvent, generateId } from '../utils/storage';
import { validateEvent, LIMITS } from '../utils/validation';
import { formatDate, formatTime, defaultEventDateTime } from '../utils/dateUtils';
import {
  REMINDER_OPTIONS,
  ensureNotificationPermission,
  scheduleEventReminder,
  cancelEventReminder,
} from '../utils/notifications';
import { colors, radius, shadow } from '../theme';

export default function EventFormScreen({ navigation, route }) {
  const eventId = route.params?.eventId;
  const isEditing = Boolean(eventId);

  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(defaultEventDateTime());
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Event' : 'New Event' });
  }, [navigation, isEditing]);

  // When editing, load the saved event and fill the form.
  useEffect(() => {
    if (!isEditing) return;
    let active = true;
    (async () => {
      const found = await getEvent(eventId);
      if (!active) return;
      if (!found) {
        Alert.alert('Event not found', 'This event no longer exists.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setExisting(found);
      setName(found.name);
      setDescription(found.description || '');
      setDateTime(new Date(found.dateTime));
      setReminderMinutes(found.reminderMinutes ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [eventId, isEditing, navigation]);

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onDateChange = (event, selected) => {
    // On Android the picker is a dialog that closes itself.
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;

    const next = new Date(dateTime);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDateTime(next);
    clearError('dateTime');
    clearError('reminder');
  };

  const onTimeChange = (event, selected) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;

    const next = new Date(dateTime);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDateTime(next);
    clearError('dateTime');
    clearError('reminder');
  };

  const handleSave = async () => {
    if (saving) return;

    const when = new Date(dateTime);
    when.setSeconds(0, 0);

    // Past events being edited are allowed to keep their old date.
    const dateChanged = !existing || new Date(existing.dateTime).getTime() !== when.getTime();

    const validationErrors = validateEvent({
      name,
      description,
      dateTime: when,
      reminderMinutes,
      requireFuture: !isEditing || dateChanged,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    let permissionDenied = false;

    try {
      // Edit: remove the old reminder before scheduling a new one.
      if (existing?.notificationId) {
        await cancelEventReminder(existing.notificationId);
      }

      const event = {
        id: existing?.id ?? generateId(),
        name: name.trim(),
        description: description.trim(),
        dateTime: when.toISOString(),
        reminderMinutes,
        notificationId: null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

           if (reminderMinutes !== null) {
        try {
          const granted = await ensureNotificationPermission();
          if (granted) {
            event.notificationId = await scheduleEventReminder(event);
          } else {
            permissionDenied = true;
            event.reminderMinutes = null;
          }
        } catch (reminderError) {
          // Reminder problems must never stop the event from being saved.
          console.warn('Reminder failed:', reminderError);
          event.reminderMinutes = null;
          event.notificationId = null;
        }
      }
      if (isEditing) {
        await updateEvent(event);
      } else {
        await addEvent(event);
      }
    } catch (error) {
      console.warn('Save failed:', error);
      setSaving(false);
      Alert.alert('Could not save', 'Something went wrong while saving the event. Please try again.');
      return;
    }

    setSaving(false);

    if (permissionDenied) {
      Alert.alert(
        'Reminder not set',
        'Notification permission is turned off, so the event was saved without a reminder. You can allow notifications in your phone settings.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings();
              navigation.goBack();
            },
          },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Card 1: basics */}
        <View style={styles.card}>
          <Text style={styles.label}>Event name *</Text>
          <TextInput
            style={[
              styles.input,
              focused === 'name' && styles.inputFocused,
              errors.name && styles.inputError,
            ]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. Project presentation"
            placeholderTextColor={colors.textMuted}
          />
          {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}

          <Text style={[styles.label, styles.labelSpaced]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.multiline,
              focused === 'description' && styles.inputFocused,
              errors.description && styles.inputError,
            ]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              clearError('description');
            }}
            onFocus={() => setFocused('description')}
            onBlur={() => setFocused(null)}
            placeholder="Add some details (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>
            {description.length}/{LIMITS.DESCRIPTION_MAX}
          </Text>
          {!!errors.description && <Text style={styles.error}>{errors.description}</Text>}
        </View>

        {/* Card 2: date & time */}
        <View style={styles.card}>
          <Text style={styles.label}>Date and time *</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.pickerButton, errors.dateTime && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerIcon}>📅</Text>
              <Text style={styles.pickerText}>{formatDate(dateTime)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, errors.dateTime && styles.inputError]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerIcon}>🕒</Text>
              <Text style={styles.pickerText}>{formatTime(dateTime)}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.dateTime && <Text style={styles.error}>{errors.dateTime}</Text>}

          {showDatePicker && (
            <DateTimePicker
              value={dateTime}
              mode="date"
              minimumDate={isEditing ? undefined : new Date()}
              onChange={onDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker value={dateTime} mode="time" onChange={onTimeChange} />
          )}
          {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(false);
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card 3: reminder */}
        <View style={styles.card}>
          <Text style={styles.label}>Reminder</Text>
          <View style={styles.chips}>
            {REMINDER_OPTIONS.map((option) => {
              const selected = option.value === reminderMinutes;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setReminderMinutes(option.value);
                    clearError('reminder');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!!errors.reminder && <Text style={styles.error}>{errors.reminder}</Text>}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>{isEditing ? 'Save changes' : 'Create event'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
    ...shadow,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  labelSpaced: { marginTop: 16 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  inputError: { borderColor: colors.danger },
  multiline: { minHeight: 110 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerIcon: { fontSize: 16, marginRight: 8 },
  pickerText: { fontSize: 14, color: colors.primaryDark, fontWeight: '700', flexShrink: 1 },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  doneText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    ...shadow,
    shadowOpacity: 0.25,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});