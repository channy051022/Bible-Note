import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { NotesRepo } from '../../src/db/notesRepo';
import { useTheme } from '../../src/hooks/useTheme';
import { TagPill } from '../../src/components/TagPill';
import { Note } from '../../src/types/note';

export default function NotesManagerScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fetchedNotes, fetchedTags] = await Promise.all([
        NotesRepo.getAllNotes(db, selectedTag || undefined),
        NotesRepo.getAllTags(db),
      ]);
      setNotes(fetchedNotes);
      setTags(fetchedTags);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  }, [db, selectedTag]);

  // Reload whenever screen comes into focus or tag filter changes
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCreateNote = () => {
    router.push('/note/new');
  };

  const handleOpenNote = (id: number) => {
    router.push({
      pathname: '/note/[id]',
      params: { id: id.toString() },
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with New Note Action & Tags */}
      <View style={[styles.topSection, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Study Notes</Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.tint }]}
            onPress={handleCreateNote}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.createBtnText}>New Note</Text>
          </TouchableOpacity>
        </View>

        {/* Tag Filters Carousel */}
        {tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
          >
            <TagPill
              label="All"
              isSelected={selectedTag === null}
              onPress={() => setSelectedTag(null)}
              small
            />
            {tags.map((t) => (
              <TagPill
                key={t.tag}
                label={t.tag}
                count={t.count}
                isSelected={selectedTag === t.tag}
                onPress={() => setSelectedTag(selectedTag === t.tag ? null : t.tag)}
                small
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notes Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {selectedTag
                ? `No notes tagged with #${selectedTag}.`
                : 'Create your first offline Bible study note with auto verse detection.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyCreateBtn, { backgroundColor: colors.tint }]}
              onPress={handleCreateNote}
            >
              <Text style={styles.emptyCreateText}>Create Note</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.noteCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
            onPress={() => handleOpenNote(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.noteHeader}>
              <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title || 'Untitled Note'}
              </Text>
              <View style={[styles.dateBadge, { backgroundColor: colors.glassInput }]}>
                <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                  {formatDate(item.updated_at)}
                </Text>
              </View>
            </View>

            <Text style={[styles.noteSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.content || 'Empty note...'}
            </Text>

            {item.tags && item.tags.length > 0 && (
              <View style={styles.noteTagsRow}>
                {item.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[styles.miniTag, { backgroundColor: colors.glassPill, borderColor: colors.versePillBorder }]}
                  >
                    <Text style={[styles.miniTagText, { color: colors.tint }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tagsContainer: {
    paddingVertical: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noteDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteSnippet: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 6,
    marginTop: 2,
  },
  miniTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCreateBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyCreateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
