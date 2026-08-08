"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const ThemeContext = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "system",
  setTheme: () => {},
});

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem("skillswap-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem("skillswap-theme", t);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

const ICONS: Record<Theme, React.ReactNode> = {
  dark: <Moon size={16} />,
  light: <Sun size={16} />,
  system: <Monitor size={16} />,
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const cycle = () => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  };
  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-soft transition-all hover:text-foreground hover:shadow-lift",
        className,
      )}
    >
      {ICONS[theme]}
    </button>
  );
}
