import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME, copyDatabaseFileIfNotExists, initializeDatabase } from '../src/db/init';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';

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
          name="reader/picker"
          options={{
            presentation: 'formSheet',
            headerShown: true,
            title: 'Select Book & Chapter',
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
