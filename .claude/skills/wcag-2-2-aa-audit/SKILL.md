# WCAG 2.2 AA Audit

Work through the four POUR principles and report findings with: criterion number, severity (Blocker / Major / Minor), location, the problem, and the exact fix (code when possible).

## Perceivable
- 1.1.1 Every meaningful image has alt text; decorative images use `alt=""`.
- 1.3.1 Use semantic structure: one `h1`, no skipped heading levels, real lists, `<label for>` on inputs, `<th scope>` in tables, landmarks (`header`, `nav`, `main`, `footer`).
- 1.4.3 Text contrast is at least 4.5:1 (3:1 for 24px+ or 18.66px+ bold).
- 1.4.11 UI component boundaries, focus indicators, and meaningful icons have at least 3:1 contrast.
- 1.4.1 Color is never the only signal (errors need text or an icon too).
- 1.4.4 / 1.4.10 Content works at 200% zoom and reflows at 320px width with no horizontal scroll.
- 1.4.12 Layout survives increased letter, word, and line spacing.

## Operable
- 2.1.1 Everything works with the keyboard alone, with no traps (2.1.2).
- 2.4.3 Focus order matches visual order. 2.4.7 Focus is always visible.
- 2.4.11 (new in 2.2) Focused elements are not fully hidden by sticky headers or overlays.
- 2.5.8 (new in 2.2) Targets are at least 24x24 CSS px or have enough spacing.
- 2.5.7 (new in 2.2) Any drag action has a single-pointer alternative.
- 2.4.1 Skip link to main content. 2.4.2 Descriptive page titles. 2.4.4 Link text makes sense out of context (no "click here").
- 2.3.1 Nothing flashes more than 3 times per second. Honor `prefers-reduced-motion`.

## Understandable
- 3.1.1 `lang` attribute on `<html>`.
- 3.3.1 / 3.3.3 Errors are identified in text and say how to fix them.
- 3.3.2 Inputs have visible labels and instructions.
- 3.3.7 (new in 2.2) Don't ask users to re-enter information they already gave.
- 3.3.8 (new in 2.2) Login doesn't depend on a cognitive test. Allow paste and password managers.

## Robust
- 4.1.2 Custom widgets expose name, role, and value. Prefer native elements over ARIA. If ARIA is used, follow APG patterns (dialog, menu, tabs, combobox).
- 4.1.3 Status messages use `role="status"` or `aria-live`.

## Common component checks
- Modals: focus moves in, is trapped, Esc closes, focus returns to the trigger, background is `inert`.
- Dropdowns and menus: arrow-key navigation and `aria-expanded`.
- Icon-only buttons have `aria-label`.
- Forms link errors with `aria-describedby` and set `aria-invalid`.

## Output format
1. Summary: pass/fail estimate and the top 3 risks
2. Findings table ordered by severity
3. Fixed code snippets
4. What needs manual testing (screen reader runs with NVDA, VoiceOver, TalkBack)