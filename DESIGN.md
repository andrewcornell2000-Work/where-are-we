---
name: Where Are We
description: A live crayon-sketch board an AI keeps current while you work.
colors:
  board: "#0b0b0d"
  chalk: "#f4efe6"
  muted: "#9a978f"
  accent: "#ffd35c"
  status-done: "#8ce06a"
  status-doing: "#ffd35c"
  status-todo: "#6cc4ff"
  quiet-grey: "#8a8a93"
  chip: "#cfe9ff"
  chip-ref: "#d9c7ff"
  panel-solid: "#16161a"
  banner-solid: "#2a2110"
  board-light: "#f6f1e5"
  chalk-light: "#2b2620"
  muted-light: "#6f6a5e"
  accent-light: "#b8860b"
  status-done-light: "#357a25"
  status-doing-light: "#7d5d00"
  status-todo-light: "#2472a8"
typography:
  display:
    fontFamily: "Patrick Hand, Gaegu, Comic Sans MS, cursive"
    fontSize: "26px"
    lineHeight: 1.1
    letterSpacing: "0.5px"
  title:
    fontFamily: "Patrick Hand, Gaegu, Comic Sans MS, cursive"
    fontSize: "21px"
    lineHeight: 1.05
  body:
    fontFamily: "Patrick Hand, Gaegu, Comic Sans MS, cursive"
    fontSize: "14px"
    lineHeight: 1.2
  label:
    fontFamily: "Patrick Hand, Gaegu, Comic Sans MS, cursive"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.8px"
  control:
    fontFamily: "Patrick Hand, Gaegu, Comic Sans MS, cursive"
    fontSize: "16px"
rounded:
  card: "16px"
  section: "26px"
  panel: "16px"
  control: "10px"
  field: "8px"
  pill: "999px"
spacing:
  card-inset: "12px"
  control: "12px"
  panel: "16px"
  section-top: "56px"
  section-side: "22px"
  grid: "20px"
components:
  card:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chalk}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-inset}"
    width: "220px"
  status-badge:
    textColor: "{colors.status-doing}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "1px 7px"
  control:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "5px 12px"
  control-active:
    backgroundColor: "#3f3a26"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
  next-banner:
    backgroundColor: "{colors.banner-solid}"
    textColor: "{colors.chalk}"
    typography: "{typography.control}"
    rounded: "14px"
    padding: "6px 18px"
---

# Design System: Where Are We

## 1. Overview

**Creative North Star: "The Architect's Sketchbook"**

Drafting pencil on dark paper. Every mark on this board is hand-drawn, but by
someone who is good at it and doing serious technical work — site notes, not a
doodle. That single image resolves the system's central tension: the medium is
literally crayon, and the constant risk is tipping into a children's app. An
architect's sketch is unmistakably hand-made and unmistakably adult, and that is
the line every decision here is measured against.

The board is the product. Chrome exists only to get out of the way of it: a
floating bar of quiet instruments above a flat, paper-like surface. Density is
low by design — the board answers one question, *where am I?*, and anything that
does not serve that question is decoration. Colour is scarce and semantic; the
only thing permitted to shout is the single card that is next.

This system explicitly rejects the generic SaaS dashboard (purple gradients,
identical stat cards, glassmorphism everywhere), anything childish or toy-like,
the cluttered whiteboard of competing panels and affordances, and the sterile
corporate grey that would be the wrong correction to the childish risk.

**Key Characteristics:**

- Hand-drawn surface, precise substructure — wobble on top, discipline beneath
- Flat board; only genuinely floating chrome casts a shadow
- One accent, one gold, and status colour used semantically and nowhere else
- Legibility survives zoom: detail is dropped, never shrunk into illegibility
- Nothing on the board is carried by colour alone

## 2. Colors: Slate and Chalk

Two constants — a near-black slate board and the warm off-white you draw with —
with pigment reserved almost entirely for meaning.

### Primary

- **Chalk** (`#f4efe6`): every card title, every control label, the default mark.
  The "ink" of the system. On the light board it inverts to **Ink** (`#2b2620`).
- **Signal Gold** (`#ffd35c`): the single accent. Reserved for the progress ring,
  the brand mark, focus rings, and the one card that is next up. On the light
  board, **Deep Gold** (`#b8860b`).

### Secondary

Status pigment. These three are never decorative — each one *is* a state:

- **Done Green** (`#8ce06a` / light `#357a25`)
- **Doing Amber** (`#ffd35c` / light `#7d5d00`)
- **To-do Blue** (`#6cc4ff` / light `#2472a8`)

### Tertiary

- **Reference Blue** (`#cfe9ff`, light `#2e6da0`): file-link chips.
- **Link Violet** (`#d9c7ff`, light `#6a4fb0`): project-reference chips.

### Neutral

- **Slate Board** (`#0b0b0d`): the surface. Light board: **Warm Paper**
  (`#f6f1e5`).
- **Soft Chalk** (`#9a978f`, light `#6f6a5e`): supporting note text.
- **Quiet Grey** (`#8a8a93`, light `#6f6a5e`): edges and section frames — the
  connective tissue, deliberately below the cards in the hierarchy.
- **Panel** (`#16161a`, light `#fffdf7`): opaque surfaces for transient overlays.

### Named Rules

**The One Loud Thing Rule.** Gold marks exactly one card: the next action.
Highlighting the whole critical path highlights nothing. If two things glow, one
of them is a bug.

**The Semantic Pigment Rule.** The status colours are prohibited as decoration.
If a colour appears on something that is not conveying state, it is wrong.

**The Contrast Floor Rule.** Every status label clears 4.5:1 against its board in
both themes. The light ramp is deepened specifically to hold this line; do not
lighten it back toward the "prettier" pastel values.

