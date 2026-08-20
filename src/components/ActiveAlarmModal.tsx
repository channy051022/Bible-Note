import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SoundService } from '../services/soundService';
import { AlarmService } from '../services/alarmService';

interface ActiveAlarmModalProps {
  visible: boolean;
  onDismiss: () => void;
  timeString: string; // e.g. "7:00 AM"
  verseText: string;
  citation: string;
  bookId: number;
  chapter: number;
  ringtoneId?: string;
  customAudioUri?: string;
}

export const ActiveAlarmModal: React.FC<ActiveAlarmModalProps> = ({
  visible,
  onDismiss,
  timeString,
  verseText,
  citation,
  bookId,
  chapter,
  ringtoneId,
  customAudioUri,
}) => {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Play spiritual alarm chime ringtone & animate
  useEffect(() => {
    if (!visible) {
      SoundService.stopAlarmRingtone();
      return;
    }

    // 1. Play chosen ringtone or custom imported music
    SoundService.playAlarmRingtone(ringtoneId, customAudioUri);

    // 2. Trigger haptic vibration pulses
    const hapticInterval = setInterval(() => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } catch (e) {}
    }, 1500);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();

    return () => {
      SoundService.stopAlarmRingtone();
      clearInterval(hapticInterval);
      pulseLoop.stop();
    };
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    SoundService.stopAlarmRingtone();
    AlarmService.dismissActiveAlarm().catch(() => {});
    onDismiss();
  };

  const handleReadVerse = () => {
    handleDismiss();
    router.replace({
      pathname: '/(tabs)/bible',
      params: {
        bookId: bookId.toString(),
        chapter: chapter.toString(),
      },
    });
  };

  const handleSnooze = () => {
    SoundService.stopAlarmRingtone();
    AlarmService.snoozeAlarm(
      {
        id: 'active_snooze',
        label: 'Spiritual Alarm',
        ringtoneId,
        customAudioUri,
        customText: verseText,
        customCitation: citation,
        bookId,
        chapter,
      },
      5
    ).catch(() => {});
    onDismiss();
    Alert.alert('Alarm Snoozed ⏰', 'Alarm will ring again in 5 minutes with God\'s Word.');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Glowing Spiritual Background Aura */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Top Dismiss Button */}
        <TouchableOpacity onPress={handleDismiss} style={styles.topCloseBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Main Alarm Content */}
        <View style={styles.contentWrapper}>
          {/* 1. Bell & Digital Time Header */}
          <View style={styles.timeHeader}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginRight: 10 }}>
              <Ionicons name="notifications" size={36} color="#FFD700" />
            </Animated.View>
            <Text style={styles.timeText}>{timeString || '7:00 AM'}</Text>
          </View>

          {/* 2. Daily Verse Badge */}
          <View style={styles.verseBadge}>
            <Text style={styles.crossIcon}>✝️</Text>
            <Text style={styles.verseBadgeText}>DAILY VERSE</Text>
          </View>

          {/* 3. Scripture Quote Box */}
          <View style={styles.quoteCard}>
            <Text style={styles.verseText}>
              "{verseText || 'The Lord is my shepherd; I shall not want.'}"
            </Text>

            <Text style={styles.citationText}>
              {citation || 'Psalm 23:1'}
            </Text>
          </View>

          {/* 4. Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary: READ VERSE */}
            <TouchableOpacity
              style={styles.readVerseBtn}
              onPress={handleReadVerse}
              activeOpacity={0.8}
            >
              <Text style={styles.readVerseBtnText}>📖   READ VERSE</Text>
            </TouchableOpacity>

            {/* Secondary: Snooze 10 minutes */}
            <TouchableOpacity
              style={styles.snoozeBtn}
              onPress={handleSnooze}
              activeOpacity={0.7}
            >
              <Text style={styles.snoozeBtnText}>Snooze 10 minutes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glowAura: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
    top: '25%',
  },
  topCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 24,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  timeText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
  },
  crossIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  verseBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1.2,
  },
  quoteCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    marginBottom: 36,
    alignItems: 'center',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  citationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60A5FA',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  readVerseBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  readVerseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  snoozeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  snoozeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
