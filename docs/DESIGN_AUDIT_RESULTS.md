# EcoAct — Design Audit Results

**Audit date:** 2025-02-21  
**Scope:** Visual design, layout, spacing, typography, color, components, responsiveness, accessibility. No changes to application logic, APIs, or features.  
**Reference:** Design audit protocol (Jobs/Ive philosophy); DESIGN_SYSTEM / APP_FLOW / PRD / LESSONS not present — audit derived from `constants/`, all screens, and shared components.

---

## Overall Assessment

The app has a clear token foundation (COLORS, SPACING, RADIUS in `constants/`) and consistent use of primary green and surface/border patterns. Visual hierarchy is diluted by hardcoded typography and spacing, duplicate shadow definitions, a second unused theme file, and no use of TYPOGRAPHY tokens. Several screens feel dense; empty and loading states are inconsistent; there is no accessibility layer. Fixing token usage, one source of truth for shadows and type, and a pass on hierarchy and rhythm will make the experience feel inevitable and calm without changing behavior.

---

## PHASE 1 — Critical

*(Visual hierarchy, usability, responsiveness, or consistency issues that actively hurt the experience.)*

| Screen/Component | What's wrong | What it should be | Why it matters |
|------------------|--------------|-------------------|----------------|
| **SplashScreen** | Logo circle shows "ET" (EcoTrack remnant); app is EcoAct. | Logo text: "EA" or wordmark "EcoAct" only. | Brand consistency; first impression is wrong. |
| **SplashScreen** | Hardcoded colors: `#ecfdf5`, `#d1fae5` for text. | Use COLORS only (e.g. add `primaryContrast` / `primaryContrastMuted` to design system if needed, or use existing light-on-primary tokens). | Every color must reference the system; no hex in screens. |
| **OnboardingScreen** | Primary button label "Continue with Google" and secondary "Skip to calculator" — both actions go to Auth; user may expect calculator. | Primary: "Get started" or "Continue"; secondary: "Skip for now" (both lead to Auth). Clarify in copy that next step is sign-in. | Reduces confusion and broken mental model. |
| **AppNavigator** | `contentStyle: { backgroundColor: "#F7FAF8" }` hardcoded. | `contentStyle: { backgroundColor: COLORS.background }` (import COLORS). | Stack background must use design token. |
| **HomeScreen** | Mission cards (Today's missions) are non-interactive `View`s; look like cards but don’t tap. | Either make cards Pressable → navigate to Missions tab or to mission detail, or reduce visual affordance (e.g. "See all" link only, cards clearly summary-only). | Affordance must match behavior so the interface is honest. |
| **HomeScreen** | Community card border: `COLORS.primary + "40"` — string concat for alpha. | Use a token (e.g. `primaryBorderSubtle` in COLORS) or a small util; no string concat in styles. | Prevents fragile styling and keeps tokens as single source of truth. |
| **CalculatorScreen (result)** | Breakdown rows use raw `<Text>` with no shared list/card styling; feels disconnected from rest of app. | Use same card/surface pattern as elsewhere (background, padding, radius from RADIUS); breakdown rows with consistent spacing (SPACING). | Consistency with rest of app and clearer hierarchy. |
| **LeaderboardScreen** | Tab labels shown as raw "global" | "community" | "weekly". | Capitalize or title-case: "Global" | "Community" | "Weekly". | Readable, presentable labels. |
| **LeaderboardScreen** | `borderRadius: 8` and `paddingVertical: 8`, `paddingHorizontal: 16` hardcoded in tabs/row. | Use RADIUS.sm (8), SPACING.sm (8), SPACING.base (16). | All spacing and radius from design system. |
| **CommunityScreen** | Section title "THIS WEEK'S CHALLENGE" — 12px, all caps, very low visual weight. | Section title uses TYPOGRAPHY (or agreed title size) and consistent casing (e.g. "This week's challenge"); sufficient contrast and spacing. | Section headers must be part of clear hierarchy. |
| **ProfileScreen** | Badge grid uses `width: "30%"` and `minWidth: 90` — magic numbers. | Use design token for card min-width and grid (e.g. SPACING or a component token); avoid raw % without system. | Layout predictability and future theming. |
| **Shadows** | `ChallengeCard`, `StatsTileRow`, `MilestoneCard`, `OffsetSection` each define local `shadowMd` / `shadowSm` with same values as `constants/shadows.ts`. | Import and use SHADOWS.md and SHADOWS.lg from `constants/shadows.ts` everywhere; remove duplicate shadow objects. | One source of truth; no drift. |
| **Accessibility** | No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` anywhere. | Add at least to: primary CTAs, tab bar items, form controls (Calculator steps), list items (missions, leaderboard, communities). | Screen readers and assistive tech; baseline a11y. |

**Phase 1 review:** These items fix incorrect branding, misleading copy, broken affordances, and token violations that directly affect trust and usability. Addressing them first makes the app coherent and then refinable.

---

## PHASE 2 — Refinement

*(Spacing, typography, color, alignment, iconography adjustments that elevate the experience.)*

| Screen/Component | What's wrong | What it should be | Why it matters |
|------------------|--------------|-------------------|----------------|
| **Typography** | `constants/typography.ts` (TYPOGRAPHY) exists but is never used; every screen uses raw `fontSize`, `fontWeight`. | All text styles reference TYPOGRAPHY.size (e.g. base, md, lg) and TYPOGRAPHY.weight; introduce a small set of semantic styles (e.g. heading1, heading2, body, caption) if needed. | Single typographic scale; calm, consistent hierarchy. |
| **Theme duplication** | `constants/theme.ts` (Colors, Fonts) coexists with `constants/colors.ts` (COLORS); theme.ts not used in app screens. | Remove or merge: one palette (COLORS) and one typography source (TYPOGRAPHY); delete or refactor theme.ts so it doesn’t conflict. | No competing systems; one design language. |
| **SplashScreen** | Logo circle size 94, font 34 — magic numbers. | Use SPACING/radius and TYPOGRAPHY (e.g. TYPOGRAPHY.size["3xl"] for logo mark). | Tokens drive all dimensions. |
| **OnboardingScreen** | Hero and slide titles use raw 28, 22, 15; button labels 16, 15. | Map to TYPOGRAPHY (e.g. xl, lg, base) and weights. | Rhythm and hierarchy. |
| **AuthScreen** | Title 24, subtitle 15, button 16/14 — mixed. | TYPOGRAPHY-based; primary action (Google) clearly dominant. | Clear primary action; consistent type scale. |
| **HomeScreen** | Greeting 22, hero value 28, section titles 17, stat value 20 — many sizes. | Reduce to 3–4 type levels (e.g. page title, card title, body, caption) from TYPOGRAPHY. | Eye lands on one hero number; rest supports. |
| **HomeScreen** | Stats row (Points, Streak, Rank) equal visual weight. | Slightly emphasize one (e.g. Rank or Streak) if it’s the primary differentiator, or keep equal but ensure spacing/breathing room is consistent. | Hierarchy matches product intent. |
| **CalculatorScreen** | Question text 18, value 24, hint 12 — all ad hoc. | TYPOGRAPHY.size for question, value, hint; consistent vertical rhythm (SPACING) between steps. | Calm, scannable flow. |
| **MissionsScreen** | Card accent 4px; filter chip padding 6/12. | Use SPACING.xs (4), SPACING.sm (8), SPACING.md (12) from tokens. | Spacing rhythm. |
| **LeaderboardScreen** | Avatar 40, rank width 28 — magic numbers. | SPACING / component tokens (e.g. avatar size as token or 40 from system). | Consistency. |
| **CommunityHeroBanner** | Uses `#fff`, `rgba(255,255,255,0.9)`, `borderRadius: 16`. | COLORS (e.g. surfaceOnPrimary, surfaceOnPrimaryMuted) and RADIUS.lg (16). | Token-only styling. |
| **OffsetSection** | `indiaBadgeText` color `#fff`; multiple raw font sizes. | COLORS for on-primary text; TYPOGRAPHY for all text. | Consistency with rest of app. |
| **Icons** | Mix of Ionicons (tabs, Profile, CommunityHeroBanner) and emoji (🌿, 📤, 🎉, 🏆, 👥, 🔒). | Decide: either systematic icon set (Ionicons) for UI, with emoji only for celebration/copy, or document emoji as first-class and use consistently. | Cohesive icon language. |
| **Modals / sheets** | Overlay `rgba(0,0,0,0.5)` in Missions, ChallengeCompletionModal, ShareBottomSheet. | Token e.g. COLORS.overlay or overlayOpacity in DESIGN_SYSTEM. | Consistent overlay treatment. |

**Phase 2 review:** Typography and spacing from tokens, plus removal of duplicate theme and hardcoded values, create a single design language. Doing this after Phase 1 ensures we’re refining a correct base.

---

## PHASE 3 — Polish

*(Micro-interactions, transitions, empty states, loading states, error states, and subtle details that make it feel premium.)*

| Screen/Component | What's wrong | What it should be | Why it matters |
|------------------|--------------|-------------------|----------------|
| **Empty states** | Leaderboard: centered block. Home: inline "Complete missions to unlock milestones". Community: inline "You haven't joined...". Profile: inline "No footprint logs yet". | Single empty-state pattern: one illustration or icon, one line of copy, one primary action (e.g. "Complete a mission" / "Join a community" / "Use Calculator"). Same vertical rhythm and padding (SPACING). | Blank states feel intentional and guide next step. |
| **Loading states** | ActivityIndicator with inline `style={{ marginVertical: SPACING.lg }}` or `marginTop` in multiple screens; no skeletons. | Consistent loading placement (e.g. centered in content area); optional skeleton for lists (missions, leaderboard, communities) if tech stack allows. | App feels alive while waiting; no layout jump. |
| **Error states** | Auth shows inline error text; Missions/Leaderboard/Community on load failure show empty list with no error message. | Auth: keep inline but ensure style uses design tokens. Lists: on fetch error show a single error state (message + retry) instead of silent empty. | User understands failure and can retry. |
| **Focus / pressed states** | Pressable used throughout; no consistent feedback (opacity or scale). | Standard pressed style (e.g. opacity 0.8 or scale 0.98) for primary/secondary buttons and cards; ensure touch targets ≥ 44pt. | Responsive, confident touch feedback. |
| **Modal transitions** | `animationType="fade"` or `"slide"` — default. | Keep default or align with one pattern (e.g. fade for overlays, slide for bottom sheets); document in guidelines. | Motion feels intentional, not random. |
| **Tab bar** | `tabBarLabelStyle: { fontSize: 11 }` — hardcoded. | TYPOGRAPHY.size.xs (11) or design token for tab label. | Typography system extends to nav. |
| **Calculator progress** | 4px progress bar; minimal. | Consider slightly increased height (e.g. 6px) and/or corner radius from RADIUS for visibility; still minimal. | Progress is clear without dominating. |
| **Community "Leave"** | Text-only, danger color — easy to tap by mistake. | Keep danger color; consider secondary button style (outline or text) so it doesn’t compete with primary actions. | Destructive action is clear but not dominant. |
| **Dark mode** | COLORS.dark exists but is not used in app. | If dark mode is in scope: all screens and components use theme-aware tokens (e.g. COLORS.background, COLORS.textPrimary from active theme). If out of scope: note in DESIGN_SYSTEM and leave COLORS.dark for future use. | Theming is consistent or explicitly deferred. |

**Phase 3 review:** After hierarchy and tokens are correct, empty/loading/error and interaction polish make the app feel considered and reliable. Dark mode is either implemented against tokens or explicitly out of scope.

---

## DESIGN_SYSTEM (.md) UPDATES REQUIRED

- **Add semantic color tokens** (if not present): `primaryContrast` (light text on primary), `primaryContrastMuted`, `overlay` (e.g. `rgba(0,0,0,0.5)`), and `primaryBorderSubtle` (primary with alpha for borders). Document in DESIGN_SYSTEM before use in Phase 1/2.
- **Typography:** Document that all UI text must use TYPOGRAPHY.size and TYPOGRAPHY.weight; optionally add semantic names (heading1, heading2, body, caption) mapped to size/weight. Add tab bar label size token if needed.
- **Shadows:** Document that only `constants/shadows.ts` (SHADOWS.sm, SHADOWS.md, SHADOWS.lg) may be used; no inline or component-local shadow objects.
- **Spacing/radius:** Confirm RADIUS.sm = 8 is the standard for chips, tabs, small buttons; RADIUS.md/lg for cards. Document minimum touch target (e.g. 44pt) for interactive elements.
- **Create DESIGN_SYSTEM.md** from current `constants/colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `shadows.ts` plus the new tokens above, and any component patterns (card, button primary/secondary, list row). No implementation of new UI without DESIGN_SYSTEM approval.

---

## IMPLEMENTATION NOTES FOR BUILD AGENT

*(Exact file, component, property, old → new. Execute only after user approves the corresponding phase.)*

### Phase 1 (critical)

- **SplashScreen.tsx** — `logoText` content: `"ET"` → `"EA"` (or agreed logo mark).  
- **SplashScreen.tsx** — `styles.logoText.color`: `"#ecfdf5"` → `COLORS.primaryContrast` (add token to colors.ts first).  
- **SplashScreen.tsx** — `styles.title.color`, `styles.tagline.color`: replace hex with COLORS tokens (e.g. primaryContrast, primaryContrastMuted).  
- **OnboardingScreen.tsx** — Primary button label: `"Continue with Google"` → `"Get started"` (or approved copy).  
- **OnboardingScreen.tsx** — Secondary button label: `"Skip to calculator"` → `"Skip for now"` (or approved copy).  
- **navigation/AppNavigator.tsx** — `contentStyle: { backgroundColor: "#F7FAF8" }` → `contentStyle: { backgroundColor: COLORS.background }`; add COLORS import.  
- **HomeScreen.tsx** — Replace `COLORS.primary + "40"` with a token (e.g. add `primaryBorderSubtle` to colors.ts; use in communityCard borderColor).  
- **LeaderboardScreen.tsx** — Tab label text: `{t}` → `{t.charAt(0).toUpperCase() + t.slice(1)}` (or map global → "Global", etc.).  
- **LeaderboardScreen.tsx** — `styles.tab`: `borderRadius: 8` → `RADIUS.sm`; padding values → SPACING.sm, SPACING.base.  
- **LeaderboardScreen.tsx** — `styles.row`: `borderRadius: 8` → `RADIUS.sm`.  
- **constants/shadows.ts** — No change. **ChallengeCard.tsx**, **StatsTileRow.tsx**, **MilestoneCard.tsx**, **OffsetSection.tsx**: remove local `shadowMd`/`shadowSm`; add `import { SHADOWS } from "@/constants/shadows"` and use `SHADOWS.md` or `SHADOWS.sm` as appropriate.  
- **CalculatorScreen.tsx** (result view) — Breakdown container: add backgroundColor, padding, borderRadius from COLORS.surface, SPACING, RADIUS; breakdown rows: use SPACING for paddingVertical.  
- **HomeScreen.tsx** — Mission cards: either wrap in Pressable and navigate to Missions (or mission detail), or add explicit "See all in Missions" link and reduce card affordance (e.g. no shadow/press state).  
- **Accessibility** — Add `accessibilityLabel` and `accessibilityRole` to: AuthScreen primary/secondary buttons; BottomTabNavigator tab buttons; CalculatorScreen step chips and sliders; MissionsScreen filter chips and "Mark complete"; LeaderboardScreen tab and list rows; CommunityScreen tabs and join button; ProfileScreen share and sign out. (Exact strings to be approved.)

### Phase 2 (refinement)

- **constants/theme.ts** — Remove file or merge into colors/typography and re-export; ensure no imports of `Colors`/`Fonts` from theme.ts in app.  
- **constants/colors.ts** — Add: `primaryContrast`, `primaryContrastMuted`, `overlay`, `primaryBorderSubtle` (values to be defined in DESIGN_SYSTEM).  
- **SplashScreen, OnboardingScreen, AuthScreen, HomeScreen, CalculatorScreen, MissionsScreen, LeaderboardScreen, CommunityScreen, ProfileScreen** — Replace every raw `fontSize` and `fontWeight` with `TYPOGRAPHY.size.*` and `TYPOGRAPHY.weight.*` (e.g. fontSize: 22 → TYPOGRAPHY.size.lg, fontWeight: "700" → TYPOGRAPHY.weight.bold).  
- **CommunityHeroBanner.tsx** — Replace `#fff` and `rgba(255,255,255,0.9)` with COLORS tokens; `borderRadius: 16` → RADIUS.lg.  
- **OffsetSection.tsx** — Replace `#fff` in indiaBadgeText with COLORS token; replace raw fontSize with TYPOGRAPHY.  
- **MissionsScreen, ChallengeCompletionModal, ShareBottomSheet** — Overlay background: replace `rgba(0,0,0,0.5)` with COLORS.overlay (add token).  
- **Modals** — Document in DESIGN_SYSTEM: overlay and sheet styles use tokens only.

### Phase 3 (polish)

- **Empty states** — Create one reusable EmptyState component (icon/illustration, title, subtitle, primary action); use in LeaderboardScreen, HomeScreen (milestones), CommunityScreen (mine), ProfileScreen (footprint history). Same padding (SPACING.xl) and vertical rhythm.  
- **Loading** — Replace inline `style={{ marginVertical: SPACING.lg }}` etc. with a shared wrapper or consistent contentContainerStyle so loading indicator placement is identical across screens.  
- **Error** — MissionsScreen, LeaderboardScreen, CommunityScreen: on load error set error state and render one error view (message + retry button) instead of empty list.  
- **Pressable** — Add to primary/secondary buttons: `style={({ pressed }) => [..., pressed && { opacity: 0.8 }]}` (or approved value). Ensure list/item touch targets ≥ 44.  
- **BottomTabNavigator** — `tabBarLabelStyle: { fontSize: 11 }` → `fontSize: TYPOGRAPHY.size.xs` (11).  
- **Dark mode** — If in scope: wire COLORS.dark into theme provider and use theme-aware COLORS in all components. If out of scope: add note to DESIGN_SYSTEM; no code change.

---

## Next Steps

1. **Create DESIGN_SYSTEM.md** (from constants + new tokens above) and get approval.  
2. **User approval:** Review Phase 1; approve, reorder, or remove items.  
3. **Implement Phase 1 only;** then present before/after for review before Phase 2.  
4. Repeat for Phase 2 and Phase 3.  
5. After each phase: update progress (.txt) and LESSONS (.md) if they exist; create them if not.  
6. If any design change requires a functional change (e.g. mission card navigation), flag for a separate build session and do not alter behavior in the design-only pass.
