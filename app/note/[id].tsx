import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { NotesRepo } from '../../src/db/notesRepo';
import { useVerseDetector, formatPassageQuote } from '../../src/hooks/useVerseDetector';
import { useTheme } from '../../src/hooks/useTheme';
import { RichEditor } from '../../src/components/RichEditor';
import { VersePreviewModal } from '../../src/components/VersePreviewModal';
import { TagPill } from '../../src/components/TagPill';
import { ParsedPassageRef, PassageDetails } from '../../src/types/bible';

export default function NoteDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    initialTitle?: string | string[];
    initialContent?: string | string[];
  }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const noteId = rawId ? parseInt(rawId, 10) : null;
  const isNew = !noteId || isNaN(noteId);

  const rawInitialTitle = Array.isArray(params.initialTitle) ? params.initialTitle[0] : params.initialTitle;
  const rawInitialContent = Array.isArray(params.initialContent) ? params.initialContent[0] : params.initialContent;

  const [title, setTitle] = useState<string>(rawInitialTitle || '');
  const [content, setContent] = useState<string>(rawInitialContent || '');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!isNew);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Hook continuously parses verse references and provides offline preview
  const {
    detectedReferences,
    selectedPassage,
    isLoadingPassage,
    openVersePreview,
    closeVersePreview,
    fetchPassageQuote,
  } = useVerseDetector(content);

  // Load existing note from SQLite
  useEffect(() => {
    async function loadNote() {
      if (isNew || !noteId) return;

      try {
        setIsLoading(true);
        const note = await NotesRepo.getNoteById(db, noteId);
        if (note) {
          setTitle(note.title || '');
          setContent(note.content || '');
          setTags(note.tags || []);
        } else {
          Alert.alert('Note Not Found', 'This note could not be found in local storage.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } catch (err) {
        console.error('Failed to load note:', err);
        Alert.alert('Error', 'Failed to load note from local database.');
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [db, noteId, isNew, router]);

  // Save Note to SQLite
  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      router.back();
      return;
    }

    try {
      setIsSaving(true);
      if (isNew) {
        await NotesRepo.createNote(db, title.trim() || 'Untitled Note', content, tags);
      } else if (noteId) {
        await NotesRepo.updateNote(db, noteId, title.trim() || 'Untitled Note', content, tags);
      }
      router.back();
    } catch (err) {
      console.error('Failed to save note:', err);
      Alert.alert('Save Error', 'Failed to save note to local SQLite database.');
    } finally {
      setIsSaving(false);
    }
  }, [db, isNew, noteId, title, content, tags, router]);

  // Delete Note Confirmation
  const handleDelete = useCallback(() => {
    if (isNew || !noteId) return;

    Alert.alert('Delete Note', 'Are you sure you want to delete this study note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await NotesRepo.deleteNote(db, noteId);
            router.back();
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  }, [db, isNew, noteId, router]);

  // Add tag
  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Navigate to reader screen when user wants to read full chapter
  const handleNavigateToReader = (bookId: number, chapter: number) => {
    closeVersePreview();
    router.replace({
      pathname: '/(tabs)/bible',
      params: { bookId: bookId.toString(), chapter: chapter.toString() },
    });
  };

  // Automatically insert detected scripture quote block directly into the note
  const handleInsertVerse = useCallback(
    async (ref: ParsedPassageRef) => {
      try {
        const { quote } = await fetchPassageQuote(ref);
        if (!quote) return;

        setContent((prev) => {
          const trimmed = prev.trimEnd();
          if (!trimmed) {
            return quote;
          }
          return `${trimmed}\n\n${quote}`;
        });
      } catch (err) {
        console.error('Failed to insert verse into note:', err);
      }
    },
    [fetchPassageQuote]
  );

  // Insert scripture quote from the preview modal into the note
  const handleInsertPassageFromModal = useCallback(
    (passage: PassageDetails) => {
      const quote = formatPassageQuote(passage.verses, passage.ref);
      if (quote) {
        setContent((prev) => {
          const trimmed = prev.trimEnd();
          if (!trimmed) {
            return quote;
          }
          return `${trimmed}\n\n${quote}`;
        });
      }
      closeVersePreview();
    },
    [closeVersePreview]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isNew ? 'New Note' : 'Edit Note',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {!isNew && (
                <TouchableOpacity onPress={handleDelete} style={[styles.headerBtn, { marginRight: 14 }]}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.headerBtn}>
                <Text style={[styles.headerBtnText, { color: colors.tint, fontWeight: '700' }]}>
                  {isSaving ? 'Saving...' : 'Done'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Tags Section */}
      <View style={[styles.tagsBar, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          {tags.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              onRemove={() => handleRemoveTag(tag)}
              small
            />
          ))}

          {showTagInput ? (
            <View style={[styles.tagInputContainer, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="Tag name"
                placeholderTextColor={colors.textTertiary}
                value={newTagInput}
                onChangeText={setNewTagInput}
                onSubmitEditing={handleAddTag}
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.tagAddIcon}>
                <Ionicons name="checkmark-circle" size={18} color={colors.tint} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowTagInput(true)}
              style={[styles.addTagBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            >
              <Ionicons name="add" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.addTagText, { color: colors.textSecondary }]}>Add Tag</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Rich Editor & Live Verse Detection */}
      <RichEditor
        title={title}
        onChangeTitle={setTitle}
        content={content}
        onChangeContent={setContent}
        detectedVerses={detectedReferences}
        onPressVerse={openVersePreview}
        onInsertVerse={handleInsertVerse}
      />

      {/* Offline Verse Preview Modal */}
      <VersePreviewModal
        visible={!!selectedPassage}
        passage={selectedPassage}
        isLoading={isLoadingPassage}
        onClose={closeVersePreview}
        onNavigateToReader={handleNavigateToReader}
        onInsertVerse={handleInsertPassageFromModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  headerBtnText: {
    fontSize: 17,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginRight: 8,
  },
  addTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  tagInput: {
    fontSize: 13,
    padding: 0,
    width: 80,
  },
  tagAddIcon: {
    marginLeft: 4,
  },
});
