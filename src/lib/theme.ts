import type { Status } from "../types";

// Crayon palette as CSS variables so the whole board re-tints when the theme
// flips (dark chalkboard vs. light paper). Values live in styles.css.
// NOTE: use these via `style={{ stroke/fill/color: ... }}` — SVG *presentation
// attributes* (stroke="..." fill="...") cannot resolve var().
export const CRAYON = {
  paper: "var(--paper)",
  chalkWhite: "var(--c-white)",
  yellow: "var(--c-yellow)",
  orange: "var(--c-orange)",
  red: "var(--c-red)",
  pink: "var(--c-pink)",
  purple: "var(--c-purple)",
  blue: "var(--c-blue)",
  teal: "var(--c-teal)",
  green: "var(--c-green)",
  grey: "var(--c-grey)",
  gold: "var(--c-gold)",
};

export const CRAYON_PICKS: string[] = [
  CRAYON.chalkWhite,
  CRAYON.yellow,
  CRAYON.orange,
  CRAYON.red,
  CRAYON.pink,
  CRAYON.purple,
  CRAYON.blue,
  CRAYON.teal,
  CRAYON.green,
];

export function statusColor(status: Status): string {
  switch (status) {
    case "done":
      return CRAYON.green;
    case "doing":
      return CRAYON.yellow;
    case "todo":
    default:
      return CRAYON.blue;
  }
}

export function statusLabel(status: Status): string {
  switch (status) {
    case "done":
      return "done";
    case "doing":
      return "in progress";
    default:
      return "to do";
  }
}

// Stable-ish color from a category string, for optional grouping tint.
export function categoryColor(category?: string): string | undefined {
  if (!category) return undefined;
  const picks = [
    CRAYON.purple,
    CRAYON.teal,
    CRAYON.orange,
    CRAYON.pink,
    CRAYON.blue,
  ];
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return picks[h % picks.length];
}
