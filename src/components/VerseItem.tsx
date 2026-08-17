import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Verse } from '../types/bible';
import { useTheme } from '../hooks/useTheme';

interface VerseItemProps {
  verse: Verse;
  isBookmarked: boolean;
  fontSize?: number;
  onToggleBookmark: (verseNumber: number) => void;
  onAddNote?: (verse: Verse) => void;
}

export const VerseItem: React.FC<VerseItemProps> = ({
  verse,
  isBookmarked,
  fontSize = 18,
  onToggleBookmark,
  onAddNote,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.verseNumber, { color: colors.tint, fontSize: fontSize - 4 }]}>
          {verse.verse}
        </Text>
        <Text
          style={[
            styles.verseText,
            {
              color: colors.text,
              fontSize: fontSize,
              lineHeight: fontSize * 1.5,
            },
          ]}
        >
          {verse.text}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onToggleBookmark(verse.verse)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={isBookmarked ? colors.gold : colors.textTertiary}
          />
        </TouchableOpacity>

        {onAddNote && (
          <TouchableOpacity
            onPress={() => onAddNote(verse)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Ionicons name="create-outline" size={19} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
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
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
  },
  verseNumber: {
    fontWeight: '700',
    width: 26,
    paddingTop: 2,
  },
  verseText: {
    flex: 1,
    fontFamily: 'System',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  actionBtn: {
    marginLeft: 10,
  },
});
