import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { BibleRepo } from '../src/db/bibleRepo';
import { getItem, StorageKeys } from '../src/utils/storage';
import { BibleVersion, Book, Verse } from '../src/types/bible';
import { getTodayVerseRef, DailyVerseRef } from '../src/constants/VerseOfTheDay';
import { BIBLE_BOOKS } from '../src/constants/BibleBooks';
import { WidgetBridgeService } from '../src/services/widgetBridgeService';

type WidgetSize = 'small' | 'medium' | 'large';
type WidgetTheme = 'glass' | 'pure_glass' | 'gold' | 'midnight' | 'emerald';
type WidgetSource = 'daily' | 'bookmark' | 'custom';

export default function VerseWidgetsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, isDark } = useTheme();

  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>(() => getItem<WidgetTheme>('WIDGET_THEME', 'glass'));
  const [widgetSource, setWidgetSource] = useState<WidgetSource>('daily');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [syncedToast, setSyncedToast] = useState<boolean>(false);

  // Daily verse data
  const [dailyVerse, setDailyVerse] = useState<{ book: Book; verse: Verse; citation: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<Array<{ book: Book; verse: Verse; citation: string }>>([]);
  const [selectedBookmarkIndex, setSelectedBookmarkIndex] = useState<number>(0);
  const [version, setVersion] = useState<BibleVersion>('KJV');

  useEffect(() => {
    async function loadData() {
      try {
        const v = getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
        setVersion(v);

        // 1. Fetch Today's Verse
        const ref: DailyVerseRef = getTodayVerseRef();
        const book = await BibleRepo.getBookById(db, ref.bookId);
        const verses = await BibleRepo.getChapterVerses(db, ref.bookId, ref.chapter, v);
        const found = verses.find((item: Verse) => item.verse === ref.verse) || verses[0];
        if (book && found) {
          const citation = `${book.name} ${ref.chapter}:${found.verse}`;
          setDailyVerse({
            book,
            verse: found,
            citation,
          });

          // Sync to native iOS WidgetKit & Android AppWidget storage
          const currentTheme = getItem<WidgetTheme>('WIDGET_THEME', 'glass');
          WidgetBridgeService.syncVerseToNativeWidget(citation, found.text, v, ref.bookId, ref.chapter, currentTheme);
        }

        // 2. Fetch Bookmarks
        const bms = await BibleRepo.getBookmarks(db, v);
        const formattedBms: Array<{ book: Book; verse: Verse; citation: string }> = [];
        for (const bm of bms.slice(0, 10)) {
          const b = await BibleRepo.getBookById(db, bm.book_id);
          if (b) {
            formattedBms.push({
              book: b,
              verse: {
                id: bm.id,
                book_id: bm.book_id,
                chapter: bm.chapter,
                verse: bm.verse,
                text: bm.verse_text || '',
                book_name: bm.book_name,
              },
              citation: `${b.name} ${bm.chapter}:${bm.verse}`,
            });
          }
        }
        setBookmarks(formattedBms);
      } catch (err) {
        console.warn('Error loading widget data:', err);
      }
    }
    loadData();
  }, [db]);

  // Derive current displayed verse
  const activeVerseData =
    widgetSource === 'bookmark' && bookmarks.length > 0
      ? bookmarks[selectedBookmarkIndex] || dailyVerse
      : dailyVerse;

  const versionLabel = version === 'CEB' ? 'Cebuano' : 'KJV';

  // Theme palettes
  const getThemePalette = () => {
    switch (widgetTheme) {
      case 'pure_glass':
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)',
          border: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.18)',
          text: colors.text,
          accent: colors.tint,
          badgeBg: 'rgba(255, 255, 255, 0.15)',
        };
      case 'gold':
        return {
          bg: '#241904',
          border: '#D99B26',
          text: '#FFF4D6',
          accent: '#FFD700',
          badgeBg: 'rgba(255, 215, 0, 0.15)',
        };
      case 'midnight':
        return {
          bg: '#080E21',
          border: '#1E3A8A',
          text: '#E0E7FF',
          accent: '#60A5FA',
          badgeBg: 'rgba(96, 165, 250, 0.15)',
        };
      case 'emerald':
        return {
          bg: '#051E14',
          border: '#059669',
          text: '#D1FAE5',
          accent: '#34D399',
          badgeBg: 'rgba(52, 211, 153, 0.15)',
        };
      case 'glass':
      default:
        return {
          bg: isDark ? 'rgba(30, 34, 45, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
          text: colors.text,
          accent: colors.tint,
          badgeBg: colors.glassHighlight,
        };
    }
  };

  const theme = getThemePalette();

  const handleCopyWidget = async () => {
    if (!activeVerseData) return;
    const text = `✨ ${activeVerseData.citation} (${versionLabel})\n"${activeVerseData.verse.text}"`;
    await Clipboard.setStringAsync(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleShareWidgetWallpaper = async () => {
    if (!activeVerseData) return;
    try {
      await Share.share({
        title: `Home Screen Verse Widget: ${activeVerseData.citation}`,
        message: `✨ VERSE OF THE DAY ✨\n\n"${activeVerseData.verse.text}"\n\n— ${activeVerseData.citation} (${versionLabel})\n\nDaily scripture from Shepherd / BibleNote`,
      });
    } catch (e) {
      console.error('Share widget error:', e);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Stack.Screen
        options={{
          title: 'Home Screen Widgets',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
              <Text style={[styles.doneBtnText, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 1. Live Phone Home Screen Mockup */}
      <View style={styles.mockupSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PHONE HOME SCREEN LIVE PREVIEW</Text>

        <View style={[styles.phoneFrame, { backgroundColor: isDark ? '#05070B' : '#E5E9F0', borderColor: colors.border }]}>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Text style={[styles.statusTime, { color: colors.textSecondary }]}>9:41</Text>
            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Ionicons name="wifi" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Ionicons name="battery-full" size={14} color={colors.textSecondary} />
            </View>
          </View>

          {/* Widget Container */}
          <View style={styles.mockupContentArea}>
            {activeVerseData ? (
              <View
                style={[
                  styles.widgetContainer,
                  widgetSize === 'small' && styles.widgetSmall,
                  widgetSize === 'medium' && styles.widgetMedium,
                  widgetSize === 'large' && styles.widgetLarge,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Header Badge */}
                <View style={styles.widgetHeaderRow}>
                  <View style={[styles.widgetBadgePill, { backgroundColor: theme.badgeBg }]}>
                    <Ionicons name="sparkles" size={11} color={theme.accent} style={{ marginRight: 4 }} />
                    <Text style={[styles.widgetBadgeText, { color: theme.accent }]}>
                      {widgetSource === 'daily' ? 'DAILY VERSE' : 'MY VERSE'}
                    </Text>
                  </View>
                  <Text style={[styles.widgetVersionText, { color: theme.accent }]}>{versionLabel}</Text>
                </View>

                {/* Verse Text */}
                <Text
                  style={[
                    styles.widgetVerseText,
                    widgetSize === 'small' && styles.textSmall,
                    widgetSize === 'large' && styles.textLarge,
                    { color: theme.text },
                  ]}
                  numberOfLines={widgetSize === 'small' ? 3 : widgetSize === 'medium' ? 4 : 7}
                >
                  "{activeVerseData.verse.text}"
                </Text>

                {/* Citation */}
                <Text style={[styles.widgetCitationText, { color: theme.accent }]}>
                  — {activeVerseData.citation}
                </Text>

                {/* Extra devotion reflection for Large widget */}
                {widgetSize === 'large' && (
                  <View style={[styles.largeExtraBox, { borderTopColor: theme.border }]}>
                    <Text style={[styles.largeExtraText, { color: theme.text }]}>
                      💭 Reflect: God's truth brings peace and guidance to your footsteps today.
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Fake App Icons underneath to simulate Home Screen */}
            <View style={styles.fakeIconsRow}>
              {['call', 'mail', 'camera', 'musical-notes'].map((iconName, idx) => (
                <View key={idx} style={[styles.fakeAppIcon, { backgroundColor: colors.glassInput }]}>
                  <Ionicons name={iconName as any} size={20} color={colors.textSecondary} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 2. Customization Controls */}
      <View style={styles.controlsSection}>
        {/* Widget Size Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WIDGET SIZE</Text>
        <View style={styles.pillsRow}>
          {[
            { id: 'small', label: 'Small (2×2)' },
            { id: 'medium', label: 'Medium (4×2)' },
            { id: 'large', label: 'Large (4×4)' },
          ].map((item) => {
            const isSelected = widgetSize === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setWidgetSize(item.id as WidgetSize)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillBtnText, { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Widget Theme Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 18 }]}>WIDGET THEME</Text>
        <View style={styles.pillsRow}>
          {[
            { id: 'glass', label: 'Frosted Glass', color: colors.tint },
            { id: 'pure_glass', label: 'Pure Glass', color: '#60A5FA' },
            { id: 'gold', label: 'Sunrise Gold', color: '#E5A93C' },
            { id: 'midnight', label: 'Midnight Blue', color: '#818CF8' },
            { id: 'emerald', label: 'Emerald Olive', color: '#34D399' },
          ].map((item) => {
            const isSelected = widgetTheme === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                    borderColor: isSelected ? item.color : colors.border,
                  },
                ]}
                onPress={() => {
                  const newTheme = item.id as WidgetTheme;
                  setWidgetTheme(newTheme);
                  if (activeVerseData) {
                    WidgetBridgeService.syncVerseToNativeWidget(
                      activeVerseData.citation,
                      activeVerseData.verse.text,
                      version,
                      activeVerseData.book.id,
                      activeVerseData.verse.chapter,
                      newTheme
                    );
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillBtnText, { color: isSelected ? item.color : colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Widget Source Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 18 }]}>SCRIPTURE SOURCE</Text>
        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              {
                backgroundColor: widgetSource === 'daily' ? colors.tintLight : colors.glassInput,
                borderColor: widgetSource === 'daily' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setWidgetSource('daily')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillBtnText, { color: widgetSource === 'daily' ? colors.tint : colors.text }]}>
              🌟 Daily Verse of the Day
            </Text>
          </TouchableOpacity>

          {bookmarks.length > 0 && (
            <TouchableOpacity
              style={[
                styles.pillBtn,
                {
                  backgroundColor: widgetSource === 'bookmark' ? colors.tintLight : colors.glassInput,
                  borderColor: widgetSource === 'bookmark' ? colors.tint : colors.border,
                },
              ]}
              onPress={() => setWidgetSource('bookmark')}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillBtnText, { color: widgetSource === 'bookmark' ? colors.tint : colors.text }]}>
                🔖 Saved Bookmarks ({bookmarks.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* If Bookmarks Selected: Carousel to pick bookmark */}
        {widgetSource === 'bookmark' && bookmarks.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookmarksPickerScroll}>
            {bookmarks.map((bm, idx) => {
              const isBmSelected = selectedBookmarkIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.bmPill,
                    {
                      backgroundColor: isBmSelected ? colors.tint : colors.glassInput,
                      borderColor: isBmSelected ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedBookmarkIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bmPillText, { color: isBmSelected ? '#FFFFFF' : colors.text }]}>
                    {bm.citation}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* 3. Action Buttons */}
        <View style={styles.actionButtonsArea}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
            onPress={async () => {
              if (activeVerseData) {
                await WidgetBridgeService.syncVerseToNativeWidget(
                  activeVerseData.citation,
                  activeVerseData.verse.text,
                  version,
                  activeVerseData.book.id,
                  activeVerseData.verse.chapter,
                  widgetTheme
                );
                setSyncedToast(true);
                setTimeout(() => setSyncedToast(false), 2500);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={syncedToast ? 'checkmark-circle' : 'sync-outline'}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryBtnText}>
              {syncedToast ? 'Synced with Phone Widget! ✓' : 'Sync to Native Phone Widget'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.glassInput, borderColor: colors.border, marginBottom: 10 }]}
            onPress={handleShareWidgetWallpaper}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Export as Lock Screen Wallpaper</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            onPress={handleCopyWidget}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copiedToast ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copiedToast ? colors.success : colors.text}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.secondaryBtnText, { color: copiedToast ? colors.success : colors.text }]}>
              {copiedToast ? 'Widget Text Copied! ✓' : 'Copy Widget Scripture'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Native Widget Gallery Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="apps-outline" size={18} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.instructionsTitle, { color: colors.text, marginBottom: 0 }]}>
              How to add from iOS / Android Widget Gallery:
            </Text>
          </View>
          <Text style={[styles.instructionsStep, { color: colors.textSecondary }]}>
            1. Long-press any empty space on your phone's Home Screen until apps jiggle.
          </Text>
          <Text style={[styles.instructionsStep, { color: colors.textSecondary }]}>
            2. Tap the <Text style={{ fontWeight: '700', color: colors.tint }}>"+" (Add Widget)</Text> button in the top corner (shown in your screenshot).
          </Text>
          <Text style={[styles.instructionsStep, { color: colors.textSecondary }]}>
            3. Search for <Text style={{ fontWeight: '700', color: colors.text }}>"SHEPHERD"</Text> in the search bar.
          </Text>
          <Text style={[styles.instructionsStep, { color: colors.textSecondary }]}>
            4. Swipe to choose Small (2×2), Medium (4×2), or Large (4×4) and tap <Text style={{ fontWeight: '700', color: colors.tint }}>"Add Widget"</Text>!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mockupSection: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  phoneFrame: {
    borderRadius: 26,
    borderWidth: 2,
    padding: 14,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockupContentArea: {
    alignItems: 'center',
  },
  widgetContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  widgetSmall: {
    width: 170,
    height: 170,
    justifyContent: 'space-between',
  },
  widgetMedium: {
    width: '100%',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  widgetLarge: {
    width: '100%',
    minHeight: 240,
    justifyContent: 'space-between',
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  widgetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  widgetVersionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  widgetVerseText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  textSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  textLarge: {
    fontSize: 15,
    lineHeight: 22,
  },
  widgetCitationText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  largeExtraBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  largeExtraText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'normal',
  },
  fakeIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  fakeAppIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsSection: {
    padding: 16,
    paddingBottom: 40,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  pillBtnText: {
    fontSize: 13,
  },
  bookmarksPickerScroll: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 8,
  },
  bmPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  bmPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsArea: {
    marginTop: 20,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructionsStep: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
});
