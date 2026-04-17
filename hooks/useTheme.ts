import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildColors, Colors, THEMES, ColorTheme, COMPLETED_COLORS, CompletedColor,
         FAILED_COLORS, FailedColor,
         THEME_KEY, COLOR_THEME_KEY, COMPLETED_COLOR_KEY, FAILED_COLOR_KEY } from '../constants';

export type Theme = 'dark' | 'light';
export { Colors, ColorTheme, CompletedColor, FailedColor };

export function useTheme() {
  const [theme, setTheme]               = useState<Theme>('dark');
  const [colorTheme, setColorThemeState]= useState<ColorTheme>('persona');
  const [completedColor, setCompletedColorState] = useState<CompletedColor>('green');
  const [failedColor, setFailedColorState]       = useState<FailedColor>('crimsonRed');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(COLOR_THEME_KEY),
      AsyncStorage.getItem(COMPLETED_COLOR_KEY),
      AsyncStorage.getItem(FAILED_COLOR_KEY),
    ]).then(([t, c, cc, fc]) => {
      if (t === 'light' || t === 'dark') setTheme(t);
      if (c && c in THEMES) setColorThemeState(c as ColorTheme);
      if (cc && cc in COMPLETED_COLORS) setCompletedColorState(cc as CompletedColor);
      if (fc && fc in FAILED_COLORS) setFailedColorState(fc as FailedColor);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  }, [theme]);

  const setColorTheme = useCallback(async (ct: ColorTheme) => {
    setColorThemeState(ct);
    await AsyncStorage.setItem(COLOR_THEME_KEY, ct);
  }, []);

  const setCompletedColor = useCallback(async (cc: CompletedColor) => {
    setCompletedColorState(cc);
    await AsyncStorage.setItem(COMPLETED_COLOR_KEY, cc);
  }, []);

  const setFailedColor = useCallback(async (fc: FailedColor) => {
    setFailedColorState(fc);
    await AsyncStorage.setItem(FAILED_COLOR_KEY, fc);
  }, []);

  const { accent, accentDark } = THEMES[colorTheme];
  const { hex: cHex, glow: cGlow } = COMPLETED_COLORS[completedColor];
  const { hex: fHex, glow: fGlow } = FAILED_COLORS[failedColor];
  const colors: Colors = buildColors(theme === 'dark', accent, accentDark, cHex, cGlow, fHex, fGlow);

  return {
    theme, colors, toggleTheme, isDark: theme === 'dark',
    colorTheme, setColorTheme,
    completedColor, setCompletedColor,
    failedColor, setFailedColor,
  };
}
