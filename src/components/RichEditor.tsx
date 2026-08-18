import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ParsedPassageRef } from '../types/bible';
import { formatPassageRef } from '../utils/verseParser';

interface RichEditorProps {
  title: string;
  onChangeTitle: (title: string) => void;
  content: string;
  onChangeContent: (content: string) => void;
  detectedVerses: ParsedPassageRef[];
  onPressVerse: (ref: ParsedPassageRef) => void;
  onInsertVerse?: (ref: ParsedPassageRef) => void;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  title,
  onChangeTitle,
  content,
  onChangeContent,
  detectedVerses,
  onPressVerse,
  onInsertVerse,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const contentInputRef = useRef<TextInput>(null);

  // Helper to insert markdown formatting at current position or append
  const applyFormat = (prefix: string, suffix: string = '') => {
    const newContent = content ? `${content}\n${prefix}${suffix}` : `${prefix}${suffix}`;
    onChangeContent(newContent);
    contentInputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <TextInput
          style={[styles.titleInput, { color: colors.text }]}
          placeholder="Note Title"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={onChangeTitle}
          returnKeyType="next"
          onSubmitEditing={() => contentInputRef.current?.focus()}
        />

        {/* Detected Verse Chips Bar */}
        {detectedVerses.length > 0 && (
          <View style={[styles.verseBar, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.verseBarHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={14} color={colors.tint} style={{ marginRight: 5 }} />
                <Text style={[styles.verseBarTitle, { color: colors.tint }]}>
                  Detected Scripture ({detectedVerses.length})
                </Text>
              </View>
              <Text style={[styles.verseBarTip, { color: colors.textSecondary }]}>
                Tap + to insert
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {detectedVerses.map((ref, idx) => (
                <View
                  key={`${ref.bookId}-${ref.chapter}-${ref.startVerse}-${idx}`}
                  style={[styles.verseChipContainer, { backgroundColor: colors.glassPill, borderColor: colors.versePillBorder }]}
                >
                  <TouchableOpacity
                    style={styles.verseChipMain}
                    onPress={() => (onInsertVerse ? onInsertVerse(ref) : onPressVerse(ref))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={14} color={colors.versePillText} style={{ marginRight: 5 }} />
                    <Text style={[styles.verseChipText, { color: colors.versePillText }]}>
                      {formatPassageRef(ref)}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.chipDivider, { backgroundColor: colors.versePillBorder }]} />

                  <TouchableOpacity
                    style={styles.verseChipPreview}
                    onPress={() => onPressVerse(ref)}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={14} color={colors.versePillText} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Body Input */}
        <TextInput
          ref={contentInputRef}
          style={[styles.contentInput, { color: colors.text }]}
          placeholder="Start writing notes, thoughts, or type scripture references like John 3:16 or Psalm 23:1-6..."
          placeholderTextColor={colors.textTertiary}
          value={content}
          onChangeText={onChangeContent}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          autoCapitalize="sentences"
        />
      </ScrollView>

      {/* Formatting Accessory Toolbar - Elevated with Safe Area Insets */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.glassBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16) + 10,
            paddingTop: 10,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={() => applyFormat('**', '**')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="text" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={() => applyFormat('### ')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="funnel-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={() => applyFormat('"', '"')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={() => applyFormat('• ')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="list-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={() => applyFormat('John 3:16')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.tint} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.4,
    fontFamily: 'System',
  },
  verseBar: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  verseBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verseBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verseBarTip: {
    fontSize: 11,
    fontWeight: '500',
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  verseChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  verseChipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  verseChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipDivider: {
    width: 1,
    height: 16,
  },
  verseChipPreview: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 260,
    fontFamily: 'System',
  },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
