// App entry point: navigation setup + notification channel + tap-on-notification handling.

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import HomeScreen from './src/screens/HomeScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import { setupNotificationChannel } from './src/utils/notifications';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  useEffect(() => {
    // Create the Android notification channel as soon as the app starts.
    setupNotificationChannel().catch((error) => console.warn('Channel setup failed:', error));

    // When the user taps a reminder, open that event's details.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = response.notification.request.content.data?.eventId;
      if (eventId && navigationRef.isReady()) {
        navigationRef.navigate('EventDetail', { eventId });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Home draws its own teal header, so the default one is hidden */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'New Event' }} />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: 'Event Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}