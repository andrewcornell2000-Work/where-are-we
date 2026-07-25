import { useEffect, useRef } from "react";
import { emitFlakes } from "../lib/flakes";

interface Props {
  d: string;
  stroke: string;
  strokeWidth: number;
  /** When true, the line animates as if being sketched from start to finish. */
  draw: boolean;
  delayMs?: number;
  durationMs?: number;
  opacity?: number;
  onDone?: () => void;
}

// A single crayon stroke. If `draw` is set, we measure the path length and
// animate stroke-dashoffset from full -> 0 so the line visibly draws itself,
// while a companion emitter sheds crayon shavings at the moving pen tip.
export function DrawnPath({
  d,
  stroke,
  strokeWidth,
  draw,
  delayMs = 0,
  durationMs = 520,
  opacity = 1,
  onDone,
}: Props) {
  const ref = useRef<SVGPathElement | null>(null);
  const flakesRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !draw) return;
    // Reduced motion: show the finished stroke immediately. Skipping the
    // animation is not enough -- the draw-in gates visibility behind
    // strokeDashoffset, so "no animation" would mean "no board".
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.style.strokeDasharray = "";
      el.style.strokeDashoffset = "";
      onDone?.();
      return;
    }
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      len = 0;
    }
    if (!len) {
      onDone?.();
      return;
    }
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    const anim = el.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: durationMs, delay: delayMs, easing: "ease-in-out", fill: "forwards" },
    );

    // Flake emitter: follow the tip of the line while it draws. Uses a cosine
    // ramp to approximate the stroke animation's ease-in-out timing.
    let raf = 0;
    const start = performance.now() + delayMs;
    const loop = (now: number) => {
      if (now >= start) {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = (1 - Math.cos(Math.PI * t)) / 2;
        const flakes = flakesRef.current;
        if (flakes) {
          try {
            const pt = el.getPointAtLength(eased * len);
            emitFlakes(flakes, pt.x, pt.y, stroke, strokeWidth);
          } catch {
            /* path may detach mid-animation; skip this frame */
          }
        }
        if (t >= 1) return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const finish = () => {
      el.style.strokeDasharray = "";
      el.style.strokeDashoffset = "";
      onDone?.();
    };
    anim.addEventListener("finish", finish);
    return () => {
      cancelAnimationFrame(raf);
      anim.removeEventListener("finish", finish);
      anim.cancel();
      // cancel() reverts to the inline dash styles set above (fully hidden);
      // clear them so an interrupted draw-in can never leave the path invisible.
      el.style.strokeDasharray = "";
      el.style.strokeDashoffset = "";
      flakesRef.current?.replaceChildren();
    };
    // Re-run only when geometry or draw intent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, draw]);

  return (
    <g>
      <path
        ref={ref}
        d={d}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        style={{ stroke }}
      />
      <g ref={flakesRef} pointerEvents="none" />
    </g>
  );
}
