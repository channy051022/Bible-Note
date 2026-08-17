import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PassageDetails } from '../types/bible';
import { useTheme } from '../hooks/useTheme';

interface VersePreviewModalProps {
  visible: boolean;
  passage: PassageDetails | null;
  isLoading?: boolean;
  onClose: () => void;
  onNavigateToReader?: (bookId: number, chapter: number) => void;
}

export const VersePreviewModal: React.FC<VersePreviewModalProps> = ({
  visible,
  passage,
  isLoading = false,
  onClose,
  onNavigateToReader,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Handle bar for bottom sheet look */}
              <View style={styles.handleBarContainer}>
                <View style={[styles.handleBar, { backgroundColor: colors.separator }]} />
              </View>

              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="book-outline" size={20} color={colors.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.title, { color: colors.text }]}>
                    {passage?.formattedTitle ?? 'Scripture Reference'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.secondaryBackground }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content Area */}
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Loading scripture...
                    </Text>
                  </View>
                ) : !passage || passage.verses.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No offline text available for this reference.
                    </Text>
                  </View>
                ) : (
                  passage.verses.map((v) => (
                    <View key={v.id} style={styles.verseRow}>
                      <Text style={[styles.verseNumber, { color: colors.tint }]}>{v.verse}</Text>
                      <Text style={[styles.verseText, { color: colors.text }]}>{v.text}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Footer Actions */}
              {passage && onNavigateToReader && (
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.readerButton, { backgroundColor: colors.tint }]}
                    onPress={() => {
                      onClose();
                      onNavigateToReader(passage.ref.bookId, passage.ref.chapter);
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.readerButtonText}>Open in Bible Reader</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: 280,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    width: 28,
    paddingTop: 3,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 25,
    flex: 1,
    fontFamily: 'System',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  readerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
