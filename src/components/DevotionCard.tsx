import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Devotion } from '../types/devotion';
import { useTheme } from '../hooks/useTheme';

interface DevotionCardProps {
  devotion: Devotion;
  isCompleted?: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  showCategory?: boolean;
  completionDate?: string;
}

export const DevotionCard: React.FC<DevotionCardProps> = ({
  devotion,
  isCompleted = false,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  showCategory = true,
  completionDate,
}) => {
  const { colors } = useTheme();

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Faith':
        return '#3B82F6';
      case 'Hope':
        return '#06B6D4';
      case 'Love':
        return '#EC4899';
      case 'Prayer':
        return '#8B5CF6';
      case 'Strength':
        return '#E11D48';
      case 'Guidance':
        return '#F59E0B';
      case 'Gratitude':
        return '#10B981';
      case 'Forgiveness':
        return '#6366F1';
      case 'Peace':
        return '#14B8A6';
      case 'Wisdom':
        return '#D97706';
      case 'Anxiety & Worry':
        return '#F97316';
      case 'Personal Growth':
        return '#84CC16';
      default:
        return colors.tint;
    }
  };

  const catColor = getCategoryColor(devotion.category);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.glassCard,
          borderColor: isCompleted ? `${colors.success}40` : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          {showCategory && (
            <View style={[styles.categoryPill, { backgroundColor: `${catColor}1A` }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{devotion.category}</Text>
            </View>
          )}

          <View style={styles.readTimeBadge}>
            <Ionicons name="time-outline" size={11} color={colors.textTertiary} style={{ marginRight: 3 }} />
            <Text style={[styles.readTimeText, { color: colors.textTertiary }]}>
              {devotion.estimatedReadingMinutes} min
            </Text>
          </View>

          {devotion.isUserCreated && (
            <View style={[styles.userBadge, { backgroundColor: `${colors.gold}20` }]}>
              <Text style={[styles.userBadgeText, { color: colors.gold }]}>MY DEVOTION</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              style={styles.favBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? '#E11D48' : colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={[styles.completedBadge, { backgroundColor: `${colors.success}20` }]}>
              <Ionicons name="checkmark" size={12} color={colors.success} style={{ marginRight: 3 }} />
              <Text style={[styles.completedText, { color: colors.success }]}>Done</Text>
            </View>
          )}
        </View>
      </View>

      {/* Devotion Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {devotion.title}
      </Text>

      {/* Scripture Reference */}
      <View style={styles.scriptureRow}>
        <Ionicons name="book-outline" size={13} color={colors.tint} style={{ marginRight: 5 }} />
        <Text style={[styles.scriptureText, { color: colors.tint }]}>{devotion.scriptureCitation}</Text>
      </View>

      {/* Reflection Preview */}
      <Text style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={2}>
        {devotion.reflectionContent.replace(/\n+/g, ' ')}
      </Text>

      {/* Bottom Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {completionDate ? (
          <Text style={[styles.completionDateText, { color: colors.textTertiary }]}>
            Completed on {new Date(completionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        ) : (
          <Text style={[styles.footerPromptText, { color: colors.textTertiary }]}>
            Tap to begin quiet moment
          </Text>
        )}

        <View style={styles.readMoreRow}>
          <Text style={[styles.readMoreText, { color: colors.tint }]}>Read Devotion</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.tint} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  userBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favBtn: {
    padding: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  scriptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  completionDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerPromptText: {
    fontSize: 11,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
});
