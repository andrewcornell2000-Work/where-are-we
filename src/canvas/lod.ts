// Level of detail for cards, chosen by zoom.
//
// A board that fits the screen is often zoomed out far enough that 21px card
// text renders under 12px — legible only if you lean in. Rather than trade
// "see the whole board" against "read the cards", we drop detail as we zoom
// out and spend the freed space on a bigger title.

export type Lod = "full" | "compact" | "minimal";

export function lodForScale(scale: number): Lod {
  if (scale >= 0.7) return "full";
  if (scale >= 0.45) return "compact";
  return "minimal";
}
