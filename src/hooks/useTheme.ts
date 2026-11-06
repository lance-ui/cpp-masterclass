import { useEffect, useState } from 'react';
import { readStoredValue, writeStoredValue } from '@/utils/storage';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    readStoredValue('dark-mode', getSystemTheme(), isBoolean)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    writeStoredValue('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode: () => setIsDarkMode(value => !value) };
}
