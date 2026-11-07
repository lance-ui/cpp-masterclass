# Design Consistency Refactor

Goal: one coherent, human-designed look across the whole system, based on the design that already exists. Don't invent a new design. Find the established one and make everything follow it.

Work in four phases. Don't skip Phase 1.

---

## Phase 1: Learn the current design

Read before you change anything. Build a **Design Baseline** from these sources:

1. **Token sources**: `tailwind.config.*`, `@theme` blocks in CSS (Tailwind v4), `:root` CSS variables, theme files (`theme.ts`, `tokens.json`), SCSS variables, and the component library config.
2. **Fonts**: font imports (`next/font`, Google Fonts links, `@font-face`), and which font each heading level and body text uses.
3. **Actual usage**: count what the code really uses. The most common value is usually the intended one:

       # most used Tailwind color classes
       rg -o --no-filename "\b(bg|text|border|ring|fill|stroke)-[a-z]+(-[0-9]{2,3})?(/[0-9]+)?\b" src | sort | uniq -c | sort -rn | head -40
       # radius, shadow, spacing usage
       rg -o --no-filename "\brounded(-[a-z0-9]+)?\b" src | sort | uniq -c | sort -rn
       rg -o --no-filename "\bshadow(-[a-z0-9]+)?\b" src | sort | uniq -c | sort -rn
       rg -o --no-filename "\b(p|px|py|m|mx|my|gap|space-[xy])-[0-9.]+\b" src | sort | uniq -c | sort -rn | head -30
       # hardcoded colors
       rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" src --glob '!*.svg'

4. **Reference components**: find the best-built primitives (Button, Input, Card, Modal, Dropdown, Table, PageHeader) and the most polished page. Those are the gold standard.
5. **Project rules**: check CLAUDE.md, README, design docs, and memory for stated preferences. Stated preferences always beat inferred ones.

Write the baseline down before continuing:

    Design Baseline
    - Colors: background, surface/panel, border, text, muted text, accent (+ where accent is allowed), semantic (success/warning/danger)
    - Typography: heading font, body font, size scale in use, weights
    - Shape: radius (e.g. square / 4px / 8px), border style, shadow policy
    - Spacing: base unit, section gaps, card padding, page max-width
    - Components: canonical Button variants, Input, Card, Modal, Dropdown, Table, Icons library
    - Patterns: navigation, page header, empty states, forms, feedback (toast/inline)

If the baseline is ambiguous (two competing palettes, two button styles of similar frequency), ask the user which one wins. Don't guess.

---

## Phase 2: Audit the whole system

Scan every route, page, layout, and component. Skip `node_modules`, build output, vendor files, and generated code.

### A. Design drift (doesn't follow the baseline)
- Hardcoded hex/rgb values or arbitrary Tailwind values (`bg-[#123456]`, `p-[13px]`) where a token exists
- Colors outside the palette (e.g. `bg-blue-500` in a project whose accent is lime)
- Wrong or mixed radius (rounded cards in a square-cornered system, or the reverse)
- Off-scale spacing and font sizes
- Wrong fonts, or extra font families
- One-off buttons, inputs, or cards rebuilt inline instead of using the shared component
- Mixed icon libraries
- Inconsistent page headers, containers, and max-widths
- Different patterns for the same job (accordion here, modal there; toast here, alert there)
- Missing states compared with the reference components (hover, focus-visible, disabled, loading, empty, error)
- Dark/light theme tokens bypassed

### B. AI-generated design tells (remove all of these)

Search for them explicitly:

    # em dashes and en dashes in UI copy
    rg -n "—|–|&mdash;|&ndash;|\\\\u2014|\\\\u2013" src
    # eyebrow labels: small uppercase tracked text placed above a heading
    rg -n "uppercase.*tracking|tracking.*uppercase" src
    # gradients, gradient text, glass effects
    rg -n "gradient|bg-clip-text|text-transparent|backdrop-blur|bg-white/(5|10)\b" src
    # AI icons and emoji
    rg -n "Sparkle|Sparkles|faWandMagic|WandSparkles|faRobot|Bot\b|Stars\b" src
    rg -n "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src
    # buzzword copy
    rg -ni "seamless|revolutioniz|unlock|supercharg|leverag|cutting-edge|game-?chang|elevate your|empower|effortless|next-level|harness the power|in today's" src

Patterns to remove or replace:

