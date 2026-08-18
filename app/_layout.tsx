import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME, copyDatabaseFileIfNotExists, initializeDatabase } from '../src/db/init';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { NotificationService } from '../src/services/notificationService';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigationLayout() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.tint,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Settings',
          }}
        />

        <Stack.Screen
          name="saved"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Saved Bookmarks',
          }}
        />

        <Stack.Screen
          name="widgets"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Home Screen Widgets',
          }}
        />

        <Stack.Screen
          name="note/[id]"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Note',
          }}
        />

        <Stack.Screen
          name="note/new"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Note',
          }}
        />

        <Stack.Screen
          name="plan/[id]"
          options={{
            headerShown: true,
            title: 'Reading Plan',
          }}
        />

        <Stack.Screen
          name="plan/new"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Create Plan',
          }}
        />

        <Stack.Screen
          name="reader/picker"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Select Book & Chapter',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await copyDatabaseFileIfNotExists();
        setIsDbReady(true);
        // Automatically schedule daily morning Verse of the Day lockscreen notification
        NotificationService.setupDailyLockscreenVerse(8, 0).catch(() => {});
      } catch (e) {
        console.error('Database file copy failed:', e);
        setError(e as Error);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  if (error) {
    console.error('App init error:', error);
  }

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <RootNavigationLayout />
      </SQLiteProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
