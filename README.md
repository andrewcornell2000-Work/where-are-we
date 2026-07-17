# Where Are We

An infinite, pannable **black crayon-sketch canvas** that your AI draws onto **live** so you never lose track of where you're up to.

Your assistant edits one JSON file. The app watches it and animates new pieces being
**sketched in by hand** (lines literally draw themselves start to finish). v2 renders a
**structured flowchart**: labeled **sections** contain your cards, edges are **routed
around cards** (no more overlapping lines), the **critical path glows gold**, and a
"**Do this next**" banner always points at the single next move.

Works the same whether your AI is in **Cursor** or you're on the web with **Claude** —
anything that can edit a file can drive the board. And it's a **drop-in tool**: run it
inside any repo with the `where-are-we` CLI.

---

## Quick start (this repo, dev mode)

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — in a browser, or inside Cursor:
Command Palette → **Simple Browser: Show** → `http://localhost:5173`.

## Quick start (any other repo)

```bash
npm run build            # once, in this repo
npm link                 # once, to expose the CLI (or npm i -g from a registry later)

cd /your/other/project
where-are-we init        # writes AI instructions (AGENTS.md + Cursor rule) into that repo
where-are-we --open      # starts the board; data lives in ./.waw/
```

The CLI serves the prebuilt app itself (one process), auto-creates `.waw/` with an
empty board + a `.gitignore` for the local-only files, and walks up the port ladder
if 8787 is taken. Flags: `--data-dir <path>`, `--port <n>`, `--open`.

---

## How it works

| File | Owner | Contents |
| --- | --- | --- |
| `data/where-are-we.json` | **your AI** | sections, nodes (cards), edges, statuses, notes, dependencies |
| `data/layout.local.json` | **the app** | pinned positions, freehand strokes, your manual cards/edges, hidden ids, your title/note/status overrides, camera |
| `data/NEXT.md` | **generated** | tiny "do this next" breadcrumb any AI can read after a context reset |

Merged by id at render time — the AI updates content without ever stomping what you
arranged or edited by hand.

```
AI edits where-are-we.json
        │  file watch (handles atomic-rename saves too)
        ▼
 server broadcasts over WebSocket + regenerates NEXT.md
        │
        ▼
 elkjs lays out sections + cards, routes edges orthogonally around them
        │
        ▼
 new/changed items sketch themselves in, crayon-style
```

## The board

- **Sections** — labeled crayon containers grouping cards, each with a progress ring.
- **Auto-first layout** — elkjs (Eclipse Layout Kernel) computes a left-to-right
  flowchart. Drag a card to **pin** it; **Auto-arrange** clears pins and re-flows.
- **Critical path** — the longest chain of unfinished work glows gold.
- **Do this next** — the banner under the top bar names the first ready card on the
  critical path; click it to fly there. The top bar shows overall % done.
- **Daily view** — today's log grouped by section, each entry linked (`↳`) to the
  project card it advanced. Ghost previews are display-only.

## Tools

| Tool | What it does |
| --- | --- |
| Pan | Drag the background (works in Move mode too) |
| Move | Drag cards (pins them); click a card's **status dot** to cycle todo → doing → done |
| Draw | Freehand crayon in the current color (sheds shavings as you draw) |
| Connect | Click one card, then another → arrow (Escape cancels) |
| Card | Click empty space → new card with inline editor |
| Erase | Remove strokes/manual items; AI cards/edges are hidden (recoverable via **Hidden** panel) |

**Double-click** any card to edit its title/note in place. **Ctrl+Z** undoes
erase/move/draw/add. **Delete** erases the selected card. **Wheel** zooms; **Fit** /
**Latest** frame the camera.

Your edits to AI cards (status/title/note) are stored as *overrides* in the layout
file — the AI's file stays untouched, and if the AI later updates that card, its
fresh content wins and the stale override is dropped.

---

## Data schema (`where-are-we.json`)

```jsonc
{
  "version": 2,
  "title": "Where Are We",
  "sections": [
    { "id": "sec-core", "title": "Core Engine", "order": 1 }
  ],
  "nodes": [
    {
      "id": "proj-auth",             // stable + unique. Never reuse for a different thing.
      "title": "User auth",
      "status": "doing",             // "todo" | "doing" | "done" -> drives color
      "note": "JWT + middleware",    // optional detail line
      "view": "project",             // "project" | "daily"
      "section": "sec-core",         // which container it lives in
      "blockedBy": ["proj-db"],      // dependencies -> ready state + critical path
      "day": "2026-07-17",           // REQUIRED for daily nodes
      "projectRef": "proj-auth",     // daily -> project link
      "link": { "file": "src/auth.ts", "line": 12 },
      "createdAt": "2026-07-17T09:00:00.000Z",
      "updatedAt": "2026-07-17T09:00:00.000Z"
    }
  ],
  "edges": [
    { "id": "e-db-auth", "from": "proj-db", "to": "proj-auth", "label": "then" }
  ]
}
```

Rules of thumb for the AI: give every project card a `section` and `blockedBy`;
add daily nodes each session with `projectRef`; bump `updatedAt` on meaningful
change (that re-triggers the sketch-in animation); keep ids stable; never touch
`layout.local.json`. Full instructions in [`AGENTS.md`](AGENTS.md).

---

## Project layout

```
bin/waw.mjs           drop-in CLI (init / start, --data-dir, --port, --open)
server/index.mjs      live WebSocket + file-watch server; serves dist/ in CLI mode;
                      atomic writes, port ladder, NEXT.md generator
data/                 where-are-we.json (AI) + layout.local.json (app) + NEXT.md (generated)
src/
  App.tsx             orchestration: merge, ELK flow, analysis, undo, editing
  canvas/             SVG canvas, section/node/edge/stroke shapes, draw-in animation
  lib/                elklayout (ELK), analysis (critical path), rough shapes,
                      freehand + simplify, geometry, theme, live socket
  ui/                 top bar (next banner, progress, hidden panel), toolbar, inline editor
```
