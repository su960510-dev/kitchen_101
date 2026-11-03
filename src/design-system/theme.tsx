import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type Colors } from './tokens';

type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

const ThemeContext = createContext<{ colors: Colors; isDark: boolean }>({ colors: lightColors, isDark: false });

export function AppThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = mode === 'DARK' || (mode === 'SYSTEM' && scheme === 'dark');
  const value = useMemo(() => ({ colors: isDark ? darkColors : lightColors, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

/** 모듈 수준에서 정의한 factory 로 색상 의존 스타일을 만든다. */
export function useStyles<T>(factory: (c: Colors) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
