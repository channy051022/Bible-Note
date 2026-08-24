import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedMascot } from './AnimatedMascot';
import { useTheme } from '../hooks/useTheme';

export type MascotMood = 'reading' | 'writing' | 'happy' | 'peaceful' | 'default';

interface DevotionMascotProps {
  mood?: MascotMood;
  size?: number; // size in dp, default 70
  caption?: string;
  style?: ViewStyle;
}

export const DevotionMascot: React.FC<DevotionMascotProps> = ({
  mood = 'default',
  size = 70,
  caption,
  style,
}) => {
  const { colors } = useTheme();

  const getMoodBadge = () => {
    switch (mood) {
      case 'reading':
        return { icon: 'book', label: 'In the Word', color: colors.tint };
      case 'writing':
        return { icon: 'create', label: 'Reflecting', color: colors.gold };
      case 'happy':
        return { icon: 'sparkles', label: 'Blessed', color: colors.success };
      case 'peaceful':
        return { icon: 'moon', label: 'Evening Peace', color: '#818CF8' };
      default:
        return null;
    }
  };

  const badge = getMoodBadge();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.mascotAura,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: colors.glassHighlight,
          },
        ]}
      >
        <AnimatedMascot width={size} height={Math.round(size * 1.1)} />

        {badge && (
          <View style={[styles.badgePill, { backgroundColor: colors.glassCard, borderColor: badge.color }]}>
            <Ionicons name={badge.icon as any} size={11} color={badge.color} style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{badge.label}</Text>
          </View>
        )}
      </View>

      {caption ? (
        <Text style={[styles.captionText, { color: colors.textSecondary }]}>{caption}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  mascotAura: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  captionText: {
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
