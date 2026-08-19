import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import {
  GameAudioService,
  GameAudioSettings,
  BgmTrackTheme,
} from '../../src/services/gameAudioService';
import { setItem } from '../../src/utils/storage';

export default function GameSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [audioSettings, setAudioSettings] = useState<GameAudioSettings>(GameAudioService.getSettings());
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      // Stop preview when leaving settings
      GameAudioService.stopBGM();
    };
  }, []);

  const handleToggleBgm = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = GameAudioService.updateSettings({ bgmEnabled: val });
    setAudioSettings(updated);
    if (val) {
      GameAudioService.playBGM(updated.bgmTrackTheme);
      setIsPlayingPreview(true);
    } else {
      GameAudioService.stopBGM();
      setIsPlayingPreview(false);
    }
  };

  const handleToggleSfx = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = GameAudioService.updateSettings({ sfxEnabled: val });
    setAudioSettings(updated);
    if (val) {
      GameAudioService.playSuccessSound();
    }
  };

  const handleToggleHaptics = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = GameAudioService.updateSettings({ hapticsEnabled: val });
    setAudioSettings(updated);
  };

  const handleChangeVolume = (type: 'bgm' | 'sfx', delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const current = type === 'bgm' ? audioSettings.bgmVolume : audioSettings.sfxVolume;
    const next = Math.max(0.1, Math.min(1.0, Math.round((current + delta) * 10) / 10));

    if (type === 'bgm') {
      const updated = GameAudioService.updateSettings({ bgmVolume: next });
      setAudioSettings(updated);
    } else {
      const updated = GameAudioService.updateSettings({ sfxVolume: next });
      setAudioSettings(updated);
      GameAudioService.playTapSound();
    }
  };

  const handleSelectTrackTheme = (theme: BgmTrackTheme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = GameAudioService.updateSettings({ bgmTrackTheme: theme });
    setAudioSettings(updated);
    if (updated.bgmEnabled) {
      GameAudioService.playBGM(theme);
      setIsPlayingPreview(true);
    }
  };

  const handleTestSFX = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await GameAudioService.playTapSound();
    setTimeout(() => {
      GameAudioService.playSuccessSound();
    }, 300);
  };

  const handleResetGameStats = () => {
    Alert.alert(
      'Reset Game Progress?',
      'This will reset your game levels, high scores, and statistics. Your total Wool Stars and streak will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Records',
          style: 'destructive',
          onPress: () => {
            ['scramble', 'books_sort', 'crossword', 'trivia'].forEach((id) => {
              setItem(`gamification_stats_${id}`, {
                gameId: id,
                level: 1,
                highScore: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                totalStarsEarned: 0,
                bestStreak: 0,
                currentStreak: 0,
              });
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert('Reset Complete', 'All game records have been reset to Level 1.');
          },
        },
      ]
    );
  };

  const trackOptions: { key: BgmTrackTheme; label: string; icon: string; desc: string }[] = [
    { key: 'auto', label: 'Auto (Per-Game Cute Theme)', icon: '🔀', desc: 'Dynamically matches each game mode' },
    { key: 'galaxy', label: 'Mario Galaxy Style Adventure', icon: '⭐', desc: 'Upbeat starry orchestral adventure' },
    { key: 'sunny', label: 'Cute Sunny Bounce', icon: '☀️', desc: 'Playful marimba & flute bounce for kids' },
    { key: 'puzzle', label: 'Puzzle Bubble Joy', icon: '🧩', desc: 'Cheerful puzzle chimes & acoustic beat' },
    { key: 'party', label: 'Arcade Party Beat', icon: '🥳', desc: 'Joyful brass & game show energy' },
    { key: 'peaceful', label: 'Peaceful Piano Chords', icon: '🎹', desc: 'Calm gentle reflective acoustic' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.glassBackground }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Game Hub</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Arcade Audio & Settings</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Background Music (BGM) */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>BACKGROUND MUSIC (BGM)</Text>

        <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          {/* BGM Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="musical-notes" size={20} color={colors.tint} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Enable Background Music</Text>
                <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                  Play enjoyable relaxing melody during games
                </Text>
              </View>
            </View>
            <Switch
              value={audioSettings.bgmEnabled}
              onValueChange={handleToggleBgm}
              trackColor={{ false: colors.glassInput, true: colors.tint }}
              thumbColor={Platform.OS === 'android' ? (audioSettings.bgmEnabled ? '#FFFFFF' : '#9CA3AF') : undefined}
            />
          </View>

          {/* BGM Volume Stepper */}
          {audioSettings.bgmEnabled && (
            <View style={[styles.stepperRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.stepperLabel, { color: colors.text }]}>Music Volume</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => handleChangeVolume('bgm', -0.1)}
                  disabled={audioSettings.bgmVolume <= 0.1}
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepperValueText, { color: colors.tint }]}>
                  {Math.round(audioSettings.bgmVolume * 100)}%
                </Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => handleChangeVolume('bgm', 0.1)}
                  disabled={audioSettings.bgmVolume >= 1.0}
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Section 2: Music Track Themes */}
        {audioSettings.bgmEnabled && (
          <>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 16 }]}>
              MUSIC TRACK THEME
            </Text>

            <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
              {trackOptions.map((opt, idx) => {
                const isSelected = audioSettings.bgmTrackTheme === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.trackOptionRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                      isSelected && { backgroundColor: colors.tintLight },
                    ]}
                    onPress={() => handleSelectTrackTheme(opt.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{opt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.trackOptionTitle,
                          { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '800' : '600' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.trackOptionSub, { color: colors.textSecondary }]}>{opt.desc}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.tint} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Section 3: Sound Effects (SFX) & Haptics */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 16 }]}>
          SOUND EFFECTS & HAPTICS
        </Text>

        <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          {/* SFX Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="volume-high" size={20} color="#34C759" style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Sound Effects (SFX)</Text>
                <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                  Chimes and ticks on taps, word finds, and victories
                </Text>
              </View>
            </View>
            <Switch
              value={audioSettings.sfxEnabled}
              onValueChange={handleToggleSfx}
              trackColor={{ false: colors.glassInput, true: '#34C759' }}
              thumbColor={Platform.OS === 'android' ? (audioSettings.sfxEnabled ? '#FFFFFF' : '#9CA3AF') : undefined}
            />
          </View>

          {/* SFX Volume Stepper */}
          {audioSettings.sfxEnabled && (
            <View style={[styles.stepperRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.stepperLabel, { color: colors.text }]}>SFX Volume</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => handleChangeVolume('sfx', -0.1)}
                  disabled={audioSettings.sfxVolume <= 0.1}
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepperValueText, { color: '#34C759' }]}>
                  {Math.round(audioSettings.sfxVolume * 100)}%
                </Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
                  onPress={() => handleChangeVolume('sfx', 0.1)}
                  disabled={audioSettings.sfxVolume >= 1.0}
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Haptics Switch */}
          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="phone-portrait-outline" size={20} color="#FF9500" style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Haptic Vibration Feedback</Text>
                <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                  Tactile feedback when connecting letters and winning
                </Text>
              </View>
            </View>
            <Switch
              value={audioSettings.hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: colors.glassInput, true: '#FF9500' }}
              thumbColor={Platform.OS === 'android' ? (audioSettings.hapticsEnabled ? '#FFFFFF' : '#9CA3AF') : undefined}
            />
          </View>

          {/* Test Sound Button */}
          <TouchableOpacity
            style={[styles.testAudioBtn, { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={handleTestSFX}
            activeOpacity={0.7}
          >
            <Ionicons name="play-circle" size={18} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.testAudioBtnText, { color: colors.tint }]}>Test Sound Effects & Chimes</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Data & Reset */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 16 }]}>
          GAME PROGRESS DATA
        </Text>

        <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.resetRow}
            onPress={handleResetGameStats}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resetTitle, { color: '#FF3B30' }]}>Reset Game Career Records</Text>
              <Text style={[styles.resetSub, { color: colors.textSecondary }]}>
                Resets per-game levels and high scores back to Level 1
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  trackOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  trackOptionTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  trackOptionSub: {
    fontSize: 11,
  },
  testAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  testAudioBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  resetTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resetSub: {
    fontSize: 11,
  },
});
