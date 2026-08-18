import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { getThemeColors, ThemeColors } from '../constants/Colors';
import { ThemePresetId } from '../constants/ThemePresets';
import { getItem, setItem, StorageKeys } from '../utils/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  preset: ThemePresetId;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePresetId) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();

  const [mode, setMode] = useState<ThemeMode>(() => {
    return getItem<ThemeMode>(StorageKeys.THEME_MODE, 'dark');
  });

  const [preset, setPreset] = useState<ThemePresetId>(() => {
    return getItem<ThemePresetId>('SHEPHERD_THEME_PRESET', 'celestial');
  });

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return deviceColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, deviceColorScheme]);

  const colors = useMemo(() => {
    return getThemeColors(preset, isDark);
  }, [preset, isDark]);

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    setItem(StorageKeys.THEME_MODE, newMode);
  };

  const setThemePreset = (newPreset: ThemePresetId) => {
    setPreset(newPreset);
    setItem('SHEPHERD_THEME_PRESET', newPreset);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        preset,
        isDark,
        colors,
        setThemeMode,
        setThemePreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    const isDark = true;
    return {
      mode: 'dark',
      preset: 'celestial',
      isDark,
      colors: getThemeColors('celestial', isDark),
      setThemeMode: () => {},
      setThemePreset: () => {},
    };
  }
  return context;
}
