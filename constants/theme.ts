/**
 * Theme colors derived from COLORS (constants/colors.ts).
 * Canonical palette: use COLORS in app screens. This file exists for
 * useThemeColor, ThemedView, ThemedText, and Collapsible only.
 */

import { Platform } from "react-native";
import { COLORS } from "./colors";

export const Colors = {
  light: {
    text: COLORS.textPrimary,
    background: COLORS.background,
    tint: COLORS.primary,
    icon: COLORS.textMuted,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.dark.textPrimary,
    background: COLORS.dark.background,
    tint: COLORS.primaryContrast,
    icon: COLORS.dark.textSecondary,
    tabIconDefault: COLORS.dark.textSecondary,
    tabIconSelected: COLORS.primaryContrast,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
