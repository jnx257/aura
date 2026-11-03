---
name: Aura
description: A calm, warm-paper to-do and journal that treats a missed task as information, never as failure.
colors:
  paper: "#f6f3ee"
  paper-raised: "#fffdf9"
  paper-sunken: "#ede7df"
  paper-soft: "#f1ece5"
  ink: "#2a2622"
  ink-soft: "#4a443e"
  stone: "#6b635b"
  stone-faint: "#6f675f"
  hairline: "#e4ddd3"
  dash: "#928981"
  dash-strong: "#c9bfb2"
  lamp-bg: "#1f1d1a"
  lamp-surface: "#2a2724"
  lamp-raised: "#3a3632"
  lamp-chip: "#2e2a27"
  lamp-ink: "#ede6dc"
  lamp-ink-soft: "#d6cec3"
  lamp-excerpt: "#b8afa4"
  lamp-muted: "#a39a8f"
  lamp-faint: "#9a9189"
  lamp-line: "#3a3632"
  lamp-dash: "#797169"
  brick: "oklch(0.53 0.17 25)"
  brick-deep: "oklch(0.5 0.17 25)"
  brick-wash: "oklch(0.95 0.035 25)"
  sage: "oklch(0.48 0.08 150)"
  sage-ink: "oklch(0.45 0.08 150)"
  sage-wash: "oklch(0.94 0.03 150)"
  brick-lamp: "oklch(0.68 0.13 25)"
  brick-lamp-wash: "oklch(0.3 0.05 25)"
  sage-lamp: "oklch(0.665 0.1 150)"
  sage-lamp-wash: "oklch(0.3 0.035 150)"
typography:
  headline-lg:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  checkbox: "7px"
  field: "14px"
  card: "16px"
  sheet-dialog: "24px"
  sheet-mobile: "28px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "18px"
  page-mobile: "20px"
  lg: "22px"
  page-desktop: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
  pill:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "9px 13px"
  pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.pill}"
    padding: "9px 13px"
  card:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  input:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "15px 16px"
  tag:
    backgroundColor: "{colors.paper-sunken}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "4px 9px"
  badge-drifting:
    backgroundColor: "{colors.brick-wash}"
    textColor: "{colors.brick}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
  badge-on-track:
    backgroundColor: "{colors.sage-wash}"
    textColor: "{colors.sage}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
---

# Design System: Aura

## Overview

**Creative North Star: "The Quiet Notebook"**

Aura is a warm paper notebook by day that dims to a lamp-lit page for reflection. Everything is built to be unjudging: low contrast between surfaces, hairline borders instead of shadows, one ink color for every action, and two small signal hues that inform rather than alarm. The interface stays out of the way of a person looking at their own goals and, sometimes, at what they missed.

The system has two modes that mirror the product's two modes of mind. **Fazer** (do) is warm paper (`#f6f3ee`) for planning and doing. **Refletir** (reflect) re-colors the whole app to a dim, warm-dark palette the moment the person enters the journal; the `data-mode` attribute on the shell swaps every token, and the browser `theme-color` follows. Mode is chosen by route, not by a user toggle or the OS setting. Light/dark is a statement about mindset, not a preference.

Density is calm and compact: 14-15px text, generous row padding, 11px meta lines. One typeface, Figtree, at four weights. Mobile and desktop are both first-class and share one component vocabulary: bottom sheets on phones become centered dialogs or a right panel at the `lg` breakpoint.

**Key Characteristics:**
- Warm paper neutrals; no pure white, no pure black, no cool grays.
- A single ink (`#2a2622`) carries every primary action, active state and focus ring; there is no accent hue.
- Brick red and sage green exist only to say "drifting / missed" and "on track / done", at small scale.
- Flat at rest. Hairline borders define surfaces; shadows appear only on floating things (sheet, FAB, menu, mode switch thumb).
- Dashed borders mean "not tied to a goal" or "something you can add".
- Fully rounded pills for actions and filters; 16px cards for content.

## Colors

A restrained warm-neutral palette with two functional signal hues. Tokens are CSS custom properties on `:root` / `[data-mode]` in `src/app/globals.css`, exposed to Tailwind as `bg-surface`, `text-muted`, `border-line` etc.

### Primary
- **Notebook Ink** (`#2a2622`, mode token `ink`): Primary buttons, active pills, selected-card borders, focus rings, the checkbox outline, the FAB. It is the only "brand" color; it flips to `lamp-ink` (`#ede6dc`) in Refletir, with `on-ink` flipping the other way so the pills stay legible.

