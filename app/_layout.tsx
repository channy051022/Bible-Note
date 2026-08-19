import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DATABASE_NAME, copyDatabaseFileIfNotExists, initializeDatabase } from '../src/db/init';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { NotificationService } from '../src/services/notificationService';
import * as Notifications from 'expo-notifications';
import { ActiveAlarmModal } from '../src/components/ActiveAlarmModal';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="light" backgroundColor="#121316" />
      <View style={styles.loadingContent}>
        <View style={styles.iconWrapper}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.loadingAppIcon}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.loadingTitle}>SHEPHERD</Text>
        <Text style={styles.loadingSubtitle}>HOLY BIBLE & DEVOTIONAL NOTES</Text>
        <View style={styles.spinnerRow}>
          <ActivityIndicator size="small" color="#E5A93C" />
          <Text style={styles.loadingStatusText}>Opening your spiritual sanctuary...</Text>
        </View>
      </View>
      <Text style={styles.loadingFooter}>Developer: Christian Faith Mestola - AsyncDev</Text>
    </View>
  );
}

function RootNavigationLayout() {
  const { isDark, colors } = useTheme();
  const [activeAlarm, setActiveAlarm] = useState<{
    visible: boolean;
    timeString: string;
    verseText: string;
    citation: string;
    bookId: number;
    chapter: number;
    ringtoneId?: string;
    customAudioUri?: string;
  } | null>(null);

  useEffect(() => {
    // 1. Listen for incoming notification in foreground
    const subReceived = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data && data.isSpiritualAlarm) {
        setActiveAlarm({
          visible: true,
          timeString: (data.timeString as string) || 'Spiritual Alarm',
          verseText: (data.text as string) || 'The Lord is my shepherd; I shall not want.',
          citation: (data.citation as string) || 'Psalm 23:1',
          bookId: Number(data.bookId) || 19,
          chapter: Number(data.chapter) || 23,
          ringtoneId: data.ringtoneId as string,
          customAudioUri: data.customAudioUri as string,
        });
      }
    });

    // 2. Listen for notification response / user tap on lock screen or banner
    const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.isSpiritualAlarm) {
        setActiveAlarm({
          visible: true,
          timeString: (data.timeString as string) || 'Spiritual Alarm',
          verseText: (data.text as string) || 'The Lord is my shepherd; I shall not want.',
          citation: (data.citation as string) || 'Psalm 23:1',
          bookId: Number(data.bookId) || 19,
          chapter: Number(data.chapter) || 23,
          ringtoneId: data.ringtoneId as string,
          customAudioUri: data.customAudioUri as string,
        });
      }
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
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
          name="plans/create-custom"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Create Reading Plan',
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

        <Stack.Screen
          name="game/index"
          options={{
            headerShown: false,
            title: 'Bible Games Hub',
          }}
        />

        <Stack.Screen
          name="game/scramble"
          options={{
            headerShown: false,
            title: 'Verse Scramble',
          }}
        />

        <Stack.Screen
          name="game/books-sort"
          options={{
            headerShown: false,
            title: 'Book Sorter',
          }}
        />

        <Stack.Screen
          name="game/crossword"
          options={{
            headerShown: false,
            title: 'Bible Crossword',
          }}
        />

        <Stack.Screen
          name="game/trivia"
          options={{
            headerShown: false,
            title: 'Bible Trivia',
          }}
        />

        <Stack.Screen
          name="game/settings"
          options={{
            headerShown: false,
            title: 'Game Settings',
          }}
        />
      </Stack>

      {/* Global Full-Screen Spiritual Ringing Alarm Modal */}
      {activeAlarm && (
        <ActiveAlarmModal
          visible={activeAlarm.visible}
          onDismiss={() => setActiveAlarm(null)}
          timeString={activeAlarm.timeString}
          verseText={activeAlarm.verseText}
          citation={activeAlarm.citation}
          bookId={activeAlarm.bookId}
          chapter={activeAlarm.chapter}
          ringtoneId={activeAlarm.ringtoneId}
          customAudioUri={activeAlarm.customAudioUri}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      const minLoadDelay = new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        // Dismiss the static OS splash screen right away so our custom AppLoadingScreen is displayed
        await SplashScreen.hideAsync().catch(() => {});

        // Concurrently run database initialization and enforce a minimum 2-second loading duration
        await Promise.all([
          copyDatabaseFileIfNotExists(),
          minLoadDelay,
        ]);

        setIsDbReady(true);
        // Automatically schedule daily morning Verse of the Day lockscreen notification
        NotificationService.setupDailyLockscreenVerse(8, 0).catch(() => {});
      } catch (e) {
        console.error('Database file copy failed:', e);
        setError(e as Error);
        // Ensure 2-second transition even on error
        await minLoadDelay;
        setIsDbReady(true);
      }
    }

    prepare();
  }, []);

  if (error) {
    console.error('App init error:', error);
  }

  if (!isDbReady) {
    return (
      <SafeAreaProvider>
        <AppLoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
          <RootNavigationLayout />
        </SQLiteProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121316',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 108,
    height: 108,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: '#1A1C22',
  },
  loadingAppIcon: {
    width: '100%',
    height: '100%',
  },
  loadingTitle: {
    marginTop: 22,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#F9FAFB',
  },
  loadingSubtitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingStatusText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  loadingFooter: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
});
