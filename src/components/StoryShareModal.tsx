import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useTheme } from '../hooks/useTheme';
import { BibleVersion } from '../types/bible';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface StoryShareModalProps {
  visible: boolean;
  verseText: string;
  citation: string;
  version?: BibleVersion;
  dateString?: string;
  onClose: () => void;
}

interface StoryTheme {
  id: string;
  name: string;
  bgGradient: string[];
  textColor: string;
  subTextColor: string;
  accentColor: string;
  cardBg: string;
  border: string;
}

const STORY_THEMES: StoryTheme[] = [
  {
    id: 'celestial',
    name: 'Celestial',
    bgGradient: ['#0B0F19', '#1E1B4B', '#312E81'],
    textColor: '#FFFFFF',
    subTextColor: '#94A3B8',
    accentColor: '#818CF8',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
  {
    id: 'gold',
    name: 'Holy Gold',
    bgGradient: ['#2A1604', '#451A03', '#78350F'],
    textColor: '#FFFBEB',
    subTextColor: '#FDE68A',
    accentColor: '#F59E0B',
    cardBg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'purple',
    name: 'Regal Grace',
    bgGradient: ['#1E0A3C', '#2E1065', '#581C87'],
    textColor: '#FAF5FF',
    subTextColor: '#E9D5FF',
    accentColor: '#C084FC',
    cardBg: 'rgba(192, 132, 252, 0.12)',
    border: 'rgba(192, 132, 252, 0.25)',
  },
  {
    id: 'emerald',
    name: 'Living Peace',
    bgGradient: ['#021B14', '#064E3B', '#047857'],
    textColor: '#ECFDF5',
    subTextColor: '#A7F3D0',
    accentColor: '#34D399',
    cardBg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.25)',
  },
  {
    id: 'rose',
    name: 'Everlasting Love',
    bgGradient: ['#280511', '#4C0519', '#881337'],
    textColor: '#FFF1F2',
    subTextColor: '#FECDD3',
    accentColor: '#FB7185',
    cardBg: 'rgba(251, 113, 133, 0.12)',
    border: 'rgba(251, 113, 133, 0.25)',
  },
  {
    id: 'ocean',
    name: 'Living Water',
    bgGradient: ['#041D2D', '#082F49', '#0369A1'],
    textColor: '#F0F9FF',
    subTextColor: '#BAE6FD',
    accentColor: '#38BDF8',
    cardBg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.25)',
  },
  {
    id: 'dark',
    name: 'Obsidian',
    bgGradient: ['#09090B', '#18181B', '#27272A'],
    textColor: '#F4F4F5',
    subTextColor: '#A1A1AA',
    accentColor: '#E4E4E7',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.12)',
  },
  {
    id: 'light',
    name: 'Pure White',
    bgGradient: ['#FFFFFF', '#F8FAFC', '#E2E8F0'],
    textColor: '#0F172A',
    subTextColor: '#475569',
    accentColor: '#2563EB',
    cardBg: 'rgba(0, 0, 0, 0.03)',
    border: 'rgba(0, 0, 0, 0.08)',
  },
];

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  visible,
  verseText,
  citation,
  version = 'KJV',
  dateString,
  onClose,
}) => {
  const { colors } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState<string>('celestial');
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story'); // 'story' (9:16) or 'square' (1:1)
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const cardRef = useRef<View>(null);

  const currentTheme = STORY_THEMES.find((t) => t.id === selectedThemeId) || STORY_THEMES[0];

  const formattedShareText = `"${verseText}"\n— ${citation} (${version})\n\nShared via SHEPHERD Bible Study App ✨ #VerseOfTheDay #Faith #BibleVerse`;

  // 1. Share directly to Facebook Story / Messenger My Day / System Sheet with Card Image
  const handleShareToFacebookStory = async () => {
    try {
      setIsExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let imageUri: string | null = null;
      if (cardRef.current) {
        try {
          imageUri = await captureRef(cardRef.current, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        } catch (captureErr) {
          console.warn('ViewShot capture notice:', captureErr);
        }
      }

      if (imageUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Scripture to Facebook Story / My Day',
          UTI: 'public.png',
        });
      } else {
        // Fallback to Native Share with Text & Deep Links
        const fbStoryUrl = 'facebook-stories://share';
        const supported = await Linking.canOpenURL(fbStoryUrl).catch(() => false);
        if (supported) {
          await Linking.openURL(fbStoryUrl);
        } else {
          await Share.share({
            title: `${citation} (${version})`,
            message: formattedShareText,
          });
        }
      }
    } catch (err) {
      console.error('Error sharing to Facebook Story:', err);
      // Fallback share
      try {
        await Share.share({
          title: `${citation} (${version})`,
          message: formattedShareText,
        });
      } catch {}
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Save Story Card Image to Device
  const handleSaveCardImage = async () => {
    try {
      setIsExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (cardRef.current) {
        const imageUri = await captureRef(cardRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        if (imageUri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            dialogTitle: 'Save / Export Story Card Image',
          });
        } else {
          Alert.alert('Saved', 'Verse Story Card snapshot captured successfully!');
        }
      }
    } catch (e) {
      console.error('Error saving image:', e);
      Alert.alert('Notice', 'Could not export image directly on this platform.');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Copy Verse for Facebook Status / Story Caption
  const handleCopyVerse = async () => {
    try {
      await Clipboard.setStringAsync(formattedShareText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (e) {
      console.warn('Copy notice:', e);
    }
  };

  // 4. Standard System Share Dialog
  const handleSystemShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: `${citation} (${version})`,
        message: formattedShareText,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.fbStoryBadge, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Facebook Story & My Day Studio
                </Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                  Customize and share Scripture card to your Story
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.glassInput }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Story Card Canvas Preview */}
            <View style={styles.previewContainer}>
              <View
                ref={cardRef}
                collapsable={false}
                style={[
                  styles.storyCard,
                  aspectRatio === 'story' ? styles.storyCardTall : styles.storyCardSquare,
                  {
                    backgroundColor: currentTheme.bgGradient[1],
                    borderColor: currentTheme.border,
                  },
                ]}
              >
                {/* Background decorative aura circles */}
                <View
                  style={[
                    styles.auraTop,
                    {
                      backgroundColor: currentTheme.accentColor,
                      opacity: currentTheme.id === 'light' ? 0.08 : 0.2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.auraBottom,
                    {
                      backgroundColor: currentTheme.accentColor,
                      opacity: currentTheme.id === 'light' ? 0.06 : 0.15,
                    },
                  ]}
                />

                {/* Card Top Pill: Scripture of the Day & Translation */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardTagPill, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <Ionicons name="sparkles" size={11} color={currentTheme.accentColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.cardTagText, { color: currentTheme.accentColor }]}>
                      DAILY SCRIPTURE
                    </Text>
                  </View>

                  <View style={[styles.versionPill, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
                    <Text style={[styles.versionPillText, { color: currentTheme.textColor }]}>
                      {version}
                    </Text>
                  </View>
                </View>

                {/* Card Quote Icon */}
                <Text style={[styles.quoteSymbol, { color: currentTheme.accentColor, opacity: 0.35 }]}>
                  “
                </Text>

                {/* Verse Text Main Content */}
                <View style={styles.verseTextWrapper}>
                  <Text
                    style={[
                      styles.storyVerseText,
                      {
                        color: currentTheme.textColor,
                        fontSize: verseText.length > 200 ? 17 : verseText.length > 120 ? 19 : 22,
                        lineHeight: verseText.length > 200 ? 26 : verseText.length > 120 ? 29 : 33,
                      },
                    ]}
                  >
                    "{verseText}"
                  </Text>

                  {/* Citation */}
                  <View style={styles.citationRow}>
                    <View style={[styles.citationLine, { backgroundColor: currentTheme.accentColor }]} />
                    <Text style={[styles.citationText, { color: currentTheme.accentColor }]}>
                      {citation}
                    </Text>
                  </View>
                </View>

                {/* Card Footer: Date & App Branding */}
                <View style={[styles.cardFooter, { borderTopColor: currentTheme.border }]}>
                  <View style={styles.appBrandRow}>
                    <Ionicons name="book" size={12} color={currentTheme.subTextColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.appBrandText, { color: currentTheme.subTextColor }]}>
                      SHEPHERD • Daily Verse
                    </Text>
                  </View>
                  {dateString ? (
                    <Text style={[styles.cardDateText, { color: currentTheme.subTextColor }]}>
                      {dateString}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Format Selector: 9:16 Story vs 1:1 Square */}
            <View style={styles.controlsSection}>
              <View style={styles.formatRow}>
                <TouchableOpacity
                  style={[
                    styles.formatBtn,
                    {
                      backgroundColor: aspectRatio === 'story' ? colors.tintLight : colors.glassInput,
                      borderColor: aspectRatio === 'story' ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setAspectRatio('story')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color={aspectRatio === 'story' ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.formatBtnText,
                      { color: aspectRatio === 'story' ? colors.tint : colors.text, fontWeight: '700' },
                    ]}
                  >
                    9:16 Story (FB My Day)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatBtn,
                    {
                      backgroundColor: aspectRatio === 'square' ? colors.tintLight : colors.glassInput,
                      borderColor: aspectRatio === 'square' ? colors.tint : colors.border,
                      marginLeft: 8,
                    },
                  ]}
                  onPress={() => setAspectRatio('square')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="square-outline"
                    size={16}
                    color={aspectRatio === 'square' ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.formatBtnText,
                      { color: aspectRatio === 'square' ? colors.tint : colors.text, fontWeight: '700' },
                    ]}
                  >
                    1:1 Square Post
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Theme Gradients Scroll */}
              <Text style={[styles.controlLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                COLOR PALETTES
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
                {STORY_THEMES.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.themeChip,
                        {
                          backgroundColor: theme.bgGradient[1],
                          borderColor: isSelected ? colors.tint : 'transparent',
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedThemeId(theme.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.themeChipDot, { backgroundColor: theme.accentColor }]} />
                      <Text
                        style={[
                          styles.themeChipText,
                          {
                            color: theme.id === 'light' ? '#0F172A' : '#FFFFFF',
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {theme.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color={theme.id === 'light' ? colors.tint : '#FFFFFF'}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Success Toast */}
            {copiedToast && (
              <View style={[styles.toastCard, { backgroundColor: colors.tint }]}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.toastText}>Verse copied to clipboard for Facebook!</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {/* Primary: Share to Facebook Story / My Day */}
              <TouchableOpacity
                style={[styles.primaryFbShareBtn, { backgroundColor: '#1877F2' }]}
                onPress={handleShareToFacebookStory}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-facebook" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryFbShareText}>Share to Facebook My Day / Story</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Secondary Actions Row */}
              <View style={styles.secondaryActionsRow}>
                {/* Save Image */}
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handleSaveCardImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={16} color={colors.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>Save Card</Text>
                </TouchableOpacity>

                {/* Copy Text */}
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handleCopyVerse}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>Copy Text</Text>
                </TouchableOpacity>

                {/* More Options */}
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handleSystemShare}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social-outline" size={16} color={colors.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  fbStoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  storyCard: {
    width: Math.min(SCREEN_WIDTH - 56, 340),
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-between',
  },
  storyCardTall: {
    minHeight: 400,
  },
  storyCardSquare: {
    minHeight: 320,
  },
  auraTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  auraBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    marginBottom: 12,
  },
  cardTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  versionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  quoteSymbol: {
    fontSize: 48,
    lineHeight: 48,
    fontFamily: 'serif',
    marginTop: 4,
    marginBottom: -16,
    zIndex: 2,
  },
  verseTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
    marginVertical: 12,
  },
  storyVerseText: {
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 14,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  citationLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginRight: 8,
  },
  citationText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBrandText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDateText: {
    fontSize: 9,
  },
  controlsSection: {
    marginBottom: 16,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  formatBtnText: {
    fontSize: 12,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  themeScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  themeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  themeChipText: {
    fontSize: 12,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    marginTop: 4,
  },
  primaryFbShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  primaryFbShareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
