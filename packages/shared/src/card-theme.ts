export type CardTheme =
  | "auto" | "emerald" | "ocean" | "sunset" | "lavender" | "slate" | "rose"
  | "midnight" | "aurora" | "ember" | "neon" | "obsidian";
export type BackgroundStyle = "mesh" | "grain" | "static" | "neuro" | "metaballs" | "godrays" | "swirl" | "waves";
export type GlareStyle = "standard" | "holographic" | "prismatic";
export type CardMaterial = "default" | "glass" | "metallic" | "holo";

export interface CardPreferences {
  theme?: CardTheme;
  backgroundStyle?: BackgroundStyle;
  displayName?: string;
  enableTilt?: boolean;
  enableGlare?: boolean;
  glareStyle?: GlareStyle;
  material?: CardMaterial;
}

export const CARD_PREFERENCE_DEFAULTS: Required<CardPreferences> = {
  theme: "auto",
  backgroundStyle: "mesh",
  displayName: "",
  enableTilt: true,
  enableGlare: true,
  glareStyle: "standard",
  material: "default",
};

export type BudgetStatus = "safe" | "close" | "low" | "over";

export interface ThemePreset {
  label: string;
  colors: string[];
  swatch: string;
  textMode?: "dark";
}

const FREE_THEME_PRESETS: Record<string, ThemePreset> = {
  emerald: { label: "Emerald", colors: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"], swatch: "#34d399" },
  ocean: { label: "Ocean", colors: ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa"], swatch: "#60a5fa" },
  sunset: { label: "Sunset", colors: ["#fef3c7", "#fde68a", "#fcd34d", "#f59e0b"], swatch: "#f59e0b" },
  lavender: { label: "Lavender", colors: ["#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa"], swatch: "#a78bfa" },
  slate: { label: "Slate", colors: ["#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8"], swatch: "#94a3b8" },
  rose: { label: "Rose", colors: ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"], swatch: "#fb7185" },
};

const PRO_THEME_PRESETS: Record<string, ThemePreset> = {
  midnight: { label: "Midnight", colors: ["#1e1b4b", "#312e81", "#4338ca", "#6366f1"], swatch: "#6366f1", textMode: "dark" },
  aurora: { label: "Aurora", colors: ["#042f2e", "#065f46", "#059669", "#34d399"], swatch: "#34d399", textMode: "dark" },
  ember: { label: "Ember", colors: ["#451a03", "#7c2d12", "#c2410c", "#f59e0b"], swatch: "#f59e0b", textMode: "dark" },
  neon: { label: "Neon", colors: ["#0c0a1a", "#1e1b4b", "#06b6d4", "#e879f9"], swatch: "#e879f9", textMode: "dark" },
  obsidian: { label: "Obsidian", colors: ["#18181b", "#27272a", "#3f3f46", "#a1a1aa"], swatch: "#a1a1aa", textMode: "dark" },
};

export const THEME_PRESETS = {
  ...FREE_THEME_PRESETS,
  ...PRO_THEME_PRESETS,
} as Record<Exclude<CardTheme, "auto">, ThemePreset>;

export const PRO_THEMES: CardTheme[] = ["midnight", "aurora", "ember", "neon", "obsidian"];
export const PRO_BACKGROUNDS: BackgroundStyle[] = ["neuro", "metaballs", "godrays", "swirl", "waves"];
export const PRO_MATERIALS: CardMaterial[] = ["glass", "metallic", "holo"];

export function isProFeature(key: keyof CardPreferences, value: unknown): boolean {
  switch (key) {
    case "theme": return PRO_THEMES.includes(value as CardTheme);
    case "backgroundStyle": return PRO_BACKGROUNDS.includes(value as BackgroundStyle);
    case "glareStyle": return value === "prismatic";
    case "material": return PRO_MATERIALS.includes(value as CardMaterial);
    default: return false;
  }
}

export function isDarkTheme(theme: CardTheme): boolean {
  if (theme === "auto") return false;
  return THEME_PRESETS[theme]?.textMode === "dark";
}

const STATUS_COLORS: Record<BudgetStatus, string[]> = {
  safe: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"],
  close: ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24"],
  low: ["#ffedd5", "#fed7aa", "#fdba74", "#fb923c"],
  over: ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"],
};

const NEUTRAL_COLORS = ["#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e"];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function blendColorArrays(base: string[], target: string[], factor: number): string[] {
  return base.map((c, i) => lerpColor(c, target[i] ?? c, factor));
}

export function getThemeColors(
  theme: CardTheme,
  status: BudgetStatus,
  isBudgetMode: boolean
): string[] {
  if (!isBudgetMode) {
    if (theme === "auto") return NEUTRAL_COLORS;
    return THEME_PRESETS[theme].colors;
  }

  if (theme === "auto") return STATUS_COLORS[status];

  const preset = THEME_PRESETS[theme];
  if (status === "low") return blendColorArrays(preset.colors, STATUS_COLORS.low, 0.3);
  if (status === "over") return blendColorArrays(preset.colors, STATUS_COLORS.over, 0.6);
  return preset.colors;
}

export function getGreeting(displayName: string): string {
  const hour = new Date().getHours();
  let timeOfDay: string;
  if (hour >= 5 && hour < 12) timeOfDay = "Good morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "Good afternoon";
  else if (hour >= 17 && hour < 21) timeOfDay = "Good evening";
  else timeOfDay = "Good night";
  return `${timeOfDay}, ${displayName}`;
}
