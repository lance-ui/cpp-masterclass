import { useEffect, useState } from "react";
import { readStoredValue, writeStoredValue } from "@/utils/storage";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#0b0f14" : "#f4f1e8");
}

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = readStoredValue("dark-mode", getSystemTheme(), isBoolean);
    applyTheme(stored);
    return stored;
  });

  useEffect(() => {
    applyTheme(isDarkMode);
    writeStoredValue("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode: () => setIsDarkMode((v) => !v) };
}
