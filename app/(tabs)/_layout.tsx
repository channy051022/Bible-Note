import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Platform, TouchableOpacity, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        onPress={() => router.push('/saved')}
        style={styles.headerIconButton}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        activeOpacity={0.7}
      >
        <Ionicons name="bookmark-outline" size={21} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        style={styles.headerIconButton}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={21} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
        headerRight: renderHeaderRight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'SHEPHERD',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          headerTitle: 'E-Bible',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alarm"
        options={{
          title: 'Alarm',
          headerTitle: 'Spiritual Alarms',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'alarm' : 'alarm-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIconButton: {
    padding: 6,
    marginLeft: 4,
  },
});
