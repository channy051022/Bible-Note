import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Platform, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const isAndroid = Platform.OS === 'android';
  const bottomInset = insets.bottom;
  // On Android with 3-button navigation, bottomInset is 48-56dp; on gesture nav it's 16-32dp.
  // We add bottomInset to tabHeight and paddingBottom so navigation items are completely above the phone's navigation bar.
  const tabHeight = (isAndroid ? 60 : 54) + bottomInset;
  const tabPaddingBottom = bottomInset > 0 ? bottomInset : (isAndroid ? 8 : 24);

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
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        headerTitleAlign: 'center',
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
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          headerTitle: 'E-Bible',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alarm"
        options={{
          title: 'Alarm',
          headerTitle: 'Spiritual Alarms',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'alarm' : 'alarm-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={23} color={color} />
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