## 3. Typography

**Display Font:** Patrick Hand (fallback Gaegu, Comic Sans MS, cursive)
**Body Font:** Patrick Hand — the same family throughout
**Label/Mono Font:** none; labels are the same hand at smaller size and 700 weight

**Character:** One hand writes everything. A product UI does not need a display
pairing, and a second face here would read as costume. Hierarchy comes from size,
weight and case — never from introducing a new voice.

### Hierarchy

- **Display / Section title** (26px, 1.1, +0.5px): section frame headers only.
- **Title / Card** (21px, 1.05): the card headline. Clamped to 3 lines and
  scaled up as the board zooms out (26px, then 34px).
- **Body / Note** (14px, 1.2): supporting detail, clamped to 4 lines, hidden
  entirely below the full zoom band.
- **Label / Status** (13px, 700, +0.8px, uppercase): the status badge. Grows to
  15px then 17px as the board zooms out.
- **Control** (16px): top bar and toolbar.

### Named Rules

**The Grows-When-Small Rule.** Text scales *up* as the board zooms out, never
down. Card text is legible at fit or the detail is dropped instead. Shrinking
type to fit more board is forbidden.

**The Six Word Rule.** Card titles run to about six words. Long titles are a
content bug, not a layout problem — fix the words, not the clamp.

## 4. Elevation

Flat board, floating tools. The canvas is dead paper: cards, sections and edges
have no shadow at all, because they are drawn *onto* the surface rather than
resting on it. Depth exists only where something genuinely hovers above the
board — the top bar and the toolbar — and it is used to say "this is not part of
your drawing".

### Shadow Vocabulary

- **Floating chrome** (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5)`): the top bar
  and toolbar only.
- **Next-up glow** (`filter: drop-shadow(0 0 7px rgba(255, 184, 48, 0.75))`): not
  elevation but attention; the single gold card.

### Named Rules

**The Ink-Not-Object Rule.** A card is a mark on the page, never a card resting
on the page. The moment a card gets a shadow it becomes a UI object and the
sketchbook illusion dies.

**The Earned Blur Rule.** `backdrop-filter` is permitted on exactly the two
surfaces that persistently float over live canvas, where letting the board show
through keeps the user oriented. Transient overlays get an opaque surface. Blur
as a default look is prohibited.

## 5. Components

### Buttons

- **Shape:** softly rounded (10px), transparent by default.
- **Default:** chalk text on nothing; the control is invisible until wanted.
- **Hover / Focus:** hover lifts a faint white wash (`rgba(255,255,255,0.08)`);
  keyboard focus draws a 3px gold ring at 2px offset. Focus is never suppressed.
- **Active:** gold-tinted wash for the engaged tool or mode.
- **Disabled:** 35% opacity, default cursor — used for empty memory slots.
- **Touch:** 44×44 minimum on coarse pointers.

### Chips

- **Style:** hairline pill in the current status colour, 700 weight, uppercase.
- **State:** the status badge is the canonical chip. "Next up" is a gold-outlined
  variant and appears at most once per board.

### Cards / Containers

- **Corner Style:** 16px, drawn as a single wobbling crayon pass — never a CSS
  rectangle.
- **Background:** the board itself shows through; cards are outline only.
- **Shadow Strategy:** none, ever. See Elevation.
- **Border:** a 3.6px crayon stroke in the status colour, one pass.
- **Internal Padding:** 10/14/12px, scaling with card size.
- **Section frames:** 26px corners, 2.8px stroke at 50% opacity, sitting visually
  beneath the cards they contain.

### Inputs / Fields

- **Style:** 8px radius, faint grey fill, hairline border.
- **Focus:** border shifts to gold at 60%; the field never loses its ring.

### Navigation

- **Style:** a single floating bar, centred, wrapping to multiple rows rather
  than overflowing on narrow screens. Controls are grouped by job (view, camera,
  memory, size) with generous gaps between groups and tight gaps within.

### Signature Component: the drawn stroke

Every card, section, edge and arrowhead is generated by rough.js and animated in
by `stroke-dashoffset`, so lines appear to be drawn. **One pass only** —
multi-stroke is disabled, because two overlapping passes read as a confused
double line rather than a crayon mark. Under `prefers-reduced-motion` the stroke
resolves instantly to its finished, fully visible state; it is never merely
suppressed, since visibility is gated behind the animation.

## 6. Do's and Don'ts

### Do:

- **Do** keep the board flat and let only the top bar and toolbar cast a shadow.
- **Do** reserve gold for the single next action and the progress ring.
- **Do** write out the status word — colour never carries state alone.
- **Do** grow type and drop detail as the board zooms out.
- **Do** keep every status label above 4.5:1 in both themes.
- **Do** draw each stroke exactly once, with the wobble intact.
- **Do** give every control a visible keyboard focus ring.

### Don't:

- **Don't** build a **generic SaaS dashboard** — no purple gradients, no identical
  stat-card grids, no hero-metric block.
- **Don't** let it become **childish or toy-like**: no bounce easing, no rainbow
  palettes, no cartoon stickers. Wobble is character; bounce is a toy.
- **Don't** turn it into a **cluttered whiteboard** — every new panel or control
  must displace one that exists.
- **Don't** correct the childish risk by going **cold and corporate**; removing
  the character is the wrong fix.
- **Don't** put a shadow on a card, a section, or an edge.
- **Don't** use `backdrop-filter` on anything that is not persistently floating
  over the canvas.
- **Don't** add a second font family.
- **Don't** shrink text to make more of the board fit.
- **Don't** highlight the whole critical path — one loud thing only.
- **Don't** suppress an animation in a way that leaves geometry invisible.
