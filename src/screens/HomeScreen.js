// Home screen: teal header with search, upcoming events list and a collapsible past events section.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import { loadEvents } from '../utils/storage';
import { dateSearchKeys } from '../utils/dateUtils';
import { colors, radius, shadow } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Reload events every time this screen comes into focus (after add / edit / delete).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await loadEvents();
        if (active) {
          setEvents(data);
          setLoading(false);
          setNow(Date.now());
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  // Re-check the time every 30 seconds so events move from "upcoming" to "past" by themselves.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Totals for the header (not affected by the search text).
  const upcomingTotal = useMemo(
    () => events.filter((e) => new Date(e.dateTime).getTime() >= now).length,
    [events, now]
  );
  const pastTotal = events.length - upcomingTotal;

  // Filter by search text (name OR date), then split into upcoming / past.
  const { upcoming, past } = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchesSearch = (event) => {
      if (!q) return true;
      if (event.name.toLowerCase().includes(q)) return true;
      return dateSearchKeys(new Date(event.dateTime)).some((key) => key.includes(q));
    };

    const filtered = events.filter(matchesSearch);
    const time = (e) => new Date(e.dateTime).getTime();

    return {
      upcoming: filtered.filter((e) => time(e) >= now).sort((a, b) => time(a) - time(b)),
      past: filtered.filter((e) => time(e) < now).sort((a, b) => time(b) - time(a)),
    };
  }, [events, query, now]);

  const sections = useMemo(() => {
    const list = [{ key: 'upcoming', title: 'Upcoming', count: upcoming.length, data: upcoming }];
    if (past.length > 0) {
      list.push({
        key: 'past',
        title: 'Past events',
        count: past.length,
        data: showPast ? past : [],
      });
    }
    return list;
  }, [upcoming, past, showPast]);

  const openCreate = () => navigation.navigate('EventForm');

  const renderSectionHeader = ({ section }) => {
    const isPastSection = section.key === 'past';
    const content = (
      <>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={[styles.countPill, isPastSection && styles.countPillPast]}>
            <Text style={[styles.countText, isPastSection && styles.countTextPast]}>
              {section.count}
            </Text>
          </View>
        </View>
        {isPastSection && <Text style={styles.toggleText}>{showPast ? 'Hide ▲' : 'Show ▼'}</Text>}
      </>
    );

    if (isPastSection) {
      return (
        <TouchableOpacity
          style={[styles.sectionHeader, styles.pastHeader]}
          onPress={() => setShowPast((v) => !v)}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }
    return <View style={styles.sectionHeader}>{content}</View>;
  };

  const renderSectionFooter = ({ section }) => {
    if (section.key === 'upcoming' && section.data.length === 0) {
      return (
        <View style={styles.inlineEmpty}>
          <Text style={styles.inlineEmptyText}>
            No upcoming events{query ? ' match your search' : ''}.
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderBody = () => {
    if (loading) {
      return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
    }

    if (events.length === 0) {
      return (
        <EmptyState
          icon="🗓️"
          title="No events yet"
          message="Plan your first event and get reminded when it's time."
          actionLabel="Create event"
          onAction={openCreate}
        />
      );
    }

    if (query.trim() && upcoming.length === 0 && past.length === 0) {
      return (
        <EmptyState
          icon="🔍"
          title="No matching events"
          message={`Nothing found for "${query.trim()}". Try a different name or date.`}
        />
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Teal header with title, counts and search */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.eyebrow}>📅  Event Planner</Text>
        <Text style={styles.headerTitle}>Your events</Text>
        <Text style={styles.headerSub}>
          {upcomingTotal} upcoming  •  {pastTotal} past
        </Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or date"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.hint}>Try "2026-11-05", "05/11/2026", "5 Nov" or an event name</Text>
      </View>

      <View style={styles.flex}>{renderBody()}</View>

      {/* Extended floating button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabLabel}>New event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loader: { marginTop: 40 },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 4 },
  headerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clear: { fontSize: 16, color: colors.textMuted, paddingLeft: 8 },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 8, marginLeft: 4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  pastHeader: { marginTop: 6 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  countPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countPillPast: { backgroundColor: colors.border },
  countText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  countTextPast: { color: colors.textMuted },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  inlineEmpty: { paddingHorizontal: 20, paddingVertical: 14 },
  inlineEmptyText: { fontSize: 14, color: colors.textMuted },

  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: radius.pill,
    ...shadow,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  fabPlus: { color: colors.white, fontSize: 24, lineHeight: 28, marginRight: 8 },
  fabLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
});