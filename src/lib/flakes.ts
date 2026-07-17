const SVG_NS = "http://www.w3.org/2000/svg";

// Keep the debris light: cap the number of live flakes per emitter group.
const MAX_FLAKES = 48;

// Shed a couple of chalk/crayon shavings at (x, y). Flakes are plain SVG rects
// animated imperatively (WAAPI) and removed on finish, so React never
// re-renders for them.
export function emitFlakes(
  group: SVGGElement,
  x: number,
  y: number,
  color: string,
  strokeWidth: number,
) {
  if (group.childElementCount > MAX_FLAKES) return;
  const count = Math.random() < 0.55 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const flake = document.createElementNS(SVG_NS, "rect");
    const s = (0.7 + Math.random() * 1.5) * Math.max(1, strokeWidth * 0.55);
    const jx = (Math.random() - 0.5) * strokeWidth * 1.6;
    const jy = (Math.random() - 0.5) * strokeWidth;
    flake.setAttribute("x", `${x + jx}`);
    flake.setAttribute("y", `${y + jy}`);
    flake.setAttribute("width", `${s}`);
    flake.setAttribute("height", `${s * (0.5 + Math.random() * 0.7)}`);
    flake.setAttribute("rx", `${s * 0.25}`);
    // Set fill via style so CSS variables (theme-aware colors) resolve.
    flake.style.fill = color;
    flake.setAttribute("opacity", "0.85");
    // Rotate around the flake itself, not the SVG origin.
    flake.style.transformBox = "fill-box";
    flake.style.transformOrigin = "center";
    group.appendChild(flake);

    const fall = 7 + Math.random() * 16;
    const driftX = (Math.random() - 0.5) * 12;
    const rot = (Math.random() - 0.5) * 260;
    const life = 420 + Math.random() * 480;
    const anim = flake.animate(
      [
        { transform: "translate(0px, 0px) rotate(0deg)", opacity: 0.85 },
        { transform: `translate(${driftX}px, ${fall}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: life, easing: "cubic-bezier(0.25, 0.8, 0.4, 1)", fill: "forwards" },
    );
    anim.addEventListener("finish", () => flake.remove());
  }
}
