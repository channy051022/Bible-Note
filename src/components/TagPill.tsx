import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface TagPillProps {
  label: string;
  count?: number;
  isSelected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  small?: boolean;
}

export const TagPill: React.FC<TagPillProps> = ({
  label,
  count,
  isSelected = false,
  onPress,
  onRemove,
  small = false,
}) => {
  const { colors } = useTheme();

  const backgroundColor = isSelected
    ? colors.tint
    : colors.glassInput;

  const textColor = isSelected
    ? '#FFFFFF'
    : colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress && !onRemove}
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor,
          borderColor: isSelected ? colors.tint : colors.border,
          paddingVertical: small ? 4 : 6,
          paddingHorizontal: small ? 8 : 12,
        },
      ]}
    >
      <Text style={[styles.label, { color: textColor, fontSize: small ? 12 : 14 }]}>
        #{label}
      </Text>

      {count !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.border,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: textColor }]}>{count}</Text>
        </View>
      )}

      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeIcon}
        >
          <Ionicons name="close-circle" size={14} color={textColor} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeIcon: {
    marginLeft: 4,
  },
});
