import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import {
  GamificationEngine,
  GameDifficulty,
  GameStats,
} from '../../src/utils/gamificationEngine';
import { GameAudioService } from '../../src/services/gameAudioService';
import {
  CROSSWORD_50_LEVELS,
  WordscapesLevel,
  CrosswordGridWord,
} from '../../src/constants/crosswordLevels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(240, SCREEN_WIDTH * 0.64);
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const NODE_SIZE = 50;
const NODE_RADIUS = NODE_SIZE / 2;

export default function BibleWordscapesCrosswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [solvedWords, setSolvedWords] = useState<string[]>([]);
  const [revealedCells, setRevealedCells] = useState<Record<string, string>>({});
  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentTouchPos, setCurrentTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStats>(GamificationEngine.getGameStats('crossword'));
  const [hintCount, setHintCount] = useState<number>(5);

  const wheelViewRef = useRef<View>(null);
  const wheelPagePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const level = CROSSWORD_50_LEVELS[levelIdx % CROSSWORD_50_LEVELS.length];

  // Measure absolute screen coordinates of wheel container
  const measureWheelPosition = () => {
    if (wheelViewRef.current) {
      wheelViewRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (pageX !== undefined && pageY !== undefined) {
          wheelPagePos.current = { x: pageX, y: pageY };
        }
      });
    }
  };

  // Initialize level
  useEffect(() => {
    setSolvedWords([]);
    setRevealedCells({});
    setSelectedIndices([]);
    setCurrentTouchPos(null);
    setIsVictory(false);
    setFeedbackMessage('');
    setCurrentLetters([...level.letters].sort(() => Math.random() - 0.5));
    GamificationEngine.recordGameAttempt('crossword');
    setGameStats(GamificationEngine.getGameStats('crossword'));
    GameAudioService.playBGM('crossword');
    setTimeout(measureWheelPosition, 200);

    return () => {
      // Audio managed per game/screen
    };
  }, [levelIdx]);

  // Calculate letter node positions on the wheel
  const nodePositions = useMemo(() => {
    const N = currentLetters.length;
    const padding = 34;
    const r = WHEEL_RADIUS - padding;
    const cx = WHEEL_RADIUS;
    const cy = WHEEL_RADIUS;

    return currentLetters.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { x, y, angle };
    });
  }, [currentLetters]);

  // Formed word string
  const currentFormedWord = useMemo(() => {
    return selectedIndices.map((i) => currentLetters[i]).join('');
  }, [selectedIndices, currentLetters]);

  // Handle word submission on release
  const handleWordSubmit = (word: string) => {
    if (!word || word.length < 2) {
      setSelectedIndices([]);
      setCurrentTouchPos(null);
      return;
    }

    const upper = word.toUpperCase();
    const matchingGridWord = level.gridWords.find((gw) => gw.word.toUpperCase() === upper);

    if (matchingGridWord) {
      if (solvedWords.includes(upper)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        GameAudioService.playWarningSound();
        setFeedbackMessage('Already Solved!');
        setTimeout(() => setFeedbackMessage(''), 1200);
      } else {
        // Correct new word!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        GameAudioService.playSuccessSound();
        const newSolved = [...solvedWords, upper];
        setSolvedWords(newSolved);
        setFeedbackMessage(`✨ "${upper}" Found! ✨`);
        setTimeout(() => setFeedbackMessage(''), 1500);

        // Check if level complete
        if (newSolved.length === level.gridWords.length) {
          setIsVictory(true);
          GameAudioService.playVictoryFanfare();
          const baseStars = level.difficulty === 'hard' ? 45 : level.difficulty === 'medium' ? 30 : 20;
          const result = GamificationEngine.recordVictory('crossword', baseStars, newSolved.length * 100);
          setGameStats(result.gameStats);
        }
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      GameAudioService.playWarningSound();
      setFeedbackMessage('Not on the grid');
      setTimeout(() => setFeedbackMessage(''), 1000);
    }

    setSelectedIndices([]);
    setCurrentTouchPos(null);
  };

  // Find index of letter node closest to touch (with generous hit radius)
  const getTouchedNodeIndex = (touchX: number, touchY: number): number | null => {
    const threshold = NODE_SIZE * 0.95; // generous hit area for effortless swiping
    for (let i = 0; i < nodePositions.length; i++) {
      const node = nodePositions[i];
      const dx = touchX - node.x;
      const dy = touchY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= threshold) {
        return i;
      }
    }
    return null;
  };

  // Smooth PanResponder for swipe drag-to-connect gesture
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          measureWheelPosition();
          const pageX = evt.nativeEvent.pageX;
          const pageY = evt.nativeEvent.pageY;

          let touchX = pageX - wheelPagePos.current.x;
          let touchY = pageY - wheelPagePos.current.y;

          // Fallback if wheel position was 0
          if (wheelPagePos.current.x === 0 && wheelPagePos.current.y === 0) {
            touchX = evt.nativeEvent.locationX;
            touchY = evt.nativeEvent.locationY;
          }

          setCurrentTouchPos({ x: touchX, y: touchY });
          const index = getTouchedNodeIndex(touchX, touchY);
          if (index !== null) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            GameAudioService.playTapSound();
            setSelectedIndices([index]);
          }
        },
        onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          const pageX = gestureState.moveX || evt.nativeEvent.pageX;
          const pageY = gestureState.moveY || evt.nativeEvent.pageY;

          let touchX = pageX - wheelPagePos.current.x;
          let touchY = pageY - wheelPagePos.current.y;

          if (wheelPagePos.current.x === 0 && wheelPagePos.current.y === 0) {
            touchX = evt.nativeEvent.locationX;
            touchY = evt.nativeEvent.locationY;
          }

          setCurrentTouchPos({ x: touchX, y: touchY });
          const index = getTouchedNodeIndex(touchX, touchY);
          if (index !== null) {
            setSelectedIndices((prev) => {
              if (prev.includes(index)) {
                // If sliding backwards to previous node, pop current
                if (prev.length > 1 && prev[prev.length - 2] === index) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  return prev.slice(0, -1);
                }
                return prev;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              GameAudioService.playTapSound();
              return [...prev, index];
            });
          }
        },
        onPanResponderRelease: () => {
          setCurrentTouchPos(null);
          setSelectedIndices((finalIndices) => {
            const word = finalIndices.map((i) => currentLetters[i]).join('');
            handleWordSubmit(word);
            return [];
          });
        },
        onPanResponderTerminate: () => {
          setCurrentTouchPos(null);
          setSelectedIndices([]);
        },
      }),
    [nodePositions, currentLetters, solvedWords, level]
  );

  // Shuffle letters on wheel
  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentLetters((prev) => [...prev].sort(() => Math.random() - 0.5));
    setSelectedIndices([]);
    setCurrentTouchPos(null);
  };

  // Lightbulb Hint: reveals 1 unsolved cell
  const handleLightbulbHint = () => {
    if (hintCount <= 0 || isVictory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Find all unsolved cells
    const unrevealedCells: { key: string; letter: string }[] = [];
    level.gridWords.forEach((gw) => {
      if (!solvedWords.includes(gw.word)) {
        for (let i = 0; i < gw.word.length; i++) {
          const r = gw.direction === 'across' ? gw.row : gw.row + i;
          const c = gw.direction === 'across' ? gw.col + i : gw.col;
          const key = `${r}-${c}`;
          if (!revealedCells[key]) {
            unrevealedCells.push({ key, letter: gw.word[i] });
          }
        }
      }
    });

    if (unrevealedCells.length > 0) {
      const pick = unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)];
      setRevealedCells((prev) => ({ ...prev, [pick.key]: pick.letter }));
      setHintCount((prev) => prev - 1);
      setFeedbackMessage(`💡 Revealed letter '${pick.letter}'!`);
      setTimeout(() => setFeedbackMessage(''), 1200);
    }
  };

  // Word Insight Clue Hint: provides fun fact and theme clue
  const handleWordHint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFeedbackMessage(`💡 ${level.themeTitle}: "${level.funFact.slice(0, 45)}..."`);
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  // Build 2D Crossword Grid Model
  const gridCells = useMemo(() => {
    const { rows, cols } = level.gridDimensions;
    const grid: ({ letter: string; isSolved: boolean; key: string } | null)[][] = Array.from(
      { length: rows },
      () => Array(cols).fill(null)
    );

    level.gridWords.forEach((gw) => {
      const isWordSolved = solvedWords.includes(gw.word.toUpperCase());
      for (let i = 0; i < gw.word.length; i++) {
        const r = gw.direction === 'across' ? gw.row : gw.row + i;
        const c = gw.direction === 'across' ? gw.col + i : gw.col;
        const key = `${r}-${c}`;
        const existing = grid[r][c];
        const isCellSolved = isWordSolved || !!revealedCells[key] || (existing?.isSolved ?? false);

        grid[r][c] = {
          letter: gw.word[i],
          isSolved: isCellSolved,
          key,
        };
      }
    });

    return grid;
  }, [level, solvedWords, revealedCells]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#131924' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.exitBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.exitBtnText}>Game Hub</Text>
        </TouchableOpacity>

        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LEVEL {level.levelNumber}</Text>
          <Text style={styles.themeTitleText}>{level.themeTitle}</Text>
        </View>

        <View style={styles.starsPill}>
          <Text style={{ fontSize: 13, marginRight: 4 }}>🌟</Text>
          <Text style={styles.starsPillText}>{gameStats.totalStarsEarned}</Text>
        </View>
      </View>

      {/* Main Crossword Playing Canvas */}
      <View style={styles.canvasContainer}>
        {/* UPPER SECTION: Intersecting Crossword Grid */}
        <View style={styles.crosswordGridArea}>
          <View style={styles.gridBoxContainer}>
            {gridCells.map((row, rIdx) => (
              <View key={rIdx} style={styles.gridRow}>
                {row.map((cell, cIdx) => {
                  if (!cell) {
                    return <View key={cIdx} style={styles.emptyGridCell} />;
                  }

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.crosswordTile,
                        cell.isSolved ? styles.solvedTile : styles.unsolvedTile,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tileLetterText,
                          cell.isSolved ? styles.solvedLetterText : styles.unsolvedLetterText,
                        ]}
                      >
                        {cell.isSolved ? cell.letter : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* MIDDLE SECTION: Live Connected Word Banner */}
        <View style={styles.previewContainer}>
          {feedbackMessage ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </View>
          ) : currentFormedWord.length > 0 ? (
            <View style={styles.activeWordPill}>
              <Text style={styles.activeWordText}>{currentFormedWord}</Text>
            </View>
          ) : (
            <View style={styles.hintPlaceholder}>
              <Text style={styles.hintPlaceholderText}>Swipe across letters to connect English words</Text>
            </View>
          )}
        </View>

        {/* BOTTOM SECTION: Letter Wheel & Powerup Tools */}
        <View style={styles.wheelAreaContainer}>
          {/* Left Action Buttons */}
          <View style={styles.sideButtonsCol}>
            <TouchableOpacity
              style={styles.powerupBtn}
              onPress={handleShuffle}
              activeOpacity={0.7}
            >
              <Ionicons name="shuffle" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerupBtn, { marginTop: 16 }]}
              onPress={handleWordHint}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={22} color="#E5A93C" />
            </TouchableOpacity>
          </View>

          {/* Center Circular Letter Wheel with Live Connecting Lines */}
          <View
            ref={wheelViewRef}
            style={styles.wheelDisc}
            onLayout={measureWheelPosition}
            {...panResponder.panHandlers}
          >
            {/* 1. Connecting Solid Lines Between Selected Letter Nodes */}
            {selectedIndices.map((nodeIdx, i) => {
              if (i === selectedIndices.length - 1) return null;
              const nextIdx = selectedIndices[i + 1];
              const p1 = nodePositions[nodeIdx];
              const p2 = nodePositions[nextIdx];
              if (!p1 || !p2) return null;

              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <View
                  key={`line-${i}`}
                  style={[
                    styles.connectorLine,
                    {
                      left: midX - len / 2,
                      top: midY - 6,
                      width: len,
                      transform: [{ rotate: `${angle}deg` }],
                      opacity: 0.75,
                    },
                  ]}
                  pointerEvents="none"
                />
              );
            })}

            {/* 2. Trailing Line Connector from Last Node to User's Active Touch */}
            {currentTouchPos && selectedIndices.length > 0 && (() => {
              const lastNodeIdx = selectedIndices[selectedIndices.length - 1];
              const p1 = nodePositions[lastNodeIdx];
              const p2 = currentTouchPos;
              if (!p1 || !p2) return null;

              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 8) return null;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <View
                  style={[
                    styles.connectorLine,
                    styles.trailingConnectorLine,
                    {
                      left: midX - len / 2,
                      top: midY - 6,
                      width: len,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                  pointerEvents="none"
                />
              );
            })()}

            {/* 3. Circular Letter Nodes */}
            {currentLetters.map((letter, idx) => {
              const pos = nodePositions[idx];
              if (!pos) return null;
              const isSelected = selectedIndices.includes(idx);

              return (
                <View
                  key={idx}
                  style={[
                    styles.letterNode,
                    {
                      left: pos.x - NODE_RADIUS,
                      top: pos.y - NODE_RADIUS,
                      backgroundColor: isSelected ? '#22C55E' : '#FFFFFF',
                      borderColor: isSelected ? '#86EFAC' : '#CBD5E1',
                      transform: [{ scale: isSelected ? 1.18 : 1.0 }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text
                    style={[
                      styles.letterNodeText,
                      { color: isSelected ? '#FFFFFF' : '#1F2937' },
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Right Action Buttons */}
          <View style={styles.sideButtonsCol}>
            <TouchableOpacity
              style={styles.powerupBtn}
              onPress={handleLightbulbHint}
              activeOpacity={0.7}
            >
              <Ionicons name="bulb" size={20} color="#FBBF24" />
              {hintCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{hintCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerupBtn, { marginTop: 16 }]}
              onPress={() => setLevelIdx((prev) => prev + 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color="#60A5FA" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Victory Celebration Modal */}
      {isVictory && (
        <View style={styles.victoryOverlay}>
          <View style={styles.victoryCard}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🏆</Text>
            <Text style={styles.victoryTitle}>Crossword Solved!</Text>
            <Text style={styles.victoryTheme}>{level.themeTitle}</Text>

            {/* Word Insight / Fun Fact */}
            <View style={styles.scriptureCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="sparkles" size={14} color="#E5A93C" style={{ marginRight: 6 }} />
                <Text style={styles.scriptureRef}>Word Master Insight</Text>
              </View>
              <Text style={styles.scriptureBody}>"{level.funFact}"</Text>
            </View>

            <View style={styles.rewardBadges}>
              <View style={styles.starBadge}>
                <Text style={styles.starBadgeText}>
                  +{level.difficulty === 'hard' ? 45 : level.difficulty === 'medium' ? 30 : 20} Wool Stars 🌟
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.nextLevelBtn}
              onPress={() => setLevelIdx((prev) => prev + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.nextLevelBtnText}>Next Level ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  levelBadge: {
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  themeTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderColor: '#E5A93C',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  starsPillText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '800',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  crosswordGridArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  gridBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  emptyGridCell: {
    width: 36,
    height: 36,
    margin: 2.5,
  },
  crosswordTile: {
    width: 36,
    height: 36,
    margin: 2.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsolvedTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  solvedTile: {
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  tileLetterText: {
    fontSize: 18,
    fontWeight: '900',
  },
  solvedLetterText: {
    color: '#FFFFFF',
  },
  unsolvedLetterText: {
    color: 'transparent',
  },
  previewContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  activeWordPill: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#86EFAC',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  activeWordText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  feedbackBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  feedbackText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  hintPlaceholder: {
    opacity: 0.6,
  },
  hintPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  wheelAreaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  sideButtonsCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerupBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  wheelDisc: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  connectorLine: {
    position: 'absolute',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  trailingConnectorLine: {
    opacity: 0.85,
  },
  letterNode: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_RADIUS,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 3,
  },
  letterNodeText: {
    fontSize: 22,
    fontWeight: '900',
  },
  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  victoryCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#22C55E',
    padding: 24,
    alignItems: 'center',
  },
  victoryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  victoryTheme: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  scriptureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    marginBottom: 16,
    width: '100%',
  },
  scriptureRef: {
    color: '#E5A93C',
    fontSize: 13,
    fontWeight: '800',
  },
  scriptureBody: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  rewardBadges: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  starBadge: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderColor: '#E5A93C',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  starBadgeText: {
    color: '#E5A93C',
    fontSize: 13,
    fontWeight: '800',
  },
  nextLevelBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  nextLevelBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
