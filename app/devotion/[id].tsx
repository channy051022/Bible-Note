import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { DevotionsRepo } from '../../src/db/devotionsRepo';
import { Devotion, DevotionUserEntry } from '../../src/types/devotion';
import { DevotionMascot } from '../../src/components/DevotionMascot';
import { StoryShareModal } from '../../src/components/StoryShareModal';

export default function DevotionReadingScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const devotionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [userEntry, setUserEntry] = useState<DevotionUserEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states for reflections & thoughts
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [userReflection, setUserReflection] = useState<string>('');
  const [userPrayer, setUserPrayer] = useState<string>('');
  const [showCustomPrayerInput, setShowCustomPrayerInput] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<boolean>(false);

  // Completion modal state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completionModalVisible, setCompletionModalVisible] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

  const loadDevotion = useCallback(async () => {
    if (!devotionId) return;
    try {
      setIsLoading(true);
      const dev = await DevotionsRepo.getDevotionById(db, devotionId);
      if (dev) {
        setDevotion(dev);
        const entry = await DevotionsRepo.getUserEntry(db, devotionId);
        if (entry) {
          setUserEntry(entry);
          setUserAnswer(entry.userAnswer || '');
          setUserReflection(entry.userReflection || '');
          setUserPrayer(entry.userPrayer || '');
          if (entry.userPrayer) setShowCustomPrayerInput(true);
          setIsCompleted(entry.isCompleted);
          setIsFavorite(entry.isFavorite);
        }
      } else {
        Alert.alert('Devotion Not Found', 'This devotional reading could not be loaded.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      console.error('Failed to load devotion details:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db, devotionId, router]);

  useEffect(() => {
    loadDevotion();
  }, [loadDevotion]);

  // Action: Save Personal Reflection & Notes
  const handleSaveReflection = async () => {
    if (!devotionId) return;
    try {
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await DevotionsRepo.saveUserReflection(db, devotionId, {
        userAnswer: userAnswer.trim(),
        userReflection: userReflection.trim(),
        userPrayer: userPrayer.trim(),
      });
      setSavedSuccessNotice(true);
      setTimeout(() => setSavedSuccessNotice(false), 2500);
    } catch (e) {
      console.error('Failed to save reflection:', e);
      Alert.alert('Error', 'Failed to save reflection note.');
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!devotionId) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextFav = await DevotionsRepo.toggleFavorite(db, devotionId);
      setIsFavorite(nextFav);
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  // Action: Complete Devotion
  const handleCompleteDevotion = async () => {
    if (!devotionId) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const nextState = !isCompleted;
      await DevotionsRepo.setDevotionCompleted(db, devotionId, nextState);
      setIsCompleted(nextState);

      // Auto-save reflections on completion
      await DevotionsRepo.saveUserReflection(db, devotionId, {
        userAnswer: userAnswer.trim(),
        userReflection: userReflection.trim(),
        userPrayer: userPrayer.trim(),
      });

      if (nextState) {
        setCompletionModalVisible(true);
      }
    } catch (e) {
      console.error('Failed to complete devotion:', e);
    }
  };

  // Action: Open in E-Bible Reader
  const handleReadChapterInBible = () => {
    if (!devotion || !devotion.bookId) return;
    router.push({
      pathname: '/(tabs)/bible',
      params: {
        bookId: devotion.bookId.toString(),
        chapter: (devotion.chapter || 1).toString(),
        verse: (devotion.verse || 1).toString(),
      },
    });
  };

  // Action: Share Devotion
  const handleShareDevotion = async () => {
    if (!devotion) return;
    try {
      await Share.share({
        message: `✨ ${devotion.title}\n📖 ${devotion.scriptureCitation}\n\n"${devotion.scriptureText}"\n\n${devotion.reflectionContent}\n\n🙏 Prayer:\n${devotion.prayer}\n\nShared via Shepherd Devotions`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  // Action: Delete custom devotion if user created
  const handleDeleteDevotion = () => {
    if (!devotion || !devotion.isUserCreated || !devotionId) return;
    Alert.alert('Delete Devotion', 'Are you sure you want to delete this custom devotion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await DevotionsRepo.deleteUserDevotion(db, devotionId);
            router.back();
          } catch (e) {
            console.error('Failed to delete devotion:', e);
          }
        },
      },
    ]);
  };

  if (isLoading || !devotion) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Preparing quiet devotional sanctuary...
        </Text>
      </View>
    );
  }

  // Split reflection into clean readable paragraphs
  const paragraphs = devotion.reflectionContent.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: devotion.category,
            headerShown: true,
            headerRight: () => (
              <View style={styles.headerIconsRow}>
                <TouchableOpacity
                  onPress={handleToggleFavorite}
                  style={styles.headerIconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFavorite ? '#E11D48' : colors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareDevotion}
                  style={styles.headerIconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.text} />
                </TouchableOpacity>

                {devotion.isUserCreated && (
                  <TouchableOpacity
                    onPress={handleDeleteDevotion}
                    style={styles.headerIconButton}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Quiet Sanctuary Banner with Shep */}
          <View style={styles.quietSanctuaryHeader}>
            <DevotionMascot mood="reading" size={60} />
            <Text style={[styles.categoryBadge, { color: colors.tint }]}>
              {devotion.category.toUpperCase()} • {devotion.estimatedReadingMinutes} MIN QUIET TIME
            </Text>
            <Text style={[styles.devotionTitle, { color: colors.text }]}>{devotion.title}</Text>
          </View>

          {/* 1. Scripture Card */}
          <View style={[styles.scriptureCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.scriptureCardHeader}>
              <View style={styles.scriptureTitleGroup}>
                <Ionicons name="book" size={16} color={colors.gold} style={{ marginRight: 6 }} />
                <Text style={[styles.scriptureCitationText, { color: colors.gold }]}>
                  {devotion.scriptureCitation}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.wallpaperBtn, { backgroundColor: colors.tintLight, marginRight: 6 }]}
                  onPress={() => setShowStoryModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={13} color={colors.tint} style={{ marginRight: 4 }} />
                  <Text style={[styles.wallpaperBtnText, { color: colors.tint }]}>Wallpaper</Text>
                </TouchableOpacity>

                {devotion.bookId && (
                  <TouchableOpacity
                    style={[styles.readBibleLinkBtn, { backgroundColor: colors.tintLight }]}
                    onPress={handleReadChapterInBible}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.readBibleLinkText, { color: colors.tint }]}>Read Chapter ➔</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={[styles.scriptureQuoteText, { color: colors.text }]}>
              "{devotion.scriptureText}"
            </Text>
          </View>

          {/* 2. Main Devotional Reflection */}
          <View style={styles.reflectionSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="sparkles-outline" size={16} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Meditation & Reflection</Text>
            </View>

            {paragraphs.map((para, index) => (
              <Text key={index} style={[styles.paragraphText, { color: colors.text }]}>
                {para}
              </Text>
            ))}
          </View>

          {/* 3. Think About It (Application Question) */}
          <View style={[styles.thinkCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.thinkHeader}>
              <View style={[styles.thinkIconCircle, { backgroundColor: `${colors.tint}1A` }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.tint} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.thinkPretitle, { color: colors.tint }]}>THINK ABOUT IT</Text>
                <Text style={[styles.thinkQuestion, { color: colors.text }]}>
                  {devotion.reflectionQuestion}
                </Text>
              </View>
            </View>

            {/* Answer Input */}
            <TextInput
              style={[
                styles.answerInput,
                {
                  backgroundColor: colors.glassInput,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Write your thoughts or answer here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={userAnswer}
              onChangeText={setUserAnswer}
            />
          </View>

          {/* 4. Today's Prayer */}
          <View style={[styles.prayerCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.prayerHeader}>
              <View style={[styles.prayerIconCircle, { backgroundColor: `${colors.gold}1A` }]}>
                <Ionicons name="hand-left-outline" size={18} color={colors.gold} />
              </View>
              <Text style={[styles.prayerTitle, { color: colors.gold }]}>TODAY'S PRAYER</Text>
            </View>

            <Text style={[styles.prayerContentText, { color: colors.text }]}>
              "{devotion.prayer}"
            </Text>

            {/* Collapsible/Toggleable user personal prayer */}
            {!showCustomPrayerInput ? (
              <TouchableOpacity
                style={styles.addPrayerToggleBtn}
                onPress={() => setShowCustomPrayerInput(true)}
              >
                <Ionicons name="add-circle-outline" size={15} color={colors.tint} style={{ marginRight: 5 }} />
                <Text style={[styles.addPrayerToggleText, { color: colors.tint }]}>
                  {userPrayer ? 'Edit Your Personal Prayer' : '+ Write Your Own Personal Prayer'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customPrayerBlock}>
                <Text style={[styles.customPrayerLabel, { color: colors.textSecondary }]}>
                  My Personal Prayer:
                </Text>
                <TextInput
                  style={[
                    styles.customPrayerInput,
                    {
                      backgroundColor: colors.glassInput,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Pour out your heart to God in your own words..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={userPrayer}
                  onChangeText={setUserPrayer}
                />
              </View>
            )}
          </View>

          {/* 5. My Reflection & Personal Notes */}
          <View style={[styles.notesCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text-outline" size={17} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.notesTitle, { color: colors.text }]}>My Personal Notes & Insights</Text>
            </View>

            <TextInput
              style={[
                styles.reflectionInput,
                {
                  backgroundColor: colors.glassInput,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Capture key lessons, what God spoke to you, or journal notes..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={userReflection}
              onChangeText={setUserReflection}
            />

            <View style={styles.notesSaveRow}>
              {savedSuccessNotice && (
                <View style={styles.savedNoticeGroup}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.savedNoticeText, { color: colors.success }]}>Saved to your notes</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveNotesBtn, { backgroundColor: colors.tint, marginLeft: 'auto' }]}
                onPress={handleSaveReflection}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.saveNotesBtnText}>Save Reflection</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Complete Devotion Action Button */}
          <TouchableOpacity
            style={[
              styles.completeBtn,
              {
                backgroundColor: isCompleted ? colors.success : colors.tint,
                borderColor: isCompleted ? colors.success : colors.tint,
              },
            ]}
            onPress={handleCompleteDevotion}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.completeBtnText}>
              {isCompleted ? '✓ Devotion Completed • Tap to Undo' : '✓ Complete Devotion'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Celebration Modal when Devotion is Completed */}
        <Modal
          visible={completionModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCompletionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <DevotionMascot mood="happy" size={80} />

              <Text style={[styles.modalTitle, { color: colors.text }]}>Devotion Completed! 🎉</Text>
              <Text style={[styles.modalVerseRef, { color: colors.tint }]}>
                {devotion.scriptureCitation}
              </Text>

              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                May the peace of Christ fill your heart as you carry His Word into the rest of your day.
              </Text>

              <TouchableOpacity
                style={[styles.modalDoneBtn, { backgroundColor: colors.tint }]}
                onPress={() => setCompletionModalVisible(false)}
              >
                <Text style={styles.modalDoneBtnText}>Amen • Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Verse Wallpaper & Image Studio Modal */}
        <StoryShareModal
          visible={showStoryModal}
          verseText={devotion.scriptureText}
          citation={devotion.scriptureCitation}
          onClose={() => setShowStoryModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 6,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  quietSanctuaryHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 6,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  devotionTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  scriptureCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scriptureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scriptureTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scriptureCitationText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  wallpaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  wallpaperBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  readBibleLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readBibleLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scriptureQuoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 23,
    fontWeight: '500',
  },
  reflectionSection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  paragraphText: {
    fontSize: 15.5,
    lineHeight: 25,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  thinkCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  thinkHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  thinkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkPretitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  thinkQuestion: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    lineHeight: 20,
  },
  prayerCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  prayerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  prayerContentText: {
    fontSize: 14.5,
    fontStyle: 'italic',
    lineHeight: 23,
    marginBottom: 10,
  },
  addPrayerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  addPrayerToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customPrayerBlock: {
    marginTop: 8,
  },
  customPrayerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  customPrayerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    lineHeight: 20,
  },
  notesCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 85,
    lineHeight: 20,
    marginBottom: 10,
  },
  notesSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedNoticeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveNotesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalVerseRef: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDoneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
