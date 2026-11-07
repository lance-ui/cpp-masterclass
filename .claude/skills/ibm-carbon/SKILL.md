# IBM Carbon Design System

## Grid (2x Grid)
- 16 columns at large and up. Breakpoints: sm 320 (4 col), md 672 (8 col), lg 1056 (16 col), xlg 1312, max 1584.
- Gutters 32px (16px each side of a column). Condensed and narrow grid modes exist for dense layouts.
- Everything aligns to the 8px mini-unit.

## Spacing tokens
$spacing-01 2 · 02 4 · 03 8 · 04 12 · 05 16 · 06 24 · 07 32 · 08 40 · 09 48 · 10 64 · 11 80 · 12 96 · 13 160 (px)

## Typography
- IBM Plex Sans (UI), Plex Mono (code and data), Plex Serif (editorial).
- Use the productive type set for product UI (compact, e.g. body-compact-01 14/18) and the expressive set for marketing and editorial pages.
- Weights: Light 300 for large display, Regular 400 for body, SemiBold 600 for headings and emphasis.

## Themes
White, Gray 10 (light); Gray 90, Gray 100 (dark). Use theme tokens (`$background`, `$layer-01`, `$layer-02`, `$text-primary`, `$text-secondary`, `$border-subtle-01`, `$interactive`, `$focus`), never raw colors.
- Layering: each nested container steps up one layer token for contrast.
- Blue 60 (#0f62fe) is the interactive/brand color in light themes.

## Shape and style
- Square corners on almost everything. No decorative shadows. Depth comes from layer tokens.
- 2px focus outline using `$focus`.

## Components
- Button kinds: primary, secondary, tertiary, ghost, danger. Button sets put the primary on the right.
- Buttons can be full-bleed in modals and side panels.
- Data table is central: support sorting, batch actions toolbar, row selection, expansion, pagination, and zebra stripes only when helpful.
- Notifications: inline (contextual), toast (transient), actionable (needs a response).
- Forms: labels always above inputs, helper text below, never placeholder-as-label.

## Motion
Productive motion (fast, subtle) for UI tasks, expressive motion for significant moments. Durations: fast-01 70ms, fast-02 110ms, moderate-01 150ms, moderate-02 240ms, slow-01 400ms, slow-02 700ms.

## Output
Use `@carbon/react` and `@carbon/styles` tokens. In reviews, note grid misalignment, raw colors, and missing table states first, since those are the most common Carbon issues.