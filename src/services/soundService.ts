import { Audio, AVPlaybackStatus } from 'expo-av';

let alarmSoundObject: Audio.Sound | null = null;
let previewSoundObject: Audio.Sound | null = null;

const SOUND_ASSETS: Record<string, any> = {
  chimes: require('../../assets/spiritual_chimes.wav'),
  sunrise_bell: require('../../assets/radiant_sunrise_bell.wav'),
  fanfare: require('../../assets/gospel_fanfare.wav'),
  cathedral: require('../../assets/cathedral_bells.wav'),
  harp: require('../../assets/morning_harp.wav'),
  piano: require('../../assets/peaceful_piano.wav'),
  classic_bell: require('../../assets/classic_phone_bell.wav'),
  digital_alarm: require('../../assets/digital_alarm_beeps.wav'),
  marimba: require('../../assets/modern_marimba.wav'),
};

export const BUILT_IN_RINGTONES = [
  {
    id: 'classic_bell',
    title: '☎️ Classic Phone Ringing',
    description: 'Traditional loud telephone twin-bell ringing',
    assetKey: 'classic_bell' as const,
  },
  {
    id: 'digital_alarm',
    title: '⏰ Digital Alarm Clock Beeps',
    description: 'Crisp high-pitch 4-beep digital clock buzzer',
    assetKey: 'digital_alarm' as const,
  },
  {
    id: 'marimba',
    title: '🎶 Modern Marimba Chimes',
    description: 'Modern smartphone marimba wake-up melody',
    assetKey: 'marimba' as const,
  },
  {
    id: 'chimes',
    title: '🔔 Energetic Wake Chimes',
    description: 'Bright ascending morning bell melody (Ideal Wake-Up)',
    assetKey: 'chimes' as const,
  },
  {
    id: 'sunrise_bell',
    title: '☀️ Radiant Sunrise Bells',
    description: 'Vibrant harmonic morning alarm pulses',
    assetKey: 'sunrise_bell' as const,
  },
  {
    id: 'fanfare',
    title: '🎺 Joyful Reveille Trumpet',
    description: 'Triumphant morning awakening fanfare',
    assetKey: 'fanfare' as const,
  },
  {
    id: 'cathedral',
    title: '⛪ Cathedral Tower Bells',
    description: 'Deep resonant church tower chimes',
    assetKey: 'cathedral' as const,
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
    description: 'Soft serene acoustic piano melody',
    assetKey: 'piano' as const,
  },
];

export const SoundService = {
  /**
   * Plays the looping spiritual chime or custom music alarm ringtone starting at startOffsetSeconds
   */
  async playAlarmRingtone(
    ringtoneId?: string,
    customUri?: string,
    startOffsetSeconds: number = 0
  ) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      await this.stopAlarmRingtone();
      await this.stopPreview();

      let source: any;
      if (customUri) {
        source = { uri: customUri };
      } else {
        const key = ringtoneId && SOUND_ASSETS[ringtoneId] ? ringtoneId : 'classic_bell';
        source = SOUND_ASSETS[key] || SOUND_ASSETS.classic_bell;
      }

      const startPosMillis = Math.max(0, Math.floor(startOffsetSeconds * 1000));

      try {
        const { sound } = await Audio.Sound.createAsync(
          source,
          {
            shouldPlay: true,
            isLooping: false,
            positionMillis: startPosMillis,
            volume: 1.0,
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              // Rewind to the user's chosen cut/start point and replay in a continuous loop
              sound
                .setPositionAsync(startPosMillis)
                .then(() => {
                  sound.playAsync().catch(() => {});
                })
                .catch(() => {});
            }
          }
        );
        alarmSoundObject = sound;
        await sound.playAsync();
      } catch (assetErr) {
        console.warn('Initial alarm sound source failed, falling back to classic bell:', assetErr);
        // Fallback to built-in classic bell
        const { sound } = await Audio.Sound.createAsync(
          SOUND_ASSETS.classic_bell,
          {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.replayAsync().catch(() => {});
            }
          }
        );
        alarmSoundObject = sound;
        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
      }
    } catch (e) {
      console.warn('Error playing alarm ringtone:', e);
    }
  },

  /**
   * Previews a ringtone or custom music track starting at startOffsetSeconds
   */
  async previewRingtone(
    ringtoneId?: string,
    customUri?: string,
    startOffsetSeconds: number = 0,
    onStatusUpdate?: (status: AVPlaybackStatus) => void
  ): Promise<Audio.Sound | null> {
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
        const key = ringtoneId && SOUND_ASSETS[ringtoneId] ? ringtoneId : 'classic_bell';
        source = SOUND_ASSETS[key] || SOUND_ASSETS.classic_bell;
      }

      const startPosMillis = Math.max(0, Math.floor(startOffsetSeconds * 1000));

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: false,
          positionMillis: startPosMillis,
          volume: 1.0,
        },
        onStatusUpdate
      );

      previewSoundObject = sound;
      await sound.playAsync();
      return sound;
    } catch (e) {
      console.warn('Error previewing ringtone:', e);
      return null;
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
