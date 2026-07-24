# HANDOFF — Where Are We: canvas reliability pass

_For Claude Code (or any executor). Work in this repo — not Boostl._

_Created: 2026-07-24 from Bugbot + layout audit. Do not edit `~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`._

---

## Phased plan (overview)

| Phase | Goal | Done when |
|---|---|---|
| **0** | Orient + reproduce flash→black | Can describe the failure sequence; no product fixes yet |
| **1** | Fix camera / flash→black | Reload never leaves an empty black viewport; Fit still works |
| **2** | Fix draw-in vanish | Relayout / rapid AI edits don’t leave invisible cards/edges |
| **3** | Pins + edges + new-card placement | New cards don’t stack on pins; lines don’t cut through cards |
| **4** | Readable cards | Short titles/notes; sizing matches text; AI guidance tightened |
| **5** | Card resize | Drag corner/edge; `w`/`h` persist in `layout.pinned` |
| **6** | Verify + polish | `tsc`/`build` green; smoke on Boostl `.waw`; update HANDOVER |

**Out of scope:** Boostl product code, redesign of crayon aesthetic, rewriting ELK from scratch, editing the v2 plan file under `~/.cursor/plans/`.

---

## Outcome

A stable crayon board that:

1. Does not flash then go black on load/reload
2. Keeps cards/edges visible through re-layout and AI live edits
3. Places new cards without overlapping pinned cards; edges don’t cut through cards
4. Shows short, readable card text (title + note sized correctly)
5. Lets the user resize cards (persist `w`/`h` in layout pins)

---

## Context

| Item | Path / command |
|---|---|
| Repo | `C:\Users\Andre\Where Are We` |
| Host smoke data | `C:\Users\Andre\boostly\.waw\where-are-we.json` |
| Dev | `npm run dev` (Vite `:5173` + server `:8787`) |
| CLI | `node bin/waw.mjs --data-dir <path> --open` |

**Before any Read/Grep/Glob:** if `graphify-out/graph.json` exists, run:

```bash
graphify query "camera fitCamera layoutFlow pins DrawnPath nodeSize"
```

Then read only the files the graph points to.

### Known bug cluster (Bugbot + prior audit)

| Sev | Area | Issue |
|---|---|---|
| high | `src/App.tsx` ~130–341 | Camera init race: saved camera sets `cameraInitRef` before ELK fills `viewRects` → fit skipped forever → off-screen black |
| high | `src/canvas/DrawnPath.tsx` ~81–86 | `anim.cancel()` leaves full `strokeDashoffset` → invisible paths after re-layout |
| high | `src/lib/elklayout.ts` | ELK ignores pinned positions → collisions when AI adds cards |
| high | `src/lib/geometry.ts` `nodeSize` | Height ignores title length → overlap + clipping |
| medium | `src/App.tsx` viewRects | New nodes omitted until ELK promise resolves |
| medium | `src/App.tsx` edges | Unpinned edge routes ignore other pins’ real geometry |

Also: `NodePos` already supports optional `w`/`h` but there is no resize UI.

### Gotchas (from HANDOVER.md)

- SVG: CSS `var()` must be style props, not presentation attrs (`src/lib/theme.ts`)
- Don’t edit `~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`
- Kill orphaned processes on port 8787 before restart
- AI must not casually rewrite host `layout.local.json` (user pins/overrides live there)
- After code changes: `graphify update .`

---

## Constraints

- Surgical diffs only; no unrelated refactors or UI redesign
- Keep crayon aesthetic; don’t replace ELK wholesale
- Preserve: overrides, hiddenIds, undo, daily view, CLI (`bin/waw.mjs`)
- Prefer fixing root causes over band-aids
- Run `npx tsc -b` after each phase; `npm run build` before declaring done

---

## Phases (execute in order; verify before next)

### Phase 0 — Orient + reproduce (no product fixes)

1. Graphify + skim `App.tsx`, `useLive.ts`, `elklayout.ts`, `geometry.ts`, `DrawnPath.tsx`, `HANDOVER.md`
2. Start app against Boostl data:

   ```bash
   node bin/waw.mjs --data-dir "C:\Users\Andre\boostly\.waw" --open
   ```

3. Reproduce flash→black; note whether Fit / Auto-arrange recovers it

→ **Verify:** Written repro notes (2–4 bullets). Stop if you can’t reproduce — ask owner.

### Phase 1 — Camera / flash→black

Fix ordering so first meaningful layout always produces a visible viewport:

- Do not let saved camera permanently block `fitCamera` when `viewRects` were empty at adopt time
- After ELK first populates rects, fit if content would be off-screen / empty world
- Keep intentional user pan/zoom after a successful fit
- Optionally: if demo `data/layout.local.json` has a toxic camera, reset it to empty/default for the demo seed

→ **Verify:** Hard reload 5× — board visible each time without needing Fit. Manual Fit still works. Pan/zoom still saves.

### Phase 2 — DrawnPath cancel safety

On animation cleanup, clear dasharray/dashoffset (or jump to finished visible state) so cancel can’t leave invisible strokes.

→ **Verify:** Rapidly edit `where-are-we.json` (add/remove a card twice) — cards/edges/sections remain visible; no permanent invisible geometry.

### Phase 3 — Layout: pins, new cards, edges

Minimum viable correctness (choose simplest approach that passes verify):

1. Feed pinned positions (and sizes if present) into ELK as fixed/obstacles OR re-layout free nodes around pins
2. While ELK is in flight, keep previous positions and give new nodes a temporary placeholder (don’t omit them)
3. Edge routing must use merged `viewRects` (or re-route when any pin exists) so lines don’t cut through pinned cards

→ **Verify:** Pin a card → AI/file-add a new card in same section → no stack on pin; edges avoid cards. Auto-arrange still clears pins and reflows.

### Phase 4 — Readable cards + AI guidance

1. Include title wrap/length in `nodeSize()`; clamp title visually (CSS/line-clamp)
2. Keep note clamp sensible; ensure ELK height matches rendered height
3. Update `AGENTS.md` (+ host rule snippet if this repo’s `init` template): short title (≤~6 words), one-line note, no paragraphs
4. Optionally trim display of absurdly long notes without mutating AI JSON (overrides only if needed)

→ **Verify:** Long-title card sizes correctly and doesn’t overlap neighbors; board seeded with short copy still looks good.

### Phase 5 — Card resize

1. Corner (or edge) resize handle in `CanvasView` / node interaction
2. Persist `{x,y,w,h}` in `layout.pinned`
3. Include sizes in layout signature / ELK inputs
4. Undo should cover resize

→ **Verify:** Resize a card, reload — size kept; edges still attach; Auto-arrange clears custom size with pins.

### Phase 6 — Ship checklist

1. `npx tsc -b` and `npm run build`
2. Smoke: CLI against Boostl `.waw` + this repo’s `data/`
3. Update `HANDOVER.md` with what shipped + remaining known gaps
4. `graphify update .`
5. Report outcomes (not diffs); batch any owner taste questions

---

## Do not

- Edit Boostl app code or rewrite MONEY-PATH/ROADMAP unless asked
- Touch `~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`
- Large visual redesign / new dependencies without asking
- “Fix” by deleting pins, disabling animations, or hardcoding camera to `0,0` permanently
- Commit/push unless the owner explicitly asks

---

## Escalate to owner (batch)

- Taste: resize handle look, how aggressive title truncation feels
- Whether demo `data/layout.local.json` camera should be wiped in git
- Whether Phase 5 (resize) can slip if 1–4 are solid

---

## Start

Begin Phase 0. After each phase, state verify result in one line, then continue.
