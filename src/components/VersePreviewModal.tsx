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
  onInsertVerse?: (passage: PassageDetails) => void;
}

export const VersePreviewModal: React.FC<VersePreviewModalProps> = ({
  visible,
  passage,
  isLoading = false,
  onClose,
  onNavigateToReader,
  onInsertVerse,
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
                  backgroundColor: colors.glassCardElevated,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="book" size={20} color={colors.tint} style={{ marginRight: 8 }} />
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
                nestedScrollEnabled={true}
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
              {passage && passage.verses.length > 0 && (
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                  {onInsertVerse && (
                    <TouchableOpacity
                      style={[styles.insertButton, { backgroundColor: colors.tint }]}
                      onPress={() => {
                        onInsertVerse(passage);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.insertButtonText}>Insert into Note</Text>
                    </TouchableOpacity>
                  )}

                  {onNavigateToReader && (
                    <TouchableOpacity
                      style={[
                        styles.readerButton,
                        {
                          backgroundColor: onInsertVerse ? colors.secondaryBackground : colors.tint,
                          marginTop: onInsertVerse ? 8 : 0,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        onNavigateToReader(passage.ref.bookId, passage.ref.chapter);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="open-outline"
                        size={16}
                        color={onInsertVerse ? colors.text : '#FFFFFF'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.readerButtonText,
                          { color: onInsertVerse ? colors.text : '#FFFFFF' },
                        ]}
                      >
                        Open in Bible Reader
                      </Text>
                    </TouchableOpacity>
                  )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    minHeight: 260,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 18,
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
  insertButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  insertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  readerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  readerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
