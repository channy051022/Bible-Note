import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/Colors';
import { getItem, setItem, StorageKeys } from '../utils/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => {
    return getItem<ThemeMode>(StorageKeys.THEME_MODE, 'system');
  });

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return deviceColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, deviceColorScheme]);

  const colors = useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    setItem(StorageKeys.THEME_MODE, newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    const isDark = false;
    return {
      mode: 'light',
      isDark,
      colors: Colors.light,
      setThemeMode: () => {},
    };
  }
  return context;
}
