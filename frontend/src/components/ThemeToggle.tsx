import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, isAnimating } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      disabled={isAnimating}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center h-8 w-14 rounded-full border border-base-border transition-colors disabled:cursor-wait ${
        isDark ? "bg-accent-dark" : "bg-base-bg"
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-card transition-transform duration-300 ${
          isDark ? "translate-x-[26px]" : "translate-x-0.5"
        }`}
      >
        {isDark ? <Moon size={13} className="text-accent-dark" /> : <Sun size={13} className="text-amber-500" />}
      </span>
    </button>
  );
}
