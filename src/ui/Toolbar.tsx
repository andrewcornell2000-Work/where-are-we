import type { Tool } from "../canvas/CanvasView";
import { CRAYON_PICKS } from "../lib/theme";

interface Props {
  tool: Tool;
  color: string;
  /** True when the Card tool was clicked twice and stays selected after use. */
  cardPinned: boolean;
  onTool: (t: Tool) => void;
  onColor: (c: string) => void;
}

const TOOLS: Array<{ id: Tool; label: string; glyph: string; hint: string }> = [
  { id: "pan", label: "Pan", glyph: "✋", hint: "Drag the page around" },
  { id: "select", label: "Move", glyph: "➤", hint: "Select & move cards" },
  { id: "draw", label: "Draw", glyph: "✎", hint: "Freehand crayon" },
  { id: "connect", label: "Connect", glyph: "↝", hint: "Link two cards" },
  { id: "text", label: "Card", glyph: "＋", hint: "Add a card" },
  { id: "eraser", label: "Erase", glyph: "⌫", hint: "Remove / hide" },
];

export function Toolbar({ tool, color, cardPinned, onTool, onColor }: Props) {
  return (
    <div className="toolbar">
      {TOOLS.map((t) => {
        const pinned = t.id === "text" && cardPinned;
        const hint =
          t.id === "text"
            ? `${t.hint} (click again to keep the tool selected)`
            : t.hint;
        return (
          <button
            key={t.id}
            className={`tool ${tool === t.id ? "active" : ""} ${pinned ? "pinned" : ""}`}
            title={`${t.label} — ${hint}`}
            onClick={() => onTool(t.id)}
          >
            <span className="tool-glyph">{t.glyph}</span>
            <span className="tool-label">{t.label}</span>
          </button>
        );
      })}

      <div className="toolbar-sep" />

      <div className="crayons" title="Crayon color">
        {CRAYON_PICKS.map((c) => (
          <button
            key={c}
            className={`crayon ${color === c ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => onColor(c)}
            aria-label={`crayon ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
