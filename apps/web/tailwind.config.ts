import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "text-secondary": "var(--text-secondary)",
        teal: "var(--teal)",
        "teal-wash": "var(--teal-wash)",
        emerald: "var(--emerald)",
        amber: "var(--amber)",
        rose: "var(--rose)",
        brass: "var(--brass)",
      },
      borderRadius: { card: "var(--radius-card)" },
      boxShadow: { soft: "var(--shadow-soft)" },
      spacing: { grid: "var(--space-grid)" },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-ui)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
} satisfies Config;
