# HANDOVER — Where Are We v2 (paused mid-verification)

_Last updated: 2026-07-17, paused so work can continue from another machine._

## What this project is

A live, infinite, black crayon-sketch canvas that an AI keeps updated as it works, so
the user ("where are we?") always sees project progress as a structured flowchart.
The AI edits `data/where-are-we.json`; a Node server watches the file and pushes over
WebSocket; the React app sketches changes in with a hand-drawn animation.

Read `README.md` for user-facing docs and `AGENTS.md` for the AI-editing contract.
The v2 plan being implemented is `~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`
(do **not** edit the plan file).

## Where things stand

**All v2 code is written and typechecks clean (`npx tsc -b` passes, no lint errors).**
The app runs via `npm run dev` (Vite on 5173, WS server on 8787). Most of the
browser verification checklist has passed. A few items remain (see below).

### v2 features implemented (all plan sections)

1. **Schema v2** (`src/types.ts`, seed `data/where-are-we.json`): `sections[]`,
   `node.section`, `node.blockedBy`, layout v2 = `{ pinned, strokes, manualNodes,
   manualEdges, hiddenIds, hiddenEdgeIds, overrides, camera }`. Server migrates v1
   layouts (`positions` → `pinned`) in `normalizeLayout()`.
2. **ELK flowchart** (`src/lib/elklayout.ts`): sections = ELK compound nodes, layered
   left-to-right, `edgeRouting: ORTHOGONAL`, `hierarchyHandling: INCLUDE_CHILDREN`,
   edges declared at root. Uses the bundled main-thread build (`elkjs/lib/elk.bundled.js`,
   type shim in `src/elk-bundled.d.ts`) — graphs are tiny, worker not needed.
3. **Sections render** (`src/canvas/SectionShape.tsx`): crayon container + hand-written
   header + progress ring. Render order: sections → edges → strokes → cards.
4. **Routed edges** (`crayonPolyline` in `src/lib/rough.ts`, rewritten
   `src/canvas/EdgeShape.tsx`): ELK bend points as crayon polylines, draw-in animation
   preserved. Pinned-endpoint edges fall back to straight anchor lines (`App.tsx`).
5. **Analysis** (`src/lib/analysis.ts` + JS mirror in `server/index.mjs`): deps =
   `blockedBy` ∪ incoming edges; ready set; critical path (Kahn + DP over incomplete
   nodes) → gold glow (`.glow-gold`); "Do this next" banner + camera jump; % ring in
   top bar; server writes `data/NEXT.md` on every content change.
6. **Audit bug fixes**: ghosts inert (`interactive: false`, skipped in all hit tests);
   atomic writes (tmp + rename); chokidar watches `add` too + `awaitWriteFinish`;
   listen error handler (strict in dev, port ladder in CLI mode; ws error swallowed —
   it re-emits http errors); saveLayout payload validation; `ws`/`chokidar` moved to
   `dependencies`; first-load fit no longer saves; deferred (not dropped) server-layout
   adoption when mid-edit; RDP stroke simplification (`src/lib/simplify.ts`).
7. **Perf**: `React.memo` on Node/Edge/Section shapes; world-wrapping `feTurbulence`
   filter removed; `onAnimDone` batched (60 ms queue → one re-render).
8. **Editing + undo** (`App.tsx`, `src/ui/InlineEditor.tsx`): status-dot click cycles
   todo→doing→done (AI cards get `overrides[id].status`; the AI file is never touched;
   overrides auto-drop when the AI later updates that card); double-click opens inline
   editor; undo stack (50, Ctrl+Z, drag moves collapsed via undoKey); Escape/Delete;
   Hidden-cards flyout with unhide; eraser hides AI edges (`hiddenEdgeIds`) and deletes
   manual ones.
9. **CLI** (`bin/waw.mjs` + `startServer(options)` export): `where-are-we
   [--data-dir .waw] [--port n] [--open]` serves built `dist/` statically (SPA
   fallback), auto-creates data dir with `.gitignore`, port ladder; `where-are-we init`
   writes AGENTS.md section + `.cursor/rules/where-are-we.mdc` into a host repo.
   `package.json` has `bin`, `files`, v2.0.0.
