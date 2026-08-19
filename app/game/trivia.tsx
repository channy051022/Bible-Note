import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { AnimatedMascot } from '../../src/components/AnimatedMascot';
import {
  GamificationEngine,
  GameDifficulty,
  GameStats,
} from '../../src/utils/gamificationEngine';
import { GameAudioService } from '../../src/services/gameAudioService';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  scriptureRef: string;
}

const TRIVIA_POOLS: Record<GameDifficulty, TriviaQuestion[]> = {
  easy: [
    {
      id: 1,
      question: 'Who built the ark to survive the Great Flood?',
      options: ['Moses', 'Noah', 'Abraham', 'David'],
      correctIndex: 1,
      explanation: 'Noah was commanded by God to build the ark of gopher wood.',
      scriptureRef: 'Genesis 6:14',
    },
    {
      id: 2,
      question: 'What is the very first book of the Holy Bible?',
      options: ['Exodus', 'Matthew', 'Genesis', 'Psalms'],
      correctIndex: 2,
      explanation: 'Genesis chronicles the creation of heaven and earth.',
      scriptureRef: 'Genesis 1:1',
    },
    {
      id: 3,
      question: 'In what town was our Lord Jesus born?',
      options: ['Jerusalem', 'Nazareth', 'Bethlehem', 'Capernaum'],
      correctIndex: 2,
      explanation: 'Jesus was born in Bethlehem of Judea, fulfilling prophecy.',
      scriptureRef: 'Micah 5:2 / Luke 2:4',
    },
    {
      id: 4,
      question: 'Who defeated the giant Goliath with a sling and stone?',
      options: ['Saul', 'David', 'Samson', 'Joshua'],
      correctIndex: 1,
      explanation: 'Young shepherd David trusted in the Lord and struck Goliath down.',
      scriptureRef: '1 Samuel 17:49',
    },
    {
      id: 5,
      question: 'How many days did Jesus fast in the wilderness?',
      options: ['7 days', '12 days', '40 days', '100 days'],
      correctIndex: 2,
      explanation: 'Jesus fasted 40 days and 40 nights before overcoming temptation.',
      scriptureRef: 'Matthew 4:2',
    },
  ],
  medium: [
    {
      id: 6,
      question: 'Which disciple walked on water toward Jesus before beginning to sink?',
      options: ['John', 'Peter', 'James', 'Andrew'],
      correctIndex: 1,
      explanation: 'Peter stepped out of the boat onto the water toward Jesus.',
      scriptureRef: 'Matthew 14:29',
    },
    {
      id: 7,
      question: 'What was Paul’s name before his conversion on the road to Damascus?',
      options: ['Silas', 'Barnabas', 'Saul', 'Stephen'],
      correctIndex: 2,
      explanation: 'Saul of Tarsus became Paul the apostle after encountering Christ.',
      scriptureRef: 'Acts 9:3-4',
    },
    {
      id: 8,
      question: 'How many total books are in the canonical Protestant Bible?',
      options: ['50', '66', '73', '80'],
      correctIndex: 1,
      explanation: 'There are 39 books in the Old Testament and 27 in the New Testament (66 total).',
      scriptureRef: 'Canonical Bible Structure',
    },
    {
      id: 9,
      question: 'Which prophet was swallowed by a great fish when fleeing God\'s call to Nineveh?',
      options: ['Elijah', 'Jonah', 'Jeremiah', 'Ezekiel'],
      correctIndex: 1,
      explanation: 'Jonah was in the belly of the fish for three days and three nights.',
      scriptureRef: 'Jonah 1:17',
    },
    {
      id: 10,
      question: 'What fruit of the Spirit is listed first in Galatians 5?',
      options: ['Joy', 'Peace', 'Love', 'Faithfulness'],
      correctIndex: 2,
      explanation: '"But the fruit of the Spirit is love, joy, peace..."',
      scriptureRef: 'Galatians 5:22',
    },
  ],
  hard: [
    {
      id: 11,
      question: 'What was the name of Moses\' wife, daughter of Jethro the priest of Midian?',
      options: ['Zipporah', 'Miriam', 'Hannah', 'Deborah'],
      correctIndex: 0,
      explanation: 'Zipporah was given to Moses by Reuel/Jethro.',
      scriptureRef: 'Exodus 2:21',
    },
    {
      id: 12,
      question: 'Who was the oldest man mentioned in the Bible, living 969 years?',
      options: ['Adam', 'Enoch', 'Methuselah', 'Noah'],
      correctIndex: 2,
      explanation: 'Methuselah lived nine hundred and sixty and nine years.',
      scriptureRef: 'Genesis 5:27',
    },
    {
      id: 13,
      question: 'Which Roman governor presided over the trial of Jesus and washed his hands?',
      options: ['Pontius Pilate', 'Felix', 'Festus', 'Herod Antipas'],
      correctIndex: 0,
      explanation: 'Pilate took water and washed his hands before the multitude.',
      scriptureRef: 'Matthew 27:24',
    },
    {
      id: 14,
      question: 'In the Revelation vision, how many gates does the New Jerusalem have?',
      options: ['7', '10', '12', '24'],
      correctIndex: 2,
      explanation: 'The holy city had twelve gates with the names of the twelve tribes.',
      scriptureRef: 'Revelation 21:12',
    },
    {
      id: 15,
      question: 'What was the occupation of the apostle Luke, author of Luke and Acts?',
      options: ['Tax Collector', 'Fisherman', 'Physician', 'Tentmaker'],
      correctIndex: 2,
      explanation: 'Paul refers to him as "Luke, the beloved physician".',
      scriptureRef: 'Colossians 4:14',
    },
  ],
};

