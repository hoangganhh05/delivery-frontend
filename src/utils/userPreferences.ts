import type { UserSettings } from "../types/account";

type VisualPreferences = Pick<UserSettings, "theme" | "accentColor" | "language">;

let systemThemeMedia: MediaQueryList | null = null;
let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

function resolveTheme(theme: VisualPreferences["theme"]): "light" | "dark" {
  if (theme === "DARK") return "dark";
  if (theme === "LIGHT") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyUserPreferences(settings?: VisualPreferences | null) {
  const root = document.documentElement;

  if (systemThemeMedia && systemThemeListener) {
    systemThemeMedia.removeEventListener("change", systemThemeListener);
  }
  systemThemeMedia = null;
  systemThemeListener = null;

  if (!settings) {
    root.dataset.userTheme = "light";
    root.lang = "vi";
    root.style.removeProperty("--user-accent-color");
    return;
  }

  root.dataset.userTheme = resolveTheme(settings.theme);
  root.lang = settings.language;
  root.style.setProperty("--user-accent-color", settings.accentColor);

  if (settings.theme === "SYSTEM") {
    systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    systemThemeListener = (event) => {
      root.dataset.userTheme = event.matches ? "dark" : "light";
    };
    systemThemeMedia.addEventListener("change", systemThemeListener);
  }
}
