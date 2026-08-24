import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { DevotionsRepo } from '../../src/db/devotionsRepo';
import { BibleRepo } from '../../src/db/bibleRepo';
import { Devotion, DevotionCategory, DEVOTION_CATEGORIES } from '../../src/types/devotion';
import { BIBLE_BOOKS } from '../../src/constants/BibleBooks';
import { getItem, StorageKeys } from '../../src/utils/storage';
import { BibleVersion } from '../../src/types/bible';

export default function CreateDevotionScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  // Form states
  const [title, setTitle] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<number>(43); // John
  const [chapter, setChapter] = useState<string>('3');
  const [verse, setVerse] = useState<string>('16');
  const [scriptureText, setScriptureText] = useState<string>('');
  const [category, setCategory] = useState<DevotionCategory>('Faith');
  const [reflectionContent, setReflectionContent] = useState<string>('');
  const [reflectionQuestion, setReflectionQuestion] = useState<string>('');
  const [prayer, setPrayer] = useState<string>('');
  const [readMinutes, setReadMinutes] = useState<number>(3);
  const [isFetchingVerse, setIsFetchingVerse] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-fetch verse text from Bible database
  const handleAutoFetchVerse = async () => {
    const chapNum = parseInt(chapter, 10);
    const verseNum = parseInt(verse, 10);
    if (isNaN(chapNum) || isNaN(verseNum)) {
      Alert.alert('Invalid Reference', 'Please enter valid numbers for chapter and verse.');
      return;
    }

    try {
      setIsFetchingVerse(true);
      const version = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
      const verses = await BibleRepo.getChapterVerses(db, selectedBookId, chapNum, version);
      const found = verses.find((v) => v.verse === verseNum);

      if (found && found.text) {
        setScriptureText(found.text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Verse Not Found', `Could not find verse ${verseNum} in chapter ${chapNum}.`);
      }
    } catch (e) {
      console.error('Error fetching verse text:', e);
    } finally {
      setIsFetchingVerse(false);
    }
  };

  const selectedBook = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || BIBLE_BOOKS[42];

  const handleSaveDevotion = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your devotional reflection.');
      return;
    }

    if (!scriptureText.trim()) {
      Alert.alert('Scripture Required', 'Please provide or fetch the Bible verse text.');
      return;
    }

    if (!reflectionContent.trim()) {
      Alert.alert('Reflection Required', 'Please write your devotional reflection paragraphs.');
      return;
    }

    try {
      setIsSaving(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const chapNum = parseInt(chapter, 10) || 1;
      const verseNum = parseInt(verse, 10) || 1;
      const citation = `${selectedBook.name} ${chapNum}:${verseNum}`;

      const newDevotion: Devotion = {
        id: `custom-${Date.now()}`,
        title: title.trim(),
        scriptureCitation: citation,
        scriptureText: scriptureText.trim(),
        bookId: selectedBookId,
        chapter: chapNum,
        verse: verseNum,
        category,
        reflectionContent: reflectionContent.trim(),
        reflectionQuestion:
          reflectionQuestion.trim() || `How can you apply ${citation} in your life today?`,
        prayer:
          prayer.trim() ||
          `Lord, thank You for speaking through ${citation}. Help me live according to Your Word. Amen.`,
        estimatedReadingMinutes: readMinutes,
        isUserCreated: true,
        createdAt: new Date().toISOString(),
      };

      await DevotionsRepo.createUserDevotion(db, newDevotion);
      router.back();
    } catch (e) {
      console.error('Error creating devotion:', e);
      Alert.alert('Error', 'Failed to create devotional entry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Create Devotion',
            headerShown: true,
            headerRight: () => (
              <TouchableOpacity
                onPress={handleSaveDevotion}
                style={[styles.headerSaveBtn, { backgroundColor: colors.tint }]}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.headerSaveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Title Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>DEVOTIONAL TITLE</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Walking in Grace Through the Storm"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* 2. Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {DEVOTION_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.tint : colors.glassInput,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. Scripture Reference */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SCRIPTURE PASSAGE</Text>

            {/* Book picker horizontal selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksScroll}
            >
              {BIBLE_BOOKS.map((b) => {
                const isSel = selectedBookId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bookChip,
                      {
                        backgroundColor: isSel ? `${colors.tint}20` : colors.glassInput,
                        borderColor: isSel ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedBookId(b.id)}
                  >
                    <Text
                      style={[
                        styles.bookChipText,
                        { color: isSel ? colors.tint : colors.textSecondary, fontWeight: isSel ? '700' : '500' },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Chapter & Verse numbers + Fetch button */}
            <View style={styles.refRow}>
              <View style={styles.refCol}>
                <Text style={[styles.subLabel, { color: colors.textTertiary }]}>Chapter</Text>
                <TextInput
                  style={[
                    styles.numInput,
                    {
                      backgroundColor: colors.glassCard,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="numeric"
                  value={chapter}
                  onChangeText={setChapter}
                />
              </View>

              <View style={styles.refCol}>
                <Text style={[styles.subLabel, { color: colors.textTertiary }]}>Verse</Text>
                <TextInput
                  style={[
                    styles.numInput,
                    {
                      backgroundColor: colors.glassCard,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="numeric"
                  value={verse}
                  onChangeText={setVerse}
                />
              </View>

              <TouchableOpacity
                style={[styles.fetchBtn, { backgroundColor: colors.tint }]}
                onPress={handleAutoFetchVerse}
                disabled={isFetchingVerse}
                activeOpacity={0.8}
              >
                {isFetchingVerse ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.fetchBtnText}>Fetch Verse</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Scripture Verse Text Input */}
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: colors.border,
                  color: colors.text,
                  marginTop: 10,
                },
              ]}
              placeholder="Verse text (auto-fetched or typed manually)..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={scriptureText}
              onChangeText={setScriptureText}
            />
          </View>

          {/* 4. Devotional Reflection Content */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>DEVOTIONAL REFLECTION</Text>
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              Write 2-3 paragraphs explaining the meaning of the Scripture and relating it to daily life.
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 130,
                },
              ]}
              placeholder="What is God speaking through this verse? How does it encourage or challenge our daily walk?"
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              value={reflectionContent}
              onChangeText={setReflectionContent}
            />
          </View>

          {/* 5. Think About It Question */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>THINK ABOUT IT (QUESTION)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. What is one area where you need to surrender control to God today?"
              placeholderTextColor={colors.textTertiary}
              value={reflectionQuestion}
              onChangeText={setReflectionQuestion}
            />
          </View>

          {/* 6. Today's Prayer */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>PRAYER</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.glassCard,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 80,
                },
              ]}
              placeholder="Write a prayer related to this devotional theme..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              value={prayer}
              onChangeText={setPrayer}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.tint }]}
            onPress={handleSaveDevotion}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Publish to My Devotions</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 4,
  },
  headerSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 21,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  booksScroll: {
    gap: 6,
    paddingVertical: 6,
  },
  bookChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  bookChipText: {
    fontSize: 12,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  refCol: {
    flex: 1,
  },
  numInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    textAlign: 'center',
  },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  fetchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
