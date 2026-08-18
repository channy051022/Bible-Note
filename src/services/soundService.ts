import { Audio } from 'expo-av';

let alarmSoundObject: Audio.Sound | null = null;
let previewSoundObject: Audio.Sound | null = null;

const SOUND_ASSETS: Record<string, any> = {
  chimes: require('../../assets/spiritual_chimes.wav'),
  harp: require('../../assets/morning_harp.wav'),
  piano: require('../../assets/peaceful_piano.wav'),
  fanfare: require('../../assets/gospel_fanfare.wav'),
  cathedral: require('../../assets/cathedral_bells.wav'),
};

export const BUILT_IN_RINGTONES = [
  {
    id: 'chimes',
    title: '🕊️ Heavenly Chimes',
    description: 'Peaceful cathedral bell arpeggio',
    assetKey: 'chimes' as const,
  },
  {
    id: 'harp',
    title: '🌅 Morning Harp & Strings',
    description: 'Gentle acoustic morning worship',
    assetKey: 'harp' as const,
  },
  {
    id: 'piano',
    title: '🎹 Peaceful Piano Hymn',
    description: 'Soft, serene piano melody',
    assetKey: 'piano' as const,
  },
  {
    id: 'fanfare',
    title: '🎺 Gospel Fanfare',
    description: 'Joyful spiritual awakening fanfare',
    assetKey: 'fanfare' as const,
  },
  {
    id: 'cathedral',
    title: '🔔 Cathedral Tower Bells',
    description: 'Deep resonant church tower chimes',
    assetKey: 'cathedral' as const,
  },
];

export const SoundService = {
  /**
   * Plays the looping spiritual chime or custom music alarm ringtone
   */
  async playAlarmRingtone(ringtoneId?: string, customUri?: string) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      await this.stopAlarmRingtone();
      await this.stopPreview();

      let source: any;
      if (customUri) {
        source = { uri: customUri };
      } else {
        const key = ringtoneId && SOUND_ASSETS[ringtoneId] ? ringtoneId : 'chimes';
        source = SOUND_ASSETS[key];
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      alarmSoundObject = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('Error playing alarm ringtone:', e);
    }
  },

  /**
   * Previews a ringtone or custom music track briefly
   */
  async previewRingtone(ringtoneId?: string, customUri?: string) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      await this.stopPreview();

      let source: any;
      if (customUri) {
        source = { uri: customUri };
      } else {
        const key = ringtoneId && SOUND_ASSETS[ringtoneId] ? ringtoneId : 'chimes';
        source = SOUND_ASSETS[key];
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      previewSoundObject = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('Error previewing ringtone:', e);
    }
  },

  /**
   * Stops preview audio
   */
  async stopPreview() {
    try {
      if (previewSoundObject) {
        await previewSoundObject.stopAsync();
        await previewSoundObject.unloadAsync();
        previewSoundObject = null;
      }
    } catch (e) {
      console.warn('Error stopping preview:', e);
    }
  },

  /**
   * Stops and unloads the alarm ringtone
   */
  async stopAlarmRingtone() {
    try {
      await this.stopPreview();
      if (alarmSoundObject) {
        await alarmSoundObject.stopAsync();
        await alarmSoundObject.unloadAsync();
        alarmSoundObject = null;
      }
    } catch (e) {
      console.warn('Error stopping alarm ringtone:', e);
    }
  },
};
