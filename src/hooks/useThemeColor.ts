import { useState, useEffect } from "react";

export type ThemeColor = {
  label: string;
  hue: number;
  sat: number;
};

export const THEME_COLORS: ThemeColor[] = [
  { label: "Blue", hue: 210, sat: 100 },
  { label: "Green", hue: 140, sat: 80 },
  { label: "Red", hue: 0, sat: 85 },
  { label: "Orange", hue: 30, sat: 95 },
  { label: "Purple", hue: 270, sat: 80 },
  { label: "Teal", hue: 180, sat: 75 },
  { label: "Pink", hue: 330, sat: 80 },
  { label: "Yellow", hue: 50, sat: 95 },
];

const STORAGE_KEY = "pc_theme_hue";

function applyTheme(hue: number, sat: number) {
  const root = document.documentElement;
  const accent = `${hue} ${sat}% 40%`;
  const accentDark = `${hue} ${Math.round(sat * 0.85)}% 28%`;
  const highlight = `${hue} ${sat}% 46%`;

  root.style.setProperty("--pc-blue", accent);
  root.style.setProperty("--pc-blue-dark", accentDark);
  root.style.setProperty("--pc-highlight", highlight);
  root.style.setProperty("--primary", accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", accent);
  root.style.setProperty("--sidebar-primary", accent);
  root.style.setProperty("--sidebar-ring", accent);
}

export function useThemeColor() {
  const [selected, setSelected] = useState<ThemeColor>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = THEME_COLORS.find((c) => c.hue === Number(saved));
      if (found) return found;
    }
    return THEME_COLORS[0]; // Blue default
  });

  useEffect(() => {
    applyTheme(selected.hue, selected.sat);
    sessionStorage.setItem(STORAGE_KEY, String(selected.hue));
  }, [selected]);

  return { selected, setSelected, colors: THEME_COLORS };
}