### Secondary (signal)
- **Faded Brick** (`oklch(0.53 0.17 25)`, `brick`): Missed tasks, drifting goals, the "O que atrapalhou?" link, field errors. Backed by **Brick Wash** (`oklch(0.95 0.035 25)`) for badge fills and the missed-checkbox hover.
- **Soft Sage** (`oklch(0.48 0.08 150)`, `sage`): Completed checkboxes, on-track progress bars, the text selection tint. Backed by **Sage Wash** (`oklch(0.94 0.03 150)`), which is also the fill of the suggested-adjustment panel in the missed prompt.

### Neutral (Fazer / do)
- **Warm Paper** (`#f6f3ee`): App background.
- **Raised Paper** (`#fffdf9`): Cards, sheets, inputs (`surface`).
- **Sunken Paper** (`#ede7df`): Mode switch track, chips, hover fills, avatar, progress track (`sunken`, `chip`, `divider`).
- **Soft Paper** (`#f1ece5`): Quiet inset areas.
- **Body Ink** (`#4a443e`): Body and secondary titles.
- **Stone** (`#6b635b`): Meta lines, labels, inactive tabs, excerpts (`muted`).
- **Faint Stone** (`#6f675f`): Placeholders, the "opcional" hint and other tertiary text. It meets 4.5:1 on paper and raised paper, so it sits only a hair lighter than Stone; the difference is role, not legibility.
- **Hairline** (`#e4ddd3`): Card borders (decorative, 1.3:1 by design); also `divider` at `#ede7df` between rows.
- **Dash** (`#928981`): Boundary of a control that has no fill (the orphan checkbox) and of text fields, as `field-line`. 3.1:1, so the control is findable. The softer **Dash Strong** (`#c9bfb2`) is for decorative dashed containers only (empty states, "add" areas), never a control's sole boundary.

### Neutral (Refletir / reflect)
Same roles, re-mapped to a warm lamp-lit dark: background `#1f1d1a`, surface `#2a2724`, raised `#3a3632`, ink `#ede6dc`, soft ink `#d6cec3`, muted `#a39a8f`, faint `#9a9189`, line `#3a3632`, dash `#797169`. The signals are re-tuned rather than reused: **Lamp Brick** (`oklch(0.68 0.13 25)` on `oklch(0.3 0.05 25)`) and **Lamp Sage** (`oklch(0.665 0.1 150)` on `oklch(0.3 0.035 150)`) are lighter and calmer so they read as text and fill on dark (4.6:1 or better). They remap the same semantic tokens (`miss`, `ok` and their washes), so components never branch on mode.

### Named Rules
**The One Ink Rule.** Every primary action, active state and focus ring is Notebook Ink. Do not introduce an accent hue for buttons, links or selection.
**The Signal, Not Alarm Rule.** Brick and sage appear only as small badges, thin bars, checkbox fills, short text and the single sage suggestion panel. Never as a full-width banner, a page tint, or a button fill. A miss is information.
**The Mode Is a Mindset Rule.** Fazer is light and warm; Refletir is dim. The mode follows the route, never the OS setting. Do not add a manual theme toggle.

## Typography

**Display / Body / Label Font:** Figtree (weights 400, 500, 600, 700) with `system-ui, sans-serif` fallback, loaded via `next/font/google` as `--font-figtree`.

**Character:** A friendly geometric humanist sans, set small and with tight tracking on headings. It reads like handwriting-adjacent print: warm without being playful. Weight, not size, does most of the hierarchy work.

### Hierarchy
- **Headline LG** (600, 32px desktop, 1.2, -0.02em): The greeting on Hoje at `lg`. On phones the same heading is 22px at weight 500.
- **Headline** (500, 22px, 1.25, -0.02em): Mobile page headings.
- **Title** (500 mobile / 600 desktop, 18px mobile, 21px desktop, 1.35-1.4, -0.01em): Sheet and dialog questions such as "Não deu para concluir ... — o que atrapalhou?".
- **Body** (400, 15px, 1.5): Inputs, task titles on desktop. Goal-linked task titles are weight 500; orphan titles are `ink-soft` at 400.
- **Body SM** (400, 14px): Task titles on phones, tabs, secondary text.
- **Control** (600, 13px): Buttons, pills, tabs, task-editor rows and links. On phones, text-entry controls (inputs, selects, textareas) are 16px so iOS Safari does not zoom on focus; they return to 13-15px at `lg`.
- **Caption** (400, 11-12px): Meta lines under a title, `Stone` colored, joined by " · ". Missed meta lines turn Brick.
- **Label** (400, 11px, +0.08em, uppercase): Section labels such as MANHÃ / TARDE / NOITE / A QUALQUER HORA and METAS.

