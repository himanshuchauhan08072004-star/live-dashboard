/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "var(--color-bg)",
          card: "var(--color-card)",
          border: "var(--color-border)",
          text: "var(--color-text)",
          muted: "var(--color-muted)",
        },
        accent: {
          DEFAULT: "#F1600B",
          soft: "var(--color-accent-soft)",
          dark: "#C24A05",
        },
        status: {
          pending: "#8B5CF6",
          assigned: "#3B82F6",
          otw: "#0EA5E9",
          progress: "#F1600B",
          completed: "#16A34A",
          cancelled: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 1px rgba(16,24,40,0.03)",
      },
      keyframes: {
        "car-drive-ltr": {
          "0%": { transform: "translateX(-15vw)" },
          "100%": { transform: "translateX(115vw)" },
        },
        "car-drive-rtl": {
          "0%": { transform: "translateX(115vw) scaleX(-1)" },
          "100%": { transform: "translateX(-15vw) scaleX(-1)" },
        },
        "wipe-ltr": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
        "wipe-rtl": {
          "0%": { clipPath: "inset(0 0 0 100%)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
      },
      animation: {
        "car-drive-ltr": "car-drive-ltr 1000ms cubic-bezier(0.65,0,0.35,1) forwards",
        "car-drive-rtl": "car-drive-rtl 1000ms cubic-bezier(0.65,0,0.35,1) forwards",
        "wipe-ltr": "wipe-ltr 1000ms cubic-bezier(0.65,0,0.35,1) forwards",
        "wipe-rtl": "wipe-rtl 1000ms cubic-bezier(0.65,0,0.35,1) forwards",
      },
    },
  },
  plugins: [],
};