10. **Docs**: README, AGENTS.md, `.cursor/rules/where-are-we.mdc` all rewritten for v2
    (sections, blockedBy, overrides, NEXT.md, CLI usage, graphify guidance).

### Verification already PASSED (live browser via Playwright MCP)

- Seed renders as 3-section flowchart; **zero edge-over-card overlaps** (sampled every
  routed path point vs every card rect — empty overlap set).
- Live edit of `where-are-we.json` → new card + edge appeared in its section without
  reload; chart re-flowed.
- NEXT.md generated with correct critical path ("Structured flow -> Drop-in CLI ->
  Use it every day") and 50% progress.
- "Do this next" banner names the right card; clicking centers + selects it (dist 0px).
- Status-dot click cycled todo → in progress; wrote `overrides` (AI file untouched).
- Double-click inline editor renamed a card; **Ctrl+Z twice** reverted rename then
  status — both restored correctly.
- Eraser on an AI edge → `hiddenEdgeIds`; eraser on an AI card → hidden + "Hidden (1)"
  button → flyout → Unhide restored it.
- Ghost cards in Daily view are inert (eraser click did nothing, no junk ids saved).
- Daily view renders grouped by section headers with ghost project cards to the right.
- Drag pinned a card into `layout.pinned`; **Auto-arrange** cleared pins and re-flowed.
- Freehand draw: 61 raw pointer samples saved as **21 points** (RDP works).

### Verification REMAINING (was mid-flight when paused)

1. **Stroke erase**: first eraser click at the stroke midpoint didn't remove it (file
   still showed 1 stroke); a second click at the stroke's start point was just fired
   but the result was **not yet checked**. If it still fails, suspect: the world
   y-coordinate of the stroke vs the click (the sine wave amplitude is ±30 world units
   at scale ~0.85 — the midpoint click at screen (300,600) may simply have been >26
   world units from the polyline). Re-test by clicking exactly on a saved point from
   `layout.local.json`, and check `hitStroke` tolerance in `CanvasView.tsx`.
2. **Production build**: `npm run build` not yet run (only `tsc -b`).
3. **CLI portability run**: `node bin/waw.mjs --data-dir <scratch>` in an empty folder
   → serves dist, creates `.waw`-style data dir + gitignore, port ladder when 8787
   busy; `bin/waw.mjs init` output files look right.
4. **Two-tab test**: open two browser tabs, edit in one, confirm the other converges
   (deferred adoption in `App.tsx` — pending layout applied ~1.4 s after local edits
   stop, discarded if a newer local edit happened).
5. **Critical path updates live**: flip a status in the JSON and confirm the gold path
   + banner recompute.
6. `graphify update .` after everything settles (workspace rule).
7. Clean test residue if any remains in `data/layout.local.json` (should be empty now)
   and kill the dev servers when done.

### Gotchas the next agent should know

- **Do not edit the plan file** (`~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`).
- The user (or another session) has been making **parallel tweaks**: a flakes/shavings
  effect (`src/lib/flakes.ts`, wired into `DrawnPath` + `CanvasView`), a theme system
  (CRAYON colors are now CSS `var(--…)` — **SVG presentation attributes can't resolve
  var(); use style props for stroke/fill**, see note in `src/lib/theme.ts`), a
  `cardPinned` prop on `Toolbar`, and an extra seed node `day-1-polish`. Re-read files
  before editing; don't assume they match what this transcript wrote.
- Dev servers run via `npm run dev` (concurrently). Kill orphaned `node` processes on
  8787 before restarting (`Get-NetTCPConnection -LocalPort 8787`) — Stop-Process on the
  npm parent orphans the child.
- Playwright MCP testing trick: real clicks fail on off-viewport SVG; dispatch
  synthetic `PointerEvent`s on `svg.canvas` with computed clientX/Y (see
  `window.__fire`/`window.__nodeScreen` helpers used in this session's evaluates).
- `data/NEXT.md` and `.waw/` are gitignored; `data/layout.local.json` is committed
  (deliberately — it's the demo starting state, kept empty).

## How to resume

```bash
npm install
npm run dev          # server :8787 + vite :5173
# then work through "Verification REMAINING" above
npm run build
node bin/waw.mjs --data-dir C:\temp\waw-test --open
```

The task tracker: all v2 todos are complete except **verify-v2** (in progress).
