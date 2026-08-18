import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../src/hooks/useTheme';
import { getItem, setItem, StorageKeys } from '../src/utils/storage';
import { BibleRepo } from '../src/db/bibleRepo';
import { NotesRepo } from '../src/db/notesRepo';
import { BibleVersion } from '../src/types/bible';
import { BIBLE_VERSIONS } from '../src/constants/BibleVersions';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { mode, setThemeMode, colors } = useTheme();

  const [fontSize, setFontSize] = useState<number>(() => {
    return getItem<number>(StorageKeys.FONT_SIZE, 18);
  });
  const [version, setVersionState] = useState<BibleVersion>(() => {
    return getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
  });
  const [bookmarksCount, setBookmarksCount] = useState<number>(0);
  const [notesCount, setNotesCount] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const bookmarks = await BibleRepo.getBookmarks(db, version);
        setBookmarksCount(bookmarks.length);

        const notes = await NotesRepo.getAllNotes(db);
        setNotesCount(notes.length);
      } catch (e) {
        console.warn('Error loading stats:', e);
      }
    }
    loadStats();
  }, [db, version]);

  const handleUpdateFontSize = (newSize: number) => {
    const clamped = Math.min(Math.max(newSize, 14), 28);
    setFontSize(clamped);
    setItem(StorageKeys.FONT_SIZE, clamped);
  };

  const handleUpdateVersion = (newVersion: BibleVersion) => {
    setVersionState(newVersion);
    setItem(StorageKeys.BIBLE_VERSION, newVersion);
  };

  const themeOptions: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
              <Text style={[styles.doneBtnText, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Section 1: Bible Translation */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BIBLE TRANSLATION</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>Preferred Translation</Text>
        <View style={styles.versionSettingsList}>
          {BIBLE_VERSIONS.map((v) => {
            const isSelected = version === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.versionSettingItem,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.secondaryBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => handleUpdateVersion(v.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text
                      style={[
                        styles.versionSettingTitle,
                        {
                          color: isSelected ? colors.tint : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {v.name} ({v.shortName})
                    </Text>
                    <View style={[styles.langBadge, { backgroundColor: isSelected ? colors.tint : colors.border }]}>
                      <Text style={[styles.langBadgeText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                        {v.language}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.versionSettingDesc, { color: colors.textSecondary }]}>
                    {v.description}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                ) : (
                  <Ionicons name="radio-button-off" size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 2: Appearance & Theme */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>Color Theme</Text>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => {
            const isSelected = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.secondaryBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={isSelected ? colors.tint : colors.textSecondary}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected ? colors.tint : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 3: Reader Typography */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>READER TYPOGRAPHY</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Default Font Size</Text>
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              onPress={() => handleUpdateFontSize(fontSize - 2)}
              style={[styles.stepperBtn, { backgroundColor: colors.secondaryBackground }]}
            >
              <Text style={[styles.stepperText, { color: colors.text }]}>A-</Text>
            </TouchableOpacity>
            <Text style={[styles.fontSizeDisplay, { color: colors.text }]}>{fontSize}pt</Text>
            <TouchableOpacity
              onPress={() => handleUpdateFontSize(fontSize + 2)}
              style={[styles.stepperBtn, { backgroundColor: colors.secondaryBackground }]}
            >
              <Text style={[styles.stepperText, { color: colors.text, fontWeight: '700' }]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Font Preview */}
        <View style={[styles.previewBox, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.tint }]}>
            PREVIEW • {version === 'CEB' ? 'Juan 3:16 (Cebuano)' : 'John 3:16 (KJV)'}
          </Text>
          <Text style={[styles.previewText, { color: colors.text, fontSize, lineHeight: fontSize * 1.55 }]}>
            {version === 'CEB'
              ? 'Kay gihigugma gayud sa Dios ang kalibutan nga tungod niana gihatag niya ang iyang bugtong Anak, aron ang tanan nga mosalig kaniya dili malaglag, kondili may kinabuhing dayon.'
              : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
          </Text>
        </View>
      </View>

      {/* Section 4: Bible Database & Engine Info */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>E-BIBLE ENGINE & DATA</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Available Translations</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>KJV 1769 & Cebuano Pinadayag</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Active Translation</Text>
          <Text style={[styles.infoValue, { color: colors.tint, fontWeight: '700' }]}>
            {version === 'CEB' ? 'Cebuano Pinadayag (CEB)' : 'King James Version (KJV)'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Canonical Books</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>66 (39 Old / 27 New)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Chapters</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1,189 Chapters</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Offline Scripture</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>62,138 Verses (100% Offline)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Database Storage</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#34C759" style={{ marginRight: 4 }} />
            <Text style={styles.statusBadgeText}>Active & Fully Cached</Text>
          </View>
        </View>
      </View>

      {/* Section 4: Study Stats */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR STUDY STATS</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <View style={styles.row}>
            <Ionicons name="document-text-outline" size={18} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Study Notes Saved</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>{notesCount}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={styles.row}>
            <Ionicons name="bookmark-outline" size={18} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Bookmarked Verses</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>{bookmarksCount}</Text>
        </View>
      </View>

      {/* Section 5: App Info */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 50 }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>Bible Note (E-Bible Study)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0 (Expo SDK 54)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOptionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 14,
  },
  fontSizeDisplay: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  previewBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  previewText: {
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionSettingsList: {
    marginTop: 4,
  },
  versionSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  versionSettingTitle: {
    fontSize: 15,
  },
  versionSettingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  langBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
