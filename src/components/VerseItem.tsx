import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Verse } from '../types/bible';
import { useTheme } from '../hooks/useTheme';

interface VerseItemProps {
  verse: Verse;
  isBookmarked: boolean;
  fontSize?: number;
  isFullScreen?: boolean;
  onToggleBookmark: (verseNumber: number) => void;
  onAddNote?: (verse: Verse) => void;
  onPressVerse?: (verse: Verse) => void;
}

export const VerseItem: React.FC<VerseItemProps> = ({
  verse,
  isBookmarked,
  fontSize = 18,
  isFullScreen = false,
  onToggleBookmark,
  onAddNote,
  onPressVerse,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, isFullScreen && styles.fullPageContainer]}>
      <TouchableOpacity
        style={[styles.textContainer, isFullScreen && { paddingRight: 0 }]}
        onPress={() => onPressVerse?.(verse)}
        activeOpacity={0.65}
      >
        <View style={[styles.verseNumberBadge, { backgroundColor: colors.glassPill, borderColor: colors.versePillBorder }]}>
          <Text style={[styles.verseNumber, { color: colors.tint, fontSize: fontSize - 5 }]}>
            {verse.verse}
          </Text>
        </View>
        <Text
          style={[
            styles.verseText,
            {
              color: colors.text,
              fontSize: fontSize,
              lineHeight: fontSize * 1.55,
            },
          ]}
        >
          {verse.text}
        </Text>
      </TouchableOpacity>

      {!isFullScreen && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onToggleBookmark(verse.verse)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.actionBtn,
              isBookmarked && { backgroundColor: colors.glassHighlight, borderRadius: 8, padding: 3 },
            ]}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? colors.gold : colors.textTertiary}
            />
          </TouchableOpacity>

          {onAddNote && (
            <TouchableOpacity
              onPress={() => onAddNote(verse)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fullPageContainer: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  verseNumberBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
    marginTop: 3,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumber: {
    fontWeight: '700',
  },
  verseText: {
    flex: 1,
    fontFamily: 'System',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  actionBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
