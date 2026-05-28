export const auralisTokens = {
  ink: "#0B1220",
  paper: "#FBFBF9",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F5F3",
  border: "#E4E6E2",
  textSecondary: "#5B6472",
  teal: "#0E9E8C",
  tealWash: "#EAF6F4",
  emerald: "#0F9D58",
  amber: "#D9870B",
  rose: "#D64550",
  brass: "#B08442",
  radius: "14px",
  spaceGrid: "8px",
  shadow: "0 1px 2px rgba(11,18,32,0.04), 0 4px 12px rgba(11,18,32,0.06)",
} as const;

export const cssVariables = `
:root {
  --ink: ${auralisTokens.ink};
  --paper: ${auralisTokens.paper};
  --surface: ${auralisTokens.surface};
  --surface-muted: ${auralisTokens.surfaceMuted};
  --border: ${auralisTokens.border};
  --text-secondary: ${auralisTokens.textSecondary};
  --teal: ${auralisTokens.teal};
  --teal-wash: ${auralisTokens.tealWash};
  --emerald: ${auralisTokens.emerald};
  --amber: ${auralisTokens.amber};
  --rose: ${auralisTokens.rose};
  --brass: ${auralisTokens.brass};
  --radius-card: ${auralisTokens.radius};
  --space-grid: ${auralisTokens.spaceGrid};
  --shadow-soft: ${auralisTokens.shadow};
  --font-display: var(--font-newsreader), "Newsreader", "Times New Roman", Georgia, serif;
  --font-ui: var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono: var(--font-geist-mono), "Geist Mono", "JetBrains Mono", "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}`;

export const tailwindPreset = {
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
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-ui)"],
        ui: ["var(--font-ui)"],
        mono: ["var(--font-mono)"],
      },
      spacing: { grid: "var(--space-grid)" },
    },
  },
};
