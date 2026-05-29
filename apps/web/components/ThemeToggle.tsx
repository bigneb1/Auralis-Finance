"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/** Sun/moon theme toggle. Reads the theme set by the no-flash script on <html>,
 *  flips data-theme, and persists to localStorage. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer to avoid setState-synchronously-in-effect; reads the theme the
    // no-flash script already applied to <html>.
    const id = window.setTimeout(() => {
      setTheme((document.documentElement.dataset.theme as Theme) || "light");
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("auralis-theme", next); } catch { /* ignore */ }
    setTheme(next);
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--teal)] hover:text-[var(--teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)] ${className}`}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch */}
      {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
