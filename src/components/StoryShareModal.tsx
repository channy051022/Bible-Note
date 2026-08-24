import React, { useState, useRef, useMemo } from 'react';
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
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
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

interface WallpaperPreset {
  id: string;
  name: string;
  url: string;
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

const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'mountains',
    name: 'Sunrise Dawn',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sunset_ocean',
    name: 'Golden Shore',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'starry_sky',
    name: 'Heavens',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'forest_mist',
    name: 'Green Pastures',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sun_rays',
    name: 'Heavenly Rays',
    url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'meadow_flowers',
    name: 'Living Meadow',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
  },
];

interface DraggablePercentageBarProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  value: number; // 0 to 1
  displayValue: string;
  onValueChange: (val: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: () => void;
  fillColor?: string;
}

const DraggablePercentageBar: React.FC<DraggablePercentageBarProps> = ({
  label,
  iconName,
  value,
  displayValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  fillColor,
}) => {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const trackRef = useRef<View>(null);

  const activeFillColor = fillColor || colors.tint;
  const clampedRatio = Math.max(0, Math.min(1, value));

  const updateFromPageX = (pageX: number) => {
    if (!trackRef.current || trackWidth <= 0) return;
    trackRef.current.measure((x, y, width, height, pageXOffset) => {
      const touchOffset = pageX - pageXOffset;
      const newRatio = Math.max(0, Math.min(1, touchOffset / width));
      onValueChange(newRatio);
    });
  };

  const barPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          onSlidingStart?.();
          Haptics.selectionAsync().catch(() => {});
          updateFromPageX(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (evt) => {
          updateFromPageX(evt.nativeEvent.pageX);
        },
        onPanResponderRelease: () => {
          onSlidingComplete?.();
        },
        onPanResponderTerminate: () => {
          onSlidingComplete?.();
        },
      }),
    [trackWidth, onValueChange, onSlidingStart, onSlidingComplete]
  );

  return (
    <View style={styles.sliderBarContainer}>
      <View style={styles.sliderBarHeader}>
        <View style={styles.sliderBarLabelGroup}>
          {iconName && (
            <Ionicons name={iconName} size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.sliderBarTitle, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <View style={[styles.sliderBadge, { backgroundColor: colors.tintLight }]}>
          <Text style={[styles.sliderBadgeText, { color: colors.tint }]}>{displayValue}</Text>
        </View>
      </View>

      {/* Draggable Area Wrapper (Touch hitbox) */}
      <View
        ref={trackRef}
        {...barPanResponder.panHandlers}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={styles.sliderHitbox}
      >
        {/* Slim Draggable Percentage Loading Bar Track */}
        <View style={[styles.sliderTrack, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
          <View
            style={[
              styles.sliderFilledBar,
              {
                width: `${Math.round(clampedRatio * 100)}%`,
                backgroundColor: activeFillColor,
              },
            ]}
          />
        </View>

        {/* Circular Knob Overlapping the Track */}
        <View
          pointerEvents="none"
          style={[
            styles.sliderKnob,
            {
              left: trackWidth > 0 ? Math.max(0, Math.min(trackWidth - 22, clampedRatio * (trackWidth - 22))) : 0,
              backgroundColor: '#FFFFFF',
              borderColor: activeFillColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  visible,
  verseText,
  citation,
  version = 'KJV',
  dateString,
  onClose,
}) => {
  const { colors } = useTheme();

  // Background modes: 'gradient' | 'photo'
  const [bgMode, setBgMode] = useState<'gradient' | 'photo'>('gradient');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('celestial');
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Styling & layout controls
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story'); // 'story' (9:16 portrait) or 'square' (1:1)
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.4); // Dimming over photos (0 to 0.85)
  const [fontFamilyMode, setFontFamilyMode] = useState<'serif' | 'sans'>('serif');

  // Font Size Resizing (Draggable Bar, 14px to 34px)
  const defaultFontSize = verseText.length > 200 ? 17 : verseText.length > 120 ? 19 : 22;
  const [fontSize, setFontSize] = useState<number>(defaultFontSize);

  // Modal scroll lock state (locks outer scroll while dragging)
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  // Interactive Dragging State (1-Finger Repositioning Only)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');

  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // PanResponder to handle smooth 1-finger dragging with full scroll locking
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setScrollEnabled(false); // Lock modal scroll immediately on touch
        },
        onPanResponderMove: (_, gestureState) => {
          // 1-finger drag repositioning anywhere on the canvas
          const nextX = Math.max(-150, Math.min(150, panRef.current.x + gestureState.dx));
          const nextY = Math.max(-200, Math.min(200, panRef.current.y + gestureState.dy));
          setPan({ x: nextX, y: nextY });
        },
        onPanResponderRelease: (_, gestureState) => {
          setScrollEnabled(true); // Unlock modal scroll on release
          panRef.current = {
            x: Math.max(-150, Math.min(150, panRef.current.x + gestureState.dx)),
            y: Math.max(-200, Math.min(200, panRef.current.y + gestureState.dy)),
          };
        },
        onPanResponderTerminate: () => {
          setScrollEnabled(true);
        },
      }),
    []
  );

  const handleResetPosition = () => {
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    setFontSize(defaultFontSize);
    Haptics.selectionAsync().catch(() => {});
  };

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cardRef = useRef<View>(null);

  const currentTheme = STORY_THEMES.find((t) => t.id === selectedThemeId) || STORY_THEMES[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formattedShareText = `"${verseText}"\n— ${citation} (${version})\n\nShared via SHEPHERD Bible App ✨ #VerseOfTheDay #BibleVerse #Faith`;

  // Pick image from user gallery (No cropping, full portrait preserved)
  const handlePickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow photo library access to choose a background image for your verse wallpaper.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // No forced crop, keeps full photo
        quality: 0.95,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCustomImageUri(result.assets[0].uri);
        setSelectedPresetId(null);
        setBgMode('photo');
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error('Gallery pick error:', e);
      Alert.alert('Notice', 'Could not open gallery.');
    }
  };

  // Take photo with camera (No forced crop)
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Please allow camera access to take a photo for your verse card.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // No crop
        quality: 0.95,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCustomImageUri(result.assets[0].uri);
        setSelectedPresetId(null);
        setBgMode('photo');
        await Haptics.selectionAsync();
      }
    } catch (e) {
      console.error('Camera capture error:', e);
      Alert.alert('Notice', 'Could not open camera.');
    }
  };

  const handleSelectPreset = (preset: WallpaperPreset) => {
    setSelectedPresetId(preset.id);
    setCustomImageUri(preset.url);
    setBgMode('photo');
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSelectGradientTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    setBgMode('gradient');
    setCustomImageUri(null);
    setSelectedPresetId(null);
    Haptics.selectionAsync().catch(() => {});
  };

  // Save Verse Card Image Directly to Device Gallery
  const handleSaveToGallery = async () => {
    try {
      setIsExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!cardRef.current) {
        Alert.alert('Notice', 'Could not capture snapshot.');
        return;
      }

      const imageUri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!imageUri) {
        Alert.alert('Notice', 'Failed to generate image file.');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(imageUri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Saved to Gallery! 🖼️ Your verse image is in your Photos.');
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            dialogTitle: 'Save / Share Verse Image',
          });
        } else {
          Alert.alert('Saved', 'Verse image created successfully!');
        }
      }
    } catch (err) {
      console.error('Error saving image to gallery:', err);
      try {
        if (cardRef.current) {
          const imageUri = await captureRef(cardRef.current, { format: 'png', quality: 1, result: 'tmpfile' });
          if (imageUri && (await Sharing.isAvailableAsync())) {
            await Sharing.shareAsync(imageUri);
          }
        }
      } catch {
        Alert.alert('Notice', 'Could not export image directly on this platform.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Share to Facebook Story / Messenger My Day / System Sheet
  const handleShareToFacebookStory = async () => {
    try {
      setIsExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let imageUri: string | null = null;
      if (cardRef.current) {
        imageUri = await captureRef(cardRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
      }

      if (imageUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Scripture to Facebook Story / My Day',
          UTI: 'public.png',
        });
      } else {
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
      console.error('Error sharing story:', err);
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

  const handleCopyVerse = async () => {
    try {
      await Clipboard.setStringAsync(formattedShareText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Verse copied to clipboard!');
    } catch (e) {
      console.warn('Copy notice:', e);
    }
  };

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

  const activeTextColor = bgMode === 'photo' ? '#FFFFFF' : currentTheme.textColor;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.fbStoryBadge, { backgroundColor: colors.tint }]}>
                <Ionicons name="image" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Verse Wallpaper & Image Studio
                </Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                  Drag verse to move • Adjust text size & contrast
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

          <ScrollView
            scrollEnabled={scrollEnabled}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Story Card Canvas Preview (Portrait Size by Default) */}
            <View style={styles.previewContainer}>
              <View
                ref={cardRef}
                collapsable={false}
                style={[
                  styles.storyCard,
                  aspectRatio === 'story' ? styles.storyCardTall : styles.storyCardSquare,
                  {
                    backgroundColor: bgMode === 'gradient' ? currentTheme.bgGradient[1] : '#000000',
                    borderColor: currentTheme.border,
                  },
                ]}
              >
                {/* Photo Background (If in photo mode) */}
                {bgMode === 'photo' && customImageUri ? (
                  <>
                    <ExpoImage
                      source={{ uri: customImageUri }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                      transition={200}
                    />
                    {/* Dimming / Contrast Overlay */}
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          backgroundColor: '#000000',
                          opacity: overlayOpacity,
                        },
                      ]}
                    />
                  </>
                ) : (
                  /* Background decorative aura circles for gradient themes */
                  <>
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
                  </>
                )}

                {/* Interactive Touch Draggable Verse Text Box (1-Finger Dragging) */}
                <View
                  {...panResponder.panHandlers}
                  style={[
                    styles.draggableVerseContainer,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.storyVerseText,
                      {
                        color: activeTextColor,
                        fontFamily: fontFamilyMode === 'serif' ? 'serif' : 'System',
                        fontSize: fontSize,
                        lineHeight: Math.round(fontSize * 1.5),
                        textAlign: textAlign,
                        textShadowColor: 'rgba(0, 0, 0, 0.85)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 5,
                      },
                    ]}
                  >
                    {verseText}
                  </Text>

                  {/* Citation */}
                  <View
                    style={[
                      styles.citationRow,
                      textAlign === 'left' && { justifyContent: 'flex-start' },
                      textAlign === 'center' && { justifyContent: 'center' },
                      textAlign === 'right' && { justifyContent: 'flex-end' },
                      textAlign === 'justify' && { justifyContent: 'flex-end' },
                    ]}
                  >
                    {textAlign !== 'right' && (
                      <View style={[styles.citationLine, { backgroundColor: currentTheme.accentColor }]} />
                    )}
                    <Text
                      style={[
                        styles.citationText,
                        {
                          color: currentTheme.accentColor,
                          fontSize: Math.max(9, Math.min(14, fontSize > 14 ? fontSize - 6 : 11)),
                          textShadowColor: 'rgba(0, 0, 0, 0.85)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 4,
                        },
                      ]}
                    >
                      {citation}
                    </Text>
                    {textAlign === 'right' && (
                      <View style={[styles.citationLine, { backgroundColor: currentTheme.accentColor, marginLeft: 8, marginRight: 0 }]} />
                    )}
                  </View>
                </View>

                {/* Card Footer: App Branding Only (SHEPHERD) & Optional Date */}
                <View style={[styles.cardFooter, { borderTopColor: 'rgba(255,255,255,0.18)' }]}>
                  <View style={styles.appBrandRow}>
                    <Ionicons name="book" size={12} color="rgba(255,255,255,0.85)" style={{ marginRight: 5 }} />
                    <Text style={[styles.appBrandText, { color: 'rgba(255,255,255,0.85)' }]}>
                      SHEPHERD
                    </Text>
                  </View>
                  {dateString ? (
                    <Text style={[styles.cardDateText, { color: 'rgba(255,255,255,0.85)' }]}>
                      {dateString}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Touch Gesture Helper Badge */}
              <View style={[styles.gestureHelpBadge, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <Ionicons name="finger-print" size={13} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.gestureHelpText, { color: colors.textSecondary }]}>
                  Drag verse box to reposition anywhere
                </Text>
              </View>
            </View>

            {/* Controls Section */}
            <View style={styles.controlsSection}>
              {/* 1. Photo Contrast / Dimming Draggable Percentage Loading Bar */}
              {bgMode === 'photo' && (
                <DraggablePercentageBar
                  label="PHOTO CONTRAST / DIMMING"
                  iconName="contrast"
                  value={overlayOpacity / 0.85}
                  displayValue={`${Math.round((overlayOpacity / 0.85) * 100)}%`}
                  onValueChange={(ratio) => setOverlayOpacity(Number((ratio * 0.85).toFixed(2)))}
                  onSlidingStart={() => setScrollEnabled(false)}
                  onSlidingComplete={() => setScrollEnabled(true)}
                  fillColor={colors.tint}
                />
              )}

              {/* 2. Verse Font Size Draggable Percentage Loading Bar (Scale down to 1) */}
              <DraggablePercentageBar
                label="VERSE TEXT SIZE"
                iconName="text"
                value={(fontSize - 1) / (36 - 1)}
                displayValue={`${fontSize}px`}
                onValueChange={(ratio) => setFontSize(Math.max(1, Math.round(1 + ratio * 35)))}
                onSlidingStart={() => setScrollEnabled(false)}
                onSlidingComplete={() => setScrollEnabled(true)}
                fillColor={colors.gold}
              />

              {/* 3. Combined 1-Line Toolbar: Format (9:16 & 1:1) and Alignment (Icons Only) */}
              <View style={styles.quickToolsInlineRow}>
                {/* Format 9:16 vs 1:1 */}
                <View style={styles.formatInlineGroup}>
                  <TouchableOpacity
                    style={[
                      styles.formatInlineBtn,
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
                      size={14}
                      color={aspectRatio === 'story' ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.formatInlineBtnText,
                        {
                          color: aspectRatio === 'story' ? colors.tint : colors.text,
                          fontWeight: aspectRatio === 'story' ? '800' : '600',
                        },
                      ]}
                    >
                      9:16
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.formatInlineBtn,
                      {
                        backgroundColor: aspectRatio === 'square' ? colors.tintLight : colors.glassInput,
                        borderColor: aspectRatio === 'square' ? colors.tint : colors.border,
                        marginLeft: 6,
                      },
                    ]}
                    onPress={() => setAspectRatio('square')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="square-outline"
                      size={14}
                      color={aspectRatio === 'square' ? colors.tint : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.formatInlineBtnText,
                        {
                          color: aspectRatio === 'square' ? colors.tint : colors.text,
                          fontWeight: aspectRatio === 'square' ? '800' : '600',
                        },
                      ]}
                    >
                      1:1
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Alignment (Icon Only matching reference) + Reset */}
                <View style={styles.alignInlineGroup}>
                  {[
                    { key: 'left', icon: 'format-align-left' },
                    { key: 'center', icon: 'format-align-center' },
                    { key: 'right', icon: 'format-align-right' },
                    { key: 'justify', icon: 'format-align-justify' },
                  ].map((item) => {
                    const isSelected = textAlign === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.alignIconBtn,
                          {
                            backgroundColor: isSelected ? colors.tint : colors.glassInput,
                            borderColor: isSelected ? colors.tint : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setTextAlign(item.key as any);
                          Haptics.selectionAsync().catch(() => {});
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={18}
                          color={isSelected ? '#FFFFFF' : colors.text}
                        />
                      </TouchableOpacity>
                    );
                  })}

                  {(pan.x !== 0 || pan.y !== 0 || fontSize !== defaultFontSize) && (
                    <TouchableOpacity
                      style={[styles.resetIconBtn, { backgroundColor: colors.tintLight }]}
                      onPress={handleResetPosition}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="refresh" size={14} color={colors.tint} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Upload Photo & Take Picture Buttons */}
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  style={[styles.imageActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handlePickImageFromGallery}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={17} color={colors.tint} style={{ marginRight: 6 }} />
                  <Text style={[styles.imageActionBtnText, { color: colors.text }]}>Upload Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imageActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border, marginLeft: 8 }]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={17} color={colors.tint} style={{ marginRight: 6 }} />
                  <Text style={[styles.imageActionBtnText, { color: colors.text }]}>Take Picture</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Nature Wallpapers Scroll */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {WALLPAPER_PRESETS.map((preset) => {
                  const isSelected = bgMode === 'photo' && (selectedPresetId === preset.id || customImageUri === preset.url);
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetThumbWrapper,
                        { borderColor: isSelected ? colors.tint : colors.border, borderWidth: isSelected ? 2 : 1 },
                      ]}
                      onPress={() => handleSelectPreset(preset)}
                      activeOpacity={0.8}
                    >
                      <ExpoImage source={{ uri: preset.url }} style={styles.presetThumb} contentFit="cover" />
                      <View style={styles.presetThumbLabel}>
                        <Text style={styles.presetThumbLabelText} numberOfLines={1}>
                          {preset.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Theme Gradients Scroll */}
              <Text style={[styles.controlLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                COLOR GRADIENT THEMES
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
                {STORY_THEMES.map((theme) => {
                  const isSelected = bgMode === 'gradient' && selectedThemeId === theme.id;
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
                      onPress={() => handleSelectGradientTheme(theme.id)}
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

            {/* Toast Notice */}
            {toastMessage && (
              <View style={[styles.toastCard, { backgroundColor: colors.tint }]}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.primarySaveBtn, { backgroundColor: colors.gold }]}
                onPress={handleSaveToGallery}
                disabled={isExporting}
                activeOpacity={0.85}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#000000" style={{ marginRight: 8 }} />
                    <Text style={styles.primarySaveBtnText}>Save to Gallery (Photos)</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryFbShareBtn, { backgroundColor: '#1877F2', marginTop: 10 }]}
                onPress={handleShareToFacebookStory}
                disabled={isExporting}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-facebook" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryFbShareText}>Share to Facebook My Day / Story</Text>
              </TouchableOpacity>

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handleCopyVerse}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>Copy Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={handleSystemShare}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social-outline" size={16} color={colors.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>Share App...</Text>
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
    maxHeight: '94%',
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
    marginBottom: 12,
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
    minHeight: 460,
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
  draggableVerseContainer: {
    zIndex: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  quoteSymbol: {
    fontSize: 44,
    lineHeight: 44,
    fontFamily: 'serif',
    marginTop: 2,
    marginBottom: -16,
  },
  storyVerseText: {
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 12,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citationLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginRight: 8,
  },
  citationText: {
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
    letterSpacing: 0.5,
  },
  cardDateText: {
    fontSize: 9,
  },
  gestureHelpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  gestureHelpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlsSection: {
    marginBottom: 16,
  },
  sliderBarContainer: {
    marginBottom: 14,
  },
  sliderBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderBarLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderBarTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sliderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sliderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sliderHitbox: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFilledBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 4,
  },
  sliderKnob: {
    position: 'absolute',
    top: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  imageActionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  presetThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  presetThumbLabelText: {
    color: '#FFFFFF',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  quickToolsInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formatInlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  formatInlineBtnText: {
    fontSize: 12,
  },
  alignInlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignIconBtn: {
    width: 34,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  resetIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
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
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    marginTop: 6,
  },
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  primarySaveBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryFbShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  primaryFbShareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
