import { Audio } from 'expo-av';
import { getItem, setItem } from '../utils/storage';

export type BgmTrackTheme = 'auto' | 'galaxy' | 'sunny' | 'puzzle' | 'party' | 'peaceful';

export interface GameAudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
  hapticsEnabled: boolean;
  bgmTrackTheme: BgmTrackTheme;
}

const STORAGE_KEY_AUDIO_SETTINGS = 'game_audio_settings';

const DEFAULT_AUDIO_SETTINGS: GameAudioSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  hapticsEnabled: true,
  bgmTrackTheme: 'auto',
};

const AUDIO_ASSETS = {
  // Cute, upbeat Mario Galaxy style BGM tracks
  galaxy: require('../../assets/mario_galaxy_adventure.wav'),
  sunny: require('../../assets/cute_sunny_bounce.wav'),
  puzzle: require('../../assets/puzzle_bubble_joy.wav'),
  party: require('../../assets/cheerful_trivia_party.wav'),
  peaceful: require('../../assets/peaceful_piano.wav'),

  // Cute SFX assets
  pop: require('../../assets/cute_pop_tap.wav'),
  star: require('../../assets/star_chime_success.wav'),
  fanfare: require('../../assets/joyful_level_fanfare.wav'),
  boing: require('../../assets/cute_boing_wrong.wav'),
};

const GAME_TRACK_MAP: Record<string, keyof typeof AUDIO_ASSETS> = {
  hub: 'galaxy',
  scramble: 'sunny',
  books_sort: 'galaxy',
  crossword: 'puzzle',
  trivia: 'party',
};

class GameAudioServiceImpl {
  private currentBgmSound: Audio.Sound | null = null;
  private currentTrackName: string | null = null;
  private isAudioModeInitialized: boolean = false;

  private async ensureAudioMode(): Promise<void> {
    if (this.isAudioModeInitialized) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isAudioModeInitialized = true;
    } catch (e) {
      console.warn('GameAudioService: Failed to initialize audio mode', e);
    }
  }

  /**
   * Get current game audio settings.
   */
  getSettings(): GameAudioSettings {
    return getItem<GameAudioSettings>(STORAGE_KEY_AUDIO_SETTINGS, DEFAULT_AUDIO_SETTINGS);
  }

  /**
   * Update and persist game audio settings.
   */
  updateSettings(updates: Partial<GameAudioSettings>): GameAudioSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    setItem(STORAGE_KEY_AUDIO_SETTINGS, updated);

    // Apply live volume if BGM is currently playing
    if (this.currentBgmSound) {
      if (!updated.bgmEnabled) {
        this.stopBGM();
      } else {
        this.currentBgmSound.setVolumeAsync(updated.bgmVolume).catch(() => {});
      }
    }

    return updated;
  }

  /**
   * Play looped background music for a game or screen.
   */
  async playBGM(context: 'hub' | 'scramble' | 'books_sort' | 'crossword' | 'trivia' | keyof typeof AUDIO_ASSETS | BgmTrackTheme): Promise<void> {
    const settings = this.getSettings();
    if (!settings.bgmEnabled) {
      await this.stopBGM();
      return;
    }

    await this.ensureAudioMode();

    // Determine track to play
    let chosenTrackKey: keyof typeof AUDIO_ASSETS = 'galaxy';
    if (settings.bgmTrackTheme !== 'auto' && AUDIO_ASSETS[settings.bgmTrackTheme as keyof typeof AUDIO_ASSETS]) {
      chosenTrackKey = settings.bgmTrackTheme as keyof typeof AUDIO_ASSETS;
    } else if (GAME_TRACK_MAP[context]) {
      chosenTrackKey = GAME_TRACK_MAP[context];
    } else if (AUDIO_ASSETS[context as keyof typeof AUDIO_ASSETS]) {
      chosenTrackKey = context as keyof typeof AUDIO_ASSETS;
    }

    // Don't reload if already playing the exact track
    if (this.currentBgmSound && this.currentTrackName === chosenTrackKey) {
      return;
    }

    try {
      await this.stopBGM();

      const source = AUDIO_ASSETS[chosenTrackKey] || AUDIO_ASSETS.galaxy;
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          isLooping: true,
          volume: settings.bgmVolume,
          shouldPlay: true,
        }
      );

      this.currentBgmSound = sound;
      this.currentTrackName = chosenTrackKey;
    } catch (e) {
      console.warn('GameAudioService: Error playing BGM track', chosenTrackKey, e);
    }
  }

  /**
   * Stop currently playing background music.
   */
  async stopBGM(): Promise<void> {
    if (this.currentBgmSound) {
      try {
        await this.currentBgmSound.stopAsync();
        await this.currentBgmSound.unloadAsync();
      } catch {
        // Sound may have already unloaded
      }
      this.currentBgmSound = null;
      this.currentTrackName = null;
    }
  }

  /**
   * Play short sound effect.
   */
  private async playSFX(source: any, volumeScale: number = 1.0): Promise<void> {
    const settings = this.getSettings();
    if (!settings.sfxEnabled) return;

    await this.ensureAudioMode();
    try {
      const volume = Math.min(1.0, settings.sfxVolume * volumeScale);
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          volume,
          shouldPlay: true,
        }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (e) {
      console.warn('GameAudioService: Error playing SFX', e);
    }
  }

  /**
   * Cute SFX: Tap tile / bubble pop on swipe
   */
  async playTapSound(): Promise<void> {
    await this.playSFX(AUDIO_ASSETS.pop, 0.7);
  }

  /**
   * Cute SFX: Star coin twinkle on word found or correct answer
   */
  async playSuccessSound(): Promise<void> {
    await this.playSFX(AUDIO_ASSETS.star, 0.9);
  }

  /**
   * Cute SFX: Joyful level clear victory fanfare
   */
  async playVictoryFanfare(): Promise<void> {
    await this.playSFX(AUDIO_ASSETS.fanfare, 0.95);
  }

  /**
   * Cute SFX: Playful cartoon boing on invalid move
   */
  async playWarningSound(): Promise<void> {
    await this.playSFX(AUDIO_ASSETS.boing, 0.65);
  }
}

export const GameAudioService = new GameAudioServiceImpl();
