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
}

export const RichEditor: React.FC<RichEditorProps> = ({
  title,
  onChangeTitle,
  content,
  onChangeContent,
  detectedVerses,
  onPressVerse,
}) => {
  const { colors } = useTheme();
  const contentInputRef = useRef<TextInput>(null);

  // Helper to insert markdown formatting at current position or append
  const applyFormat = (prefix: string, suffix: string = '') => {
    const newContent = content ? `${content}\n${prefix} ` : `${prefix} `;
    onChangeContent(newContent);
    contentInputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
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
          <View style={[styles.verseBar, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <View style={styles.verseBarHeader}>
              <Ionicons name="sparkles" size={14} color={colors.tint} style={{ marginRight: 5 }} />
              <Text style={[styles.verseBarTitle, { color: colors.tint }]}>
                Detected Verses ({detectedVerses.length})
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {detectedVerses.map((ref, idx) => (
                <TouchableOpacity
                  key={`${ref.bookId}-${ref.chapter}-${ref.startVerse}-${idx}`}
                  style={[styles.verseChip, { backgroundColor: colors.versePill, borderColor: colors.versePillBorder }]}
                  onPress={() => onPressVerse(ref)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="book" size={12} color={colors.versePillText} style={{ marginRight: 4 }} />
                  <Text style={[styles.verseChipText, { color: colors.versePillText }]}>
                    {formatPassageRef(ref)}
                  </Text>
                </TouchableOpacity>
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

      {/* Formatting Accessory Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.secondaryBackground, borderTopColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => applyFormat('**Bold Text**')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="text" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => applyFormat('### Heading')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="funnel-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => applyFormat('> ')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => applyFormat('- ')}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="list-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
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
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verseBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  verseBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  verseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  verseChipText: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 8,
  },
});
