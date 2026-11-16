import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'clair' | 'sombre';
export const MODES: ThemeMode[] = ['auto', 'clair', 'sombre'];
const KEY = 'pf-theme';

function readSaved(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY) as ThemeMode | null;
    return saved && MODES.includes(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

/** Applique le thème sur <html>. En mode auto, c'est le réglage du système qui décide. */
export function applyTheme(mode: ThemeMode, root: HTMLElement = document.documentElement): void {
  if (mode === 'clair') root.setAttribute('data-theme', 'light');
  else if (mode === 'sombre') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

export function nextMode(mode: ThemeMode): ThemeMode {
  return MODES[(MODES.indexOf(mode) + 1) % MODES.length];
}

export function useTheme(): { mode: ThemeMode; cycle: () => void } {
  const [mode, setMode] = useState<ThemeMode>(readSaved);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((current) => {
      const next = nextMode(current);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* stockage indisponible : le thème reste valable pour la visite en cours */
      }
      return next;
    });
  }, []);

  return { mode, cycle };
}