Auth and goal-detail titles use a larger display step (26px on phones, 30-34px at `lg`, weight 500/600, -0.03em); it appears on those screens only. The smallest size is 11px; there is no 10px step.

### Named Rules
**The Dot-Separated Meta Rule.** Secondary information on one line, joined by " · ", sentence-cased, never wrapped into separate chips.
**The Weight Over Size Rule.** Promote by weight (400 → 500 → 600), not by jumping a size. Goal-linked content gets the heavier weight.

## Layout

Single-column on phones with 20px (`px-5`) page gutters; at `lg` the page becomes a two-column grid `minmax(0,1fr) 380px` with a 40px gap and 48px gutters (the goals/activity panel moves to the right column). Vertical rhythm between sections is 18px on phones and 22px at `lg`. Task rows have 12-13px vertical padding and 12-14px gap between checkbox and text.

Navigation changes shape, not content: phones show the Fazer/Refletir mode switch and an underlined text tab bar (Hoje, Semana, Metas) with a floating `+` button; desktop shows a 64px sticky top bar with the wordmark, mode switch, tab pills, a context-aware primary button (+ Nova tarefa / + Nova meta / Escrever) and an avatar menu. Full-screen mobile views (journal editor, goal detail) bring their own top bar. Horizontal strips (the goal cards on Hoje) bleed to the screen edge with `-mx-5`.

Breakpoint: only `lg` (1024px) is a layout switch. Visible controls can stay small, but tap areas do not: the checkbox is a 22px box with a 44px hit area (28px in the week board, where neighbours are close), and text links such as "Fechar", "Salvar", "O que atrapalhou?", the mood choices and the delete links carry padding with a matching negative margin so the layout does not move.

## Elevation & Depth

Flat by default, tonal rather than shadowed. Surfaces are separated by `Hairline` borders and by paper-on-paper steps (`Warm Paper` page, `Raised Paper` cards, `Sunken Paper` tracks and chips). In Refletir the same logic runs in reverse: raised surfaces are slightly lighter than the page.

### Shadow Vocabulary
Defined once as Tailwind theme tokens in `globals.css`.
- **`shadow-sheet`** (`0 24px 60px rgba(42,38,34,0.25)`): Centered desktop dialog only; phone sheets use the scrim instead.
- **`shadow-fab`** (`0 8px 20px rgba(42,38,34,0.25)`): The mobile `+` button.
- **`shadow-menu`** (`0 12px 30px rgba(42,38,34,0.12)`): The account dropdown.
- **`shadow-thumb`** (`0 1px 2px rgba(42,38,34,0.08)`): The active half of the Fazer/Refletir switch.
- **Scrim** (`rgb(42 38 34 / 0.38)`, dark `rgb(0 0 0 / 0.5)`): Dialog backdrop.

### Named Rules
**The Flat-At-Rest Rule.** Cards, rows, badges and buttons carry no shadow. Shadows belong to things that float above the page.

## Shapes

Soft and rounded, but with a clear size ladder. Actions, filters, tags, badges and the mode switch are fully round pills. Content containers are 16px (`rounded-2xl`). Fields are 14px. Sheets are 28px on top corners on phones and 24px as a dialog at `lg`. Checkboxes are 7px rounded squares (5px at the small size); progress bars are 2-4px rounded hairlines (4px tall). A 5×38px grabber pill sits on phone sheets.

Borders are 1px `Hairline`, going to 1.5px `Notebook Ink` for the selected goal card and focused fields. Dashed 1px borders (`Dash`) mark things that are not goal-linked or can be added.

## Components

### Buttons
- **Shape:** Fully round pill (`9999px`). Semibold 13px; three sizes (sm 12px/12px pad, md 13px/16px, lg 14px/16px with 14px vertical).
- **Primary:** Notebook Ink fill, Raised Paper text. Hover lowers opacity to 90%; disabled to 50%.
- **Secondary:** Transparent, 1px Hairline border, ink text at normal weight; hover fills Sunken Paper.
- **Ghost:** Stone text, no border; hover turns ink.
- **Link:** Ink, underlined with a 3px offset, used for the quiet third option ("Refletir sobre isso").
- **Focus:** Global 2px solid ink outline, 2px offset, on `:focus-visible`.

### Pills (filters, reasons)
- **Style:** 1px Hairline border, ink text, 13-14px; hover fills Sunken Paper.
- **Active:** Ink fill, `on-ink` text. Used as `aria-pressed` filters and as `role="radio"` reason choices.
- **Dashed:** The "Outro…" option uses a dashed Dash-Strong border and Stone text until chosen.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Raised Paper with a 1px Hairline border; no shadow.
- **Padding:** 14-16px. Task lists share one card with `Divider` rules between rows rather than a card per task.
- **Goal card:** Title, meta line (horizon · category), a drift badge, a 4px progress bar and `done/total`. Selected state is a 1.5px ink border.