| AI tell | Replace with |
|---|---|
| Em/en dashes in UI copy | Period, comma, colon, or a rewrite. Number ranges become "to" or a hyphen. |
| Eyebrow label or badge above a heading | Delete it. The heading carries the meaning. |
| Long subheadings and descriptions under every heading | One short sentence, or nothing. Max ~20 words, cut adjectives. |
| Grids of identical icon-on-top cards | Editorial list rows with hairline dividers, a two-column text layout, or one visual with annotations |
| Row of 3–4 identical stat tiles | One stat strip with a single lead figure and smaller supporting numbers |
| Gradients, gradient text, glow, glassmorphism | Solid baseline surface and text colors |
| Sparkle, wand, or robot "AI" icons, and decorative emoji | Neutral, functional icons, or none |
| Accent color everywhere | See the accent budget below |
| One-sided colored accent bars on cards | Plain border from the baseline |
| Everything centered, the same section rhythm repeated | Left-aligned text, varied composition between sections |
| Buzzwords and vague claims | Specific, concrete copy about what the product does |
| "Learn more" or "Get started" on every button | Labels that name the action ("Create invoice") |
| Heavy drop shadows plus pill badges on everything | Baseline shadow and radius policy only |

### C. Accent budget
The accent color is only for:
- the primary action (one per view or region)
- the selected or active state (current nav item, selected tab, checked control)
- focus rings
- key values the baseline reserves for it (e.g. prices)

Everything else uses neutrals: icons, headings, decorative borders, section backgrounds, secondary buttons, badges, links inside body text (unless the baseline says otherwise), and charts' non-highlighted series. If a screen shows the accent in more than about 3 places, it's overused.

### D. Copy length rules
- Headings: short and specific, under ~8 words.
- Supporting text: 1 sentence, rarely 2.
- Buttons: 1–3 words, verb first.
- Empty states: what's missing plus the next action, in 2 short lines.
- Remove filler such as "Here you can...", "This section allows you to...", or "Easily manage...".
- Keep meaning. Shorten, don't rewrite the product's claims.

---

## Phase 3: Report and plan

Before editing, present:

1. **Design Baseline** (from Phase 1)
2. **Findings** grouped by file or route, each tagged:
   - `drift` (breaks the baseline), `ai-tell`, `accent`, or `copy`
   - severity: High (visible on key pages, or breaks consistency badly), Medium, Low
3. **Counts**, for example: "42 em dashes in 18 files, 11 eyebrow labels, 6 gradients, 23 hardcoded colors, 4 inline button reimplementations"
4. **Plan**: fix order. Shared primitives and tokens first, then layouts, then pages from highest traffic down.

For large projects, ask whether to fix everything or start with selected areas. For small projects, continue straight to Phase 4 unless the user asked for a report only.

---

## Phase 4: Refactor

Rules:
- **Fix the source, not the symptom.** If a missing token or component causes the drift, add or fix it once, then replace the usages.
- **Reuse existing components.** Replace inline one-offs with the canonical Button, Card, Modal, etc. Only create a new shared component when the same pattern appears 3 or more times.
- **Tokens, not raw values.** Replace hardcoded colors and arbitrary values with baseline tokens or scale values.
- **Preserve behavior.** Visual and copy changes only, unless a fix requires otherwise. Keep props, handlers, routes, accessibility attributes, and test IDs intact.
- **Preserve meaning in copy.** Shorten and de-buzzword, but don't change facts, prices, legal text, or anything in user-generated or CMS content without asking.
- **Don't touch** generated files, vendor code, or third-party components. Note them in the report instead.
- **No new comments** explaining the refactor. Don't leave commented-out old styles.
- **Stay consistent while editing.** Every replacement must match the baseline exactly. Don't introduce a "better" new style mid-refactor.
- Work in batches by area. After each batch, run the project's lint, typecheck, and build.

Accessibility guardrails while refactoring:
- Text contrast at least 4.5:1, UI boundaries and focus at least 3:1
- Visible focus states on every interactive element
- Removing an eyebrow or icon must not remove the only label a control or section has

---

## Final summary

Finish with:
- What changed, per area, with counts by category
- New or updated tokens and shared components
- Anything skipped and why (CMS copy, vendor code, ambiguous choices)
- Remaining recommendations that were out of scope
- How to verify: build/lint results, and the pages worth checking visually first

Then re-run the Phase 2 searches and report how many remain. The target is zero em dashes, eyebrows, gradients, and AI icons in UI code, and no colors outside the baseline.

How it works:
- Phase 1 works out your current design (palette, fonts, radius, spacing, and your best components) from the config and from what the code actually uses most. It asks you if two styles compete.
- Phase 2 checks every file for two things: places that don't match that design, and AI-template patterns. It includes ready-to-run search commands for em dashes, eyebrow labels, gradients, AI icons, emoji and buzzwords.
- Phase 3 gives you a report with counts and a fix plan before anything changes.
- Phase 4 fixes shared tokens and components first, then pages. It keeps behavior and meaning intact, and it skips copy that comes from a CMS or users unless you approve.