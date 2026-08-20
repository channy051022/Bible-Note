import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, ThemeMode } from '../src/hooks/useTheme';
import { getItem, setItem, StorageKeys } from '../src/utils/storage';
import { BibleRepo } from '../src/db/bibleRepo';
import { NotesRepo } from '../src/db/notesRepo';
import { BibleVersion, BibleVersionMeta } from '../src/types/bible';
import {
  ALL_BIBLE_VERSIONS,
  PREBUNDLED_BIBLE_VERSIONS,
  DOWNLOADABLE_BIBLE_VERSIONS,
  getBibleVersionMeta,
} from '../src/constants/BibleVersions';
import { BibleDownloadService } from '../src/services/bibleDownloadService';
import { THEME_PRESETS } from '../src/constants/ThemePresets';
import { openShepherdMessenger } from '../src/constants/support';

type CategoryFilter = 'All' | 'English' | 'Filipino' | 'Spanish' | 'European' | 'Asian';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { mode, setThemeMode, preset, setThemePreset, colors, isDark } = useTheme();

  const [fontSize, setFontSize] = useState<number>(() => {
    return getItem<number>(StorageKeys.FONT_SIZE, 18);
  });
  const [version, setVersionState] = useState<BibleVersion>(() => {
    return getItem<BibleVersion>(StorageKeys.BIBLE_VERSION, 'KJV');
  });

  // Downloaded versions state
  const [downloadedVersionIds, setDownloadedVersionIds] = useState<string[]>(() => {
    return BibleDownloadService.getDownloadedVersionIds();
  });

  // Active download state
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatusText, setDownloadStatusText] = useState<string>('');

  // Search & Category Filters for Downloadable Versions
  const [versionSearchQuery, setVersionSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [isInstalledTranslationsExpanded, setIsInstalledTranslationsExpanded] = useState<boolean>(false);
  const [isOnlineCatalogExpanded, setIsOnlineCatalogExpanded] = useState<boolean>(false);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Action: Download Bible Version from Online Repository
  const handleDownloadVersion = async (meta: BibleVersionMeta) => {
    if (downloadingVersionId) {
      Alert.alert('Download in Progress', 'Please wait for the current translation download to finish.');
      return;
    }

    try {
      setDownloadingVersionId(meta.id);
      setDownloadProgress(0.05);
      setDownloadStatusText('Starting download...');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await BibleDownloadService.downloadBibleVersion(db, meta, (progress, statusText) => {
        setDownloadProgress(progress);
        setDownloadStatusText(statusText);
      });

      // Refresh downloaded versions list
      const updatedList = BibleDownloadService.getDownloadedVersionIds();
      setDownloadedVersionIds(updatedList);

      // Auto-activate downloaded version
      setVersionState(meta.id);
      setItem(StorageKeys.BIBLE_VERSION, meta.id);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Translation Ready! 🎉',
        `${meta.name} (${meta.shortName}) has been downloaded successfully and is now your active Bible translation.`
      );
    } catch (err: any) {
      console.error('Download version error:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Download Failed',
        err.message || 'Unable to download translation. Please verify your internet connection and try again.'
      );
    } finally {
      setDownloadingVersionId(null);
      setDownloadProgress(0);
      setDownloadStatusText('');
    }
  };

  // Action: Delete Downloaded Bible Version
  const handleDeleteVersion = (meta: BibleVersionMeta) => {
    Alert.alert(
      'Remove Translation?',
      `Are you sure you want to delete ${meta.name} (${meta.shortName}) from your offline database? You can download it again anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await BibleDownloadService.deleteDownloadedVersion(db, meta.id);
            const updated = BibleDownloadService.getDownloadedVersionIds();
            setDownloadedVersionIds(updated);

            if (version.toUpperCase() === meta.id.toUpperCase()) {
              setVersionState('KJV');
              setItem(StorageKeys.BIBLE_VERSION, 'KJV');
            }
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const handleContactSupport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openShepherdMessenger();
  };

  // Filtered downloadable versions
  const filteredDownloadableVersions = useMemo(() => {
    return DOWNLOADABLE_BIBLE_VERSIONS.filter((v) => {
      // Category filter
      if (selectedCategory !== 'All' && v.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (versionSearchQuery.trim()) {
        const q = versionSearchQuery.trim().toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesShort = v.shortName.toLowerCase().includes(q);
        const matchesLang = v.language.toLowerCase().includes(q);
        const matchesDesc = v.description.toLowerCase().includes(q);
        return matchesName || matchesShort || matchesLang || matchesDesc;
      }
      return true;
    });
  }, [selectedCategory, versionSearchQuery]);

  const themeModeOptions: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const categoryOptions: CategoryFilter[] = ['All', 'English', 'Filipino', 'Spanish', 'European', 'Asian'];

  const activeMeta = getBibleVersionMeta(version);

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

      {/* Section 1: Customize Theme Color & Appearance */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CUSTOMIZE THEME COLOR</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 12 }]}>
          Choose Your Spiritual Color Palette
        </Text>

        {/* 8 Theme Color Palettes (Horizontal Scrolling) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.themePaletteScroll}
          contentContainerStyle={styles.themePaletteScrollContent}
        >
          {THEME_PRESETS.map((p) => {
            const isSelected = preset === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.themePaletteCard,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                    borderColor: isSelected ? p.primaryColor : colors.border,
                  },
                ]}
                onPress={() => setThemePreset(p.id)}
                activeOpacity={0.7}
              >
                <View style={styles.themeCardTop}>
                  <Text style={styles.themeIcon}>{p.icon}</Text>
                  <View style={styles.swatchRow}>
                    <View style={[styles.swatchCircle, { backgroundColor: p.primaryColor }]} />
                    <View style={[styles.swatchCircle, { backgroundColor: p.secondaryColor, marginLeft: -6 }]} />
                  </View>
                </View>

                <Text
                  style={[
                    styles.themeNameText,
                    {
                      color: isSelected ? p.primaryColor : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                <Text style={[styles.themeSubtitleText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {p.subtitle}
                </Text>

                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: p.primaryColor }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Base Appearance Mode */}
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 14 }]} />
        <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 10 }]}>Base Appearance</Text>
        <View style={styles.themeRow}>
          {themeModeOptions.map((opt) => {
            const isSelected = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
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

      {/* Section 2: Bible Translations Manager */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BIBLE TRANSLATIONS & DOWNLOADS</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        {/* Active Translation Indicator */}
        <View style={styles.activeTranslationBanner}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeTransPretitle, { color: colors.textSecondary }]}>CURRENTLY ACTIVE</Text>
            <Text style={[styles.activeTransTitle, { color: colors.text }]}>
              {activeMeta.name} ({activeMeta.shortName})
            </Text>
            <Text style={[styles.activeTransDesc, { color: colors.textSecondary }]} numberOfLines={1}>
              {activeMeta.description}
            </Text>
          </View>
          <View style={[styles.activeCheckPill, { backgroundColor: colors.tint }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.activeCheckText}>In Use</Text>
          </View>
        </View>

        {/* 1. Installed / Offline Translations List (Collapsible Dropdown) */}
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 14 }]} />
        <TouchableOpacity
          style={styles.rowBetween}
          onPress={() => setIsInstalledTranslationsExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="library" size={18} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0, fontSize: 13 }]}>
              Installed Translations ({downloadedVersionIds.length})
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: colors.tint, fontWeight: '700', marginRight: 6 }}>100% Offline</Text>
            <Ionicons
              name={isInstalledTranslationsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isInstalledTranslationsExpanded && (
          <View style={[styles.versionSettingsList, { marginTop: 10 }]}>
            {ALL_BIBLE_VERSIONS.filter((v) => BibleDownloadService.isVersionDownloaded(v.id)).map((v) => {
              const isSelected = version.toUpperCase() === v.id.toUpperCase();
              const isPrebundled = v.id === 'KJV' || v.id === 'CEB';

              return (
                <View
                  key={v.id}
                  style={[
                    styles.versionSettingItem,
                    {
                      backgroundColor: isSelected ? colors.tintLight : colors.glassInput,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => handleUpdateVersion(v.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
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
                      <Ionicons name="checkmark-circle" size={22} color={colors.tint} style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons name="radio-button-off" size={20} color={colors.textTertiary} style={{ marginRight: 6 }} />
                    )}
                  </TouchableOpacity>

                  {/* Delete button for user-downloaded translations */}
                  {!isPrebundled && (
                    <TouchableOpacity
                      onPress={() => handleDeleteVersion(v)}
                      style={[styles.deleteVersionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 2. Available Online Translations Catalog */}
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 14 }]} />
        <TouchableOpacity
          style={styles.rowBetween}
          onPress={() => setIsOnlineCatalogExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cloud-download" size={18} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0, fontSize: 12 }]}>
              Download More Translations ({DOWNLOADABLE_BIBLE_VERSIONS.length}+ Available)
            </Text>
          </View>
          <Ionicons
            name={isOnlineCatalogExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isOnlineCatalogExpanded && (
          <View style={{ marginTop: 12 }}>
            {/* Search Input for Translations */}
            <View style={[styles.searchBoxWrapper, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.tint} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchBoxInput, { color: colors.text }]}
                placeholder="Search translations (e.g., ASV, Tagalog, Spanish)..."
                placeholderTextColor={colors.textTertiary}
                value={versionSearchQuery}
                onChangeText={setVersionSearchQuery}
                clearButtonMode="while-editing"
              />
              {versionSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setVersionSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Language Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
              {categoryOptions.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catFilterPill,
                      {
                        backgroundColor: isSelected ? colors.tint : colors.glassInput,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catFilterPillText,
                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Download Progress Card */}
            {downloadingVersionId && (
              <View style={[styles.downloadProgressCard, { backgroundColor: colors.glassHighlight, borderColor: colors.tint }]}>
                <View style={styles.downloadProgressHeader}>
                  <ActivityIndicator size="small" color={colors.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.downloadProgressTitle, { color: colors.tint }]}>
                    {downloadStatusText}
                  </Text>
                  <Text style={[styles.downloadProgressPct, { color: colors.tint }]}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
                <View style={[styles.downloadProgressBarBg, { backgroundColor: colors.glassInput }]}>
                  <View style={[styles.downloadProgressBarFill, { width: `${downloadProgress * 100}%`, backgroundColor: colors.tint }]} />
                </View>
              </View>
            )}

            {/* List of Downloadable Translations */}
            <View style={{ marginTop: 8 }}>
              {filteredDownloadableVersions.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="search-outline" size={32} color={colors.textTertiary} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
                    No matching translations found for "{versionSearchQuery}"
                  </Text>
                </View>
              ) : (
                filteredDownloadableVersions.map((v) => {
                  const isDownloaded = downloadedVersionIds.includes(v.id);
                  const isCurrentlyDownloading = downloadingVersionId === v.id;
                  const isActive = version.toUpperCase() === v.id.toUpperCase();

                  return (
                    <View
                      key={v.id}
                      style={[
                        styles.downloadVersionCard,
                        {
                          backgroundColor: isActive ? colors.tintLight : colors.glassInput,
                          borderColor: isActive ? colors.tint : colors.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text
                            style={[
                              styles.versionSettingTitle,
                              { color: isActive ? colors.tint : colors.text, fontWeight: '700' },
                            ]}
                          >
                            {v.name} ({v.shortName})
                          </Text>
                          <View style={[styles.langBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.langBadgeText, { color: colors.textSecondary }]}>
                              {v.language}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.versionSettingDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {v.description}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>
                          Download Size: {v.fileSizeApprox || '~5 MB'} • 31,102 Verses
                        </Text>
                      </View>

                      {/* Download / Activate Action Button */}
                      {isCurrentlyDownloading ? (
                        <View style={[styles.actionBadge, { backgroundColor: colors.glassHighlight }]}>
                          <ActivityIndicator size="small" color={colors.tint} />
                        </View>
                      ) : isDownloaded ? (
                        <TouchableOpacity
                          style={[styles.useDownloadedBtn, { backgroundColor: isActive ? colors.tint : colors.glassHighlight }]}
                          onPress={() => handleUpdateVersion(v.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isActive ? 'checkmark-circle' : 'checkmark'}
                            size={14}
                            color={isActive ? '#FFFFFF' : colors.tint}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.useDownloadedBtnText, { color: isActive ? '#FFFFFF' : colors.tint }]}>
                            {isActive ? 'In Use' : 'Use'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.downloadBtn, { backgroundColor: colors.tint }]}
                          onPress={() => handleDownloadVersion(v)}
                          disabled={!!downloadingVersionId}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="download-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.downloadBtnText}>Download</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </View>

      {/* Section 3: Reader Typography */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>READER TYPOGRAPHY</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Default Font Size</Text>
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              onPress={() => handleUpdateFontSize(fontSize - 2)}
              style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            >
              <Text style={[styles.stepperText, { color: colors.text }]}>A-</Text>
            </TouchableOpacity>
            <Text style={[styles.fontSizeDisplay, { color: colors.text }]}>{fontSize}pt</Text>
            <TouchableOpacity
              onPress={() => handleUpdateFontSize(fontSize + 2)}
              style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
            >
              <Text style={[styles.stepperText, { color: colors.text, fontWeight: '700' }]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Font Preview */}
        <View style={[styles.previewBox, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.tint }]}>
            PREVIEW • John 3:16 ({activeMeta.shortName})
          </Text>
          <Text style={[styles.previewText, { color: colors.text, fontSize, lineHeight: fontSize * 1.55 }]}>
            {version === 'ADB'
              ? "Sapagka't gayon na lamang ang pagsinta ng Dios sa sanglibutan, na ibinigay niya ang kaniyang bugtong na Anak, upang ang sinomang sa kaniya'y sumampalataya ay huwag mapahamak, kundi magkaroon ng buhay na walang hanggan."
              : version === 'CEB'
              ? 'Kay gihigugma gayud sa Dios ang kalibutan nga tungod niana gihatag niya ang iyang bugtong Anak, aron ang tanan nga mosalig kaniya dili malaglag, kondili may kinabuhing dayon.'
              : version === 'RV1960'
              ? 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'
              : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
          </Text>
        </View>
      </View>

      {/* Section 4: Phone Home Screen Widgets */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PHONE HOME SCREEN WIDGETS</Text>
      </View>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
        onPress={() => router.push('/widgets')}
        activeOpacity={0.7}
      >
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tintLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 2 }]}>Verse Widgets Studio</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Customize & pin Scripture widgets to your phone
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Section 5: Bible Database & Engine Info */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>E-BIBLE ENGINE & DATA</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Available Translations</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{downloadedVersionIds.length} Installed ({ALL_BIBLE_VERSIONS.length}+ Online)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Active Translation</Text>
          <Text style={[styles.infoValue, { color: colors.tint, fontWeight: '700' }]}>
            {activeMeta.name} ({activeMeta.shortName})
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
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Database Storage</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#34C759" style={{ marginRight: 4 }} />
            <Text style={styles.statusBadgeText}>Active & Fully Cached</Text>
          </View>
        </View>
      </View>

      {/* Section 6: Study Stats */}
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

      {/* Section 7: Support & Contact Developer */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT & FEEDBACK</Text>
      </View>

      {/* Contact Support */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
        onPress={handleContactSupport}
        activeOpacity={0.7}
      >
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 132, 255, 0.12)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="chatbubbles" size={22} color="#0084FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 2 }]}>Contact Support</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Chat with developer on Facebook Messenger
              </Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* 🐑 Support Shepherd / GCash Donation Flow */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}
        onPress={() => router.push('/support')}
        activeOpacity={0.7}
      >
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 199, 126, 0.12)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>🐑</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0 }]}>Support Shepherd</Text>
                <View style={[styles.supportBadge, { backgroundColor: '#00C77E' }]}>
                  <Text style={styles.supportBadgeText}>☕ Donate</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                Shepherd is free and made to help you spend more time in God's Word. If you enjoy using Shepherd, you can support its development.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Section 8: About */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 50 }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>SHEPHERD (Bible Study)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Developer</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>Christian Faith Mestola - AsyncDev</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOptionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
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
    width: 38,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 14,
  },
  fontSizeDisplay: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  previewBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
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
  activeTranslationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTransPretitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  activeTransTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeTransDesc: {
    fontSize: 12,
  },
  activeCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  versionSettingsList: {
    marginTop: 4,
  },
  versionSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
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
  deleteVersionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchBoxInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  catFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  catFilterPillText: {
    fontSize: 11,
  },
  downloadProgressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  downloadProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  downloadProgressTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadProgressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  downloadProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  downloadProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  downloadVersionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionBadge: {
    width: 76,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useDownloadedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  useDownloadedBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  themePaletteScroll: {
    marginHorizontal: -4,
    marginTop: 2,
    marginBottom: 4,
  },
  themePaletteScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  themePaletteCard: {
    width: 142,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    marginRight: 10,
    position: 'relative',
  },
  themeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeIcon: {
    fontSize: 20,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatchCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  themeNameText: {
    fontSize: 13,
    marginBottom: 2,
  },
  themeSubtitleText: {
    fontSize: 10,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  supportBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
