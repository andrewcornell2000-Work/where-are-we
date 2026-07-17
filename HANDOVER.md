# HANDOVER — Where Are We v2 (verification complete, ready to use)

_Last updated: 2026-07-17 1:56 PM (UTC+10). Verified on second machine; safe to resume anywhere._

## What this project is

A live, infinite, black crayon-sketch canvas that an AI keeps updated as it works, so
the user ("where are we?") always sees project progress as a structured flowchart.
The AI edits `data/where-are-we.json`; a Node server watches the file and pushes over
WebSocket; the React app sketches changes in with a hand-drawn animation.

Read `README.md` for user-facing docs and `AGENTS.md` for the AI-editing contract.
The v2 plan that was implemented is `~/.cursor/plans/where_are_we_v2_bb5edd65.plan.md`
(do **not** edit the plan file — it also only exists on the original machine).

## Where things stand

**v2 is DONE and fully verified.** All code implemented, `npm run build` passes
(tsc + vite), and the complete browser verification checklist has passed — including
the items that were mid-flight in the previous handover:

- **Stroke erase** — works. The earlier "failure" was a miss: clicking exactly on a
  saved stroke point removes it correctly (`hitStroke` tolerance is fine as-is).
- **Production build** — `npm run build` clean. One non-blocking warning: the JS
  bundle is 1.67 MB minified (mostly elkjs + roughjs). Optional future improvement,
  not a defect.
- **CLI portability** — `node bin/waw.mjs --data-dir <scratch>` in a fresh dir
  creates the data dir (`where-are-we.json`, `layout.local.json`, `.gitignore`,
  `NEXT.md`) and serves dist. A second instance on the same port correctly walked
  the ladder 8787 → 8788. `bin/waw.mjs init` writes correct AGENTS.md +
  `.cursor/rules/where-are-we.mdc` into a host repo.
- **Two-tab sync** — edit in one tab appears in the other (deferred adoption works,
  both immediately and after the 1.4 s settle).
- **Live critical path** — flipping statuses in `where-are-we.json` recomputed the
  gold path, the "Do this next" banner, the % ring (88%), and `data/NEXT.md`.
- `graphify update .` has been run; graph outputs are current.
- Test residue cleaned: `data/layout.local.json` is empty again (only camera), all
  test servers stopped, scratch dirs deleted.

## Board state (data/where-are-we.json)

7/8 project nodes done. Only **proj-ship** ("Use it every day") remains, status
`doing` — the app is built; the remaining "work" is simply using it in daily Cursor
sessions.

## What to do next (nothing is blocked)

1. **Use the board in real work** — run `npm run dev` (or `node bin/waw.mjs` for the
   single-process CLI), keep it open, and let the AI update
   `data/where-are-we.json` per `AGENTS.md`. When it's proven in daily use, flip
   `proj-ship` to `done`.
2. Optional polish (only if desired, not required):
   - Code-split the bundle (elkjs dynamic import) to quiet the 500 kB chunk warning.
   - Publish to npm (`package.json` already has `bin`, `files`, v2.0.0).

## Machine setup notes (fresh machine)

```bash
npm install        # required first — repo does not commit node_modules
npm run dev        # dev: WS server :8787 + Vite :5173
npm run build      # tsc -b && vite build → dist/
node bin/waw.mjs --data-dir <dir> --open   # CLI mode, serves dist/
```

- No package-lock.json is committed; `npm install` resolves fresh.
- Playwright browser for MCP testing must be installed per-machine:
  `npx @playwright/mcp install-browser chrome-for-testing`.
- Kill orphaned node processes on 8787 before restarting dev
  (`Get-NetTCPConnection -LocalPort 8787` on Windows) — stopping the npm parent
  can orphan the child.

## Gotchas that still apply

- **Never edit** `data/layout.local.json` (user layout; committed deliberately as
  the empty demo starting state) or `data/NEXT.md` (generated).
- CRAYON colors are CSS `var(--…)` — SVG presentation attributes can't resolve
  var(); use style props for stroke/fill (see `src/lib/theme.ts`).
- `data/layout.local.json` may show as modified in git on Windows due to LF→CRLF
  only; check `git diff` before assuming real changes.
- Playwright trick for canvas testing: real clicks on toolbar buttons work, but for
  canvas interactions use `page.mouse` at viewport coords, and read
  `data/layout.local.json` to verify saves (debounce ≈ 550 ms, so wait ~1 s).
