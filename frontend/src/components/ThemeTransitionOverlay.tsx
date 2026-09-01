import { useTheme } from "../context/ThemeContext";

export function ThemeTransitionOverlay() {
  const { isAnimating, direction, theme } = useTheme();

  if (!isAnimating) return null;

  // The curtain is painted in the OLD theme's colors and retreats as the
  // car passes, uncovering the page (already flipped to the new theme
  // underneath). Going dark: curtain is the light bg. Going light: curtain
  // is the dark bg.
  const curtainBg = theme === "dark" ? "#F7F8FA" : "#0B0D10";
  const isLtr = direction === "ltr";

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <div
        className={isLtr ? "theme-wipe-ltr" : "theme-wipe-rtl"}
        style={{ position: "absolute", inset: 0, background: curtainBg }}
      />
      <div
        className={isLtr ? "theme-car-ltr" : "theme-car-rtl"}
        style={{ position: "absolute", top: "50%", marginTop: -22, [isLtr ? "left" : "right"]: "-12%" as any }}
      >
        <CarGlyph flipped={!isLtr} dark={theme === "dark"} />
      </div>
    </div>
  );
}

function CarGlyph({ flipped, dark }: { flipped: boolean; dark: boolean }) {
  return (
    <div style={{ position: "relative", width: 96, height: 44, transform: flipped ? "scaleX(-1)" : undefined }}>
      {/* headlight glow, only lit once dark mode is the active/incoming theme */}
      {dark && (
        <div
          className="theme-headlight"
          style={{
            position: "absolute",
            right: -34,
            top: 10,
            width: 46,
            height: 20,
            background: "radial-gradient(ellipse at left, rgba(255,224,150,0.9), rgba(255,224,150,0) 70%)",
            filter: "blur(1px)",
          }}
        />
      )}
      <svg width="96" height="44" viewBox="0 0 96 44" fill="none">
        <ellipse cx="48" cy="40" rx="40" ry="3" fill="black" opacity="0.12" />
        <path
          d="M10 30 L14 18 Q17 12 26 12 L64 12 Q72 12 76 18 L82 26 L88 27 Q92 28 92 32 L92 33 L6 33 L6 32 Q6 30 10 30 Z"
          fill="#F1600B"
        />
        <path d="M22 18 L28 18 L26 27 L18 27 Z" fill="#FFE8DA" opacity="0.85" />
        <path d="M32 18 L60 18 L62 27 L30 27 Z" fill="#FFE8DA" opacity="0.85" />
        <circle cx="24" cy="33" r="6.5" fill="#1A1D22" />
        <circle cx="24" cy="33" r="2.6" fill="#8A8F98" />
        <circle cx="72" cy="33" r="6.5" fill="#1A1D22" />
        <circle cx="72" cy="33" r="2.6" fill="#8A8F98" />
        <rect x="84" y="19" width="5" height="4" rx="1" fill="#FFE0A3" />
      </svg>
    </div>
  );
}