export default function BibleTriviaScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStats>(GamificationEngine.getGameStats('trivia'));
  const [mascotMessage, setMascotMessage] = useState<string>('Test your sacred Bible knowledge! Select the correct answer.');

  const questions = TRIVIA_POOLS[difficulty] || TRIVIA_POOLS.easy;
  const currentQuestion = questions[currentIndex] || questions[0];

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setMascotMessage('Test your sacred Bible knowledge! Select the correct answer.');
    GamificationEngine.recordGameAttempt('trivia');
    setGameStats(GamificationEngine.getGameStats('trivia'));
    GameAudioService.playBGM('trivia');
  }, [difficulty]);

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    GameAudioService.playTapSound();

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      GameAudioService.playSuccessSound();
      setScore((prev) => prev + 100);
      setMascotMessage('✨ Correct! ' + currentQuestion.explanation);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      GameAudioService.playWarningSound();
      setMascotMessage('Not quite! The correct answer was ' + currentQuestion.options[currentQuestion.correctIndex] + '.');
    }
  };

  const handleNextQuestion = () => {
    GameAudioService.playTapSound();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setMascotMessage('Next question! Choose with faith.');
    } else {
      // Finished round
      setIsFinished(true);
      GameAudioService.playVictoryFanfare();
      const baseStars = difficulty === 'hard' ? 40 : difficulty === 'medium' ? 25 : 15;
      const result = GamificationEngine.recordVictory('trivia', baseStars, score + (selectedOption === currentQuestion.correctIndex ? 100 : 0));
      setGameStats(result.gameStats);
      setMascotMessage(`🐑🎉 Trivia Round Complete! You scored ${score} pts and earned +${baseStars} Wool Stars!`);
    }
  };

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

        <View style={styles.titleBadge}>
          <Text style={[styles.titleBadgeText, { color: colors.tint }]}>📜 Bible Trivia (Lvl {gameStats.level})</Text>
        </View>

        <View style={[styles.scoreBadge, { backgroundColor: colors.tintLight }]}>
          <Text style={[styles.scoreBadgeText, { color: colors.tint }]}>{score} pts</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Banner */}
        <View style={[styles.mascotBanner, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
          <View style={styles.mascotThumb}>
            <AnimatedMascot width={50} height={55} />
          </View>
          <View style={styles.mascotSpeech}>
            <Text style={[styles.mascotSpeechTitle, { color: colors.tint }]}>SHEP COMPANION</Text>
            <Text style={[styles.mascotSpeechText, { color: colors.text }]}>{mascotMessage}</Text>
          </View>
        </View>

        {/* Difficulty Selector */}
        <View style={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((d) => {
            const isSelected = difficulty === d;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDifficulty(d)}
                style={[
                  styles.difficultyPill,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.glassInput,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
              >
                <Text style={[styles.difficultyPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {d.toUpperCase()} ({d === 'easy' ? '+15⭐' : d === 'medium' ? '+25⭐' : '+40⭐'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isFinished ? (
          /* Victory Round Summary */
          <View style={[styles.victoryCard, { backgroundColor: colors.glassCard, borderColor: colors.tint }]}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>👑</Text>
            <Text style={[styles.victoryTitle, { color: colors.text }]}>Trivia Round Complete!</Text>
            <Text style={[styles.victoryScoreText, { color: colors.tint }]}>Final Score: {score} Points</Text>
            <Text style={[styles.victorySubtitle, { color: colors.textSecondary }]}>
              Thy word is a lamp unto my feet, and a light unto my path.
            </Text>

            <TouchableOpacity
              style={[styles.playAgainBtn, { backgroundColor: colors.tint }]}
              onPress={() => {
                setCurrentIndex(0);
                setSelectedOption(null);
                setScore(0);
                setIsFinished(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.playAgainBtnText}>Play Another Round ➔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Question Card */}
            <View style={[styles.questionCard, { backgroundColor: colors.glassCard, borderColor: colors.border }]}>
              <View style={styles.questionHeader}>
                <Text style={[styles.questionCounter, { color: colors.tint }]}>
                  QUESTION {currentIndex + 1} OF {questions.length}
                </Text>
              </View>
              <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.question}</Text>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctIndex;
                let bg = colors.glassCard;
                let border = colors.border;
                let textColor = colors.text;

                if (selectedOption !== null) {
                  if (isCorrect) {
                    bg = 'rgba(52, 199, 89, 0.15)';
                    border = '#34C759';
                    textColor = '#34C759';
                  } else if (isSelected) {
                    bg = 'rgba(255, 59, 48, 0.15)';
                    border = '#FF3B30';
                    textColor = '#FF3B30';
                  }
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectOption(idx)}
                    style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
                    activeOpacity={0.7}
                    disabled={selectedOption !== null}
                  >
                    <View style={[styles.optionIndexBadge, { backgroundColor: colors.glassInput, borderColor: border }]}>
                      <Text style={[styles.optionIndexText, { color: textColor }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                    {selectedOption !== null && isCorrect ? (
                      <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    ) : selectedOption !== null && isSelected ? (
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Scripture Reference and Explanation */}
            {selectedOption !== null && (
              <View style={[styles.explanationCard, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="book" size={14} color={colors.tint} style={{ marginRight: 6 }} />
                  <Text style={[styles.explanationRef, { color: colors.tint }]}>{currentQuestion.scriptureRef}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {currentQuestion.explanation}
                </Text>

                <TouchableOpacity
                  style={[styles.nextQuestionBtn, { backgroundColor: colors.tint }]}
                  onPress={handleNextQuestion}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextQuestionBtnText}>
                    {currentIndex + 1 < questions.length ? 'Next Question ➔' : 'Finish Round ➔'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  titleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 12,
  },
  mascotThumb: {
    width: 50,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mascotSpeech: {
    flex: 1,
  },
  mascotSpeechTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  mascotSpeechText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  difficultyPill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  difficultyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  questionHeader: {
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  optionsList: {
    marginBottom: 14,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndexText: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  explanationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  explanationRef: {
    fontSize: 13,
    fontWeight: '800',
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  nextQuestionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextQuestionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  victoryCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginVertical: 14,
  },
  victoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  victoryScoreText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  victorySubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  playAgainBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