### Inputs / Fields
- **Style:** 14px radius, 1px Dash border (`field-line`, 3:1), Raised Paper fill, 16px text on phones and 15px at `lg`, 15px vertical padding. Placeholders are Faint Stone.
- **Focus:** Border becomes ink at 1.5px; the default outline is suppressed in favour of this border change.
- **Labels:** 12px Stone above the field; "· opcional" in Faint Stone. Hints and errors are 11px beneath; errors are Brick.

### Navigation
- **Mode switch:** A Sunken Paper pill track holding two links (Fazer / Refletir). The active half is a Raised Paper pill with semibold text and a 1px shadow.
- **Tabs (phone):** Text links with a 2px ink underline for the active tab, Stone otherwise; 24px apart.
- **Tabs (desktop):** 14px text in 8px-radius links; active gets a Sunken Paper background and semibold.
- **Account menu:** A 34-36px Sunken Paper circle with the initial; opens a Raised Paper dropdown.

### Checkbox (signature)
A 22px (16px small) rounded square whose outline carries task semantics: solid ink outline = goal-linked and open; **dashed** Dash outline = orphan task; Brick outline = missed; filled Soft Sage with a Raised Paper tick = done. The checkbox, not a label, is how a person reads a task's weight at a glance.

### Drift badge and progress (signature)
A small pill ("No rumo" in Sage on Sage Wash, "Desviando" in Brick on Brick Wash) paired with a 4px bar tinted by the same state. Wording is a direction of travel, not a grade.

### Delete confirmation
Deleting is a quiet underlined Stone link that turns Brick on hover. One click does not delete: it swaps in an inline "Excluir esta tarefa?" with **Cancelar** (focused first) and a Brick **Sim, excluir**. No modal, no shaded warning box; the wording stays neutral and states what survives (a goal's tasks stay, a task's journal entries stay).

### Radio groups
Reasons, period and mood are custom `role="radio"` groups. Arrow keys, Home and End move focus between choices; Space or Enter chooses, and choosing the selected one again clears it.

### Bottom sheet / dialog (signature)
One `<dialog>` primitive: phone bottom sheet with grabber and 28px top corners; at `lg` a centered 540px dialog or a 360px right panel. The "O que atrapalhou?" moment uses it with reason pills, a Sage Wash suggestion panel (label SUGESTÃO in sage-ink, 0.06em tracking), and three equally valid answers: Aceitar, Deixar assim, Refletir sobre isso.

## Do's and Don'ts

### Do:
- **Do** use Notebook Ink (`#2a2622`) as the only action color: primary buttons, active pills, focus rings, selected borders.
- **Do** use hairline borders (1px `#e4ddd3`) and paper steps for separation; reserve shadows for floating layers.
- **Do** signal state with the checkbox outline vocabulary (solid, dashed, brick, filled sage) and keep Brick/Sage to badges, thin bars, small text and the one suggestion panel.
- **Do** give every prompt a quiet exit: closing, "Deixar assim" and ignoring are all valid; the secondary and link buttons are as visible as the primary.
- **Do** switch the whole shell to the lamp palette on `/refletir` and keep `theme-color` in sync.
- **Do** write meta lines as sentence-cased phrases joined by " · ".
- **Do** keep every text pair at 4.5:1 or better and every control's sole boundary at 3:1, in both modes. Check new pairs before adding a token.

### Don't:
- **Don't** use Brick for large surfaces, full-width alerts, destructive-styled buttons or anything that reads as a verdict on the person.
- **Don't** add a manual theme toggle or follow `prefers-color-scheme`; mode follows the route.
- **Don't** introduce a colored accent for links, selection or CTAs.
- **Don't** use pure white or pure black; stay on the warm paper and lamp scales.
- **Don't** put shadows on cards, rows, badges or buttons.
- **Don't** show scores, streak flames, confetti or a combined mood/completion "insight"; the product shows patterns as a mirror (see PRODUCT.md).

### Known gaps (observed, not prescriptions)
- Card and pill borders (`Hairline`, 1.3:1) are decorative; a card or pill whose edge is the only way to find it needs `Dash` instead.
- The lamp signals were computed to contrast targets but have not been reviewed on a real screen; judge them by eye in Refletir.
- Text sizes of 10-11px are used for badges and meta lines; the small end of the scale is at the edge of comfortable reading on phones.
