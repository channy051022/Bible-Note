import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/hooks/useTheme';
import { AnimatedMascot } from '../src/components/AnimatedMascot';
import {
  SUPPORT_CONFIG,
  openShepherdFacebookPage,
  openShepherdMessenger,
} from '../src/constants/support';

export default function SupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleSupportViaGCash = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await openShepherdMessenger();
  };

  const handleVisitFacebookPage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openShepherdFacebookPage();
  };

  const handleOpenMessenger = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openShepherdMessenger();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Support Shepherd',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Hero Card with Mascot */}
        <View style={[styles.heroCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.mascotContainer}>
            <AnimatedMascot width={95} height={105} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.titleSheepEmoji}>🐑</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Support Shepherd</Text>
          </View>

          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Shepherd is free and made to help you spend more time with God's Word.
          </Text>

          <Text style={[styles.heroHeartText, { color: colors.text }]}>
            If Shepherd has been helpful to you, you can support the continued development of the app. ❤️
          </Text>
        </View>

        {/* 2. Primary Actions Card */}
        <View style={[styles.actionCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          {/* Primary GCash Support Button */}
          <TouchableOpacity
            style={[styles.primaryGCashButton, { backgroundColor: '#00C77E' }]}
            onPress={handleSupportViaGCash}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconCircle}>
              <Ionicons name="heart" size={18} color="#00C77E" />
            </View>
            <Text style={styles.primaryGCashButtonText}>💚 Support via GCash</Text>
          </TouchableOpacity>

          <Text style={[styles.actionExplanation, { color: colors.textSecondary }]}>
            Support Shepherd through our official Facebook Page and Messenger.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Secondary Actions */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.glassInput, borderColor: colors.border }]}
              onPress={handleVisitFacebookPage}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-facebook" size={16} color="#1877F2" style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Shepherd Facebook Page
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.glassInput, borderColor: colors.border, marginTop: 8 }]}
              onPress={handleOpenMessenger}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0084FF" style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Chat in Messenger
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Simple 4-Step Flow Explanation */}
        <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.tint }]}>HOW IT WORKS</Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.tintLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.tint }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Open Facebook Page or Messenger
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Tap the button above to open the official Shepherd Facebook Page.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.tintLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.tint }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Select "Support Shepherd 🐑"
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                In Messenger, tap the Support Shepherd option to view the GCash transfer details.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.tintLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.tint }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Transfer with GCash
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Use your GCash app to send any amount of love gift and support.
              </Text>
            </View>
          </View>

          <View style={[styles.stepItem, { marginBottom: 0 }]}>
            <View style={[styles.stepNumberBadge, { backgroundColor: colors.tintLight }]}>
              <Text style={[styles.stepNumberText, { color: colors.tint }]}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Keep Shepherd Free for Everyone ❤️
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Every gift directly funds offline Bible translations, server costs, and new devotional features.
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Peace of Mind & Trust Card */}
        <View style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustTitle, { color: colors.text }]}>Safe & Private</Text>
              <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
                Shepherd never asks for or stores your GCash PIN, password, OTP, or payment credentials.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.trustRow}>
            <Ionicons name="gift-outline" size={20} color={colors.gold} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustTitle, { color: colors.text }]}>100% Free & No Ads Forever</Text>
              <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
                All scriptures, translations, study notes, audio, and reading plans will always be completely free.
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Peaceful Footer */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Support is optional.
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>
            Thank you for helping Shepherd grow. 🙏
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  mascotContainer: {
    width: 95,
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSheepEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  heroHeartText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryGCashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#00C77E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  primaryGCashButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionExplanation: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  secondaryActionsRow: {
    width: '100%',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    fontWeight: '600',
  },
});
