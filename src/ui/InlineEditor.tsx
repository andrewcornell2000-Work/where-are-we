import { useEffect, useRef, useState } from "react";
import type { Camera } from "../types";
import type { Rect } from "../lib/geometry";

interface Props {
  rect: Rect;
  camera: Camera;
  title: string;
  note: string;
  onCommit: (title: string, note: string) => void;
  onCancel: () => void;
}

/** In-place card editor rendered as an HTML overlay above the canvas. */
export function InlineEditor({ rect, camera, title, note, onCommit, onCancel }: Props) {
  const [t, setT] = useState(title);
  const [n, setN] = useState(note);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  // Clamp to the viewport so the editor (and its buttons) never render off-screen.
  const width = Math.max(220, rect.w * camera.scale);
  const approxHeight = 170;
  const left = Math.min(
    Math.max(8, rect.x * camera.scale + camera.x),
    Math.max(8, window.innerWidth - width - 8),
  );
  const top = Math.min(
    Math.max(8, rect.y * camera.scale + camera.y),
    Math.max(8, window.innerHeight - approxHeight - 8),
  );

  const commit = () => onCommit(t.trim() || title, n.trim());

  return (
    <div className="inline-editor" style={{ left, top, width }}>
      <input
        ref={titleRef}
        value={t}
        onChange={(e) => setT(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Title"
      />
      <textarea
        value={n}
        onChange={(e) => setN(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Note (optional)"
        rows={2}
      />
      <div className="inline-editor-actions">
        <button onClick={commit}>Save</button>
        <button className="ghost-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
