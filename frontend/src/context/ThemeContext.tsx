import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";
type Direction = "ltr" | "rtl";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isAnimating: boolean;
  direction: Direction;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const ANIMATION_MS = 1000;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("vsod_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<Direction>("ltr");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vsod_theme", theme);
  }, [theme]);

  function toggleTheme() {
    if (isAnimating) return;
    const goingDark = theme === "light";
    setDirection(goingDark ? "ltr" : "rtl");
    setIsAnimating(true);
    // Flip the theme right away — the overlay covers the change, so by
    // the time the car finishes crossing the screen, the reveal is real.
    setTheme(goingDark ? "dark" : "light");
    window.setTimeout(() => setIsAnimating(false), ANIMATION_MS);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAnimating, direction }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
