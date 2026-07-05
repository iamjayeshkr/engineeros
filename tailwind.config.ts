import type { Config } from "tailwindcss";

// Design tokens — see /styles/tokens.md for rationale.
// Base: near-black zinc scale (Linear/Vercel-style density).
// Signature accent: indigo (#6E56CF) — used ONLY for primary actions & focus states.
// Secondary accent: amber (#F5A524) — reserved for streaks/gamification, never mixed with indigo in one component.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0A0A0B",
          900: "#141416",
          800: "#1C1C1F",
          700: "#27272A",
          600: "#3F3F46",
        },
        accent: {
          DEFAULT: "#6E56CF",
          soft: "#2A2350",
          muted: "#9B8AFB",
        },
        streak: {
          DEFAULT: "#F5A524",
          soft: "#3A2A0D",
        },
        success: "#3DD68C",
        danger: "#F2555A",
        border: "#242428",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
