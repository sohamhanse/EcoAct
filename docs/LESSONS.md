# Design lessons

- **One source of truth for shadows:** Do not duplicate shadow objects in components. Import and use `SHADOWS.sm` / `SHADOWS.md` / `SHADOWS.lg` from `constants/shadows.ts` so values never drift.
- **One source of truth for colors:** No hex or rgba in screen/component styles. Use COLORS tokens (e.g. primaryContrast for light text on primary, overlay for modal backdrop, primaryBorderSubtle for subtle primary borders).
- **Affordance must match behavior:** If a card looks tappable, it must be Pressable and do something (e.g. navigate). Otherwise reduce its affordance or add a single clear action (e.g. "See all").
- **Copy must match flow:** Onboarding primary/secondary buttons both led to Auth; labels said "Continue with Google" and "Skip to calculator." Updated to "Get started" and "Skip for now" so the next step (sign-in) is not misleading.
- **Accessibility from the start:** Add accessibilityLabel and accessibilityRole to primary CTAs, tabs, list items, and form actions so screen readers and assistive tech are supported without a later pass.
- **Tab labels:** Use title case (e.g. "Global", "Community", "Weekly") for tab text; raw enum values are not presentable.
- **One source of truth for type:** All text styles use TYPOGRAPHY.size (xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl) and TYPOGRAPHY.weight (regular, medium, semibold, bold, extrabold). No raw fontSize or fontWeight in screens or components.
- **One source of truth for theme:** Keep a single palette (COLORS). If theme.ts exists for legacy components (ThemedView, useThemeColor), derive its Colors from COLORS so light/dark never drift from the canonical palette.
- **Spacing and radius from tokens:** Replace magic numbers (e.g. 4, 8, 12, 16, 24, 32, 40) with SPACING and RADIUS so layout is consistent and theming stays predictable.
