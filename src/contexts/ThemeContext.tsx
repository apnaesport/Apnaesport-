
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "apna-esport-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
        if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
          return storedTheme;
        }
      } catch (e) {
        console.error("Error reading theme from localStorage", e);
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark"); // Default to dark

  const applyTheme = useCallback((selectedTheme: Theme) => {
    let currentTheme: "light" | "dark";
    if (selectedTheme === "system") {
      currentTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } else {
      currentTheme = selectedTheme;
    }
    setResolvedTheme(currentTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(currentTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      window.localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }
    setThemeState(newTheme);
  };
  
  // Effect to set initial theme based on localStorage or system preference
  // This runs once on mount
  useEffect(() => {
    let initialTheme: Theme = defaultTheme;
    try {
        const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
        if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
            initialTheme = storedTheme;
        }
    } catch (e) {
        //
    }
    setThemeState(initialTheme); // Set the theme state
    applyTheme(initialTheme); // Apply the class immediately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
