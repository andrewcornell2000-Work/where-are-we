# Instructions for AI assistants working in this project

This project has a live visual board called **Where Are We** — a crayon-sketch
flowchart the user keeps open to see where they're up to. **You keep it up to date by
editing exactly one file:** `data/where-are-we.json`. Edits appear on the canvas within
a moment, sketched in by hand.

Also generated for you: `data/NEXT.md` — the current "do this next" breadcrumb. Read it
after a context reset to instantly know the next move. Never edit `NEXT.md` or
`data/layout.local.json` (the user's hand-arranged layout and personal edits).

## What you do, and when

1. **New milestone** → add a `project` node. Give it a `section` (create the section in
   the top-level `sections` array if needed) and declare `blockedBy` with the ids of
   prerequisites. This powers the flowchart layout, the gold critical path, and the
   "Do this next" banner — so be accurate about dependencies.
2. **Progress** → update the node's `status` (`todo` → `doing` → `done`) and bump
   `updatedAt` (that re-animates the card so the user notices).
3. **Each work session** → add `daily` nodes describing what you did, with `day` set to
   today (`YYYY-MM-DD`), a `section`, and `projectRef` pointing at the project node it
   advanced.
4. **Flow** → add `edges` between project nodes so the chart reads start → finish.
   Edges also count as dependencies for the critical path.

## Use graphify for accurate connections

This repo has a knowledge graph at `graphify-out/`. Before writing `link` fields or
drawing `edges`/`blockedBy` between board nodes, run `graphify query "<question>"` (or
`graphify path "A" "B"`) to check how the code actually connects — then declare
dependencies that reflect the real structure, not guesses. After modifying code, run
`graphify update .` so the graph stays current.

## The file format

```jsonc
{
  "version": 2,
  "title": "Where Are We",
  "sections": [
    { "id": "sec-backend", "title": "Backend", "order": 1 },
    { "id": "sec-frontend", "title": "Frontend", "order": 2 }
  ],
  "nodes": [
    {
      "id": "proj-auth",              // unique + STABLE. Reuse the same id when updating.
      "title": "User auth",
      "status": "doing",              // "todo" | "doing" | "done"
      "note": "JWT sessions + middleware",
      "view": "project",
      "section": "sec-backend",
      "blockedBy": ["proj-db"],       // prerequisites (ids of other project nodes)
      "createdAt": "2026-07-17T09:00:00.000Z",
      "updatedAt": "2026-07-17T09:00:00.000Z"
    },
    {
      "id": "day-2026-07-17-login",
      "title": "Wired up the login route",
      "status": "done",
      "view": "daily",
      "day": "2026-07-17",            // REQUIRED for daily nodes
      "section": "sec-backend",
      "projectRef": "proj-auth",      // links this back to the project node
      "createdAt": "2026-07-17T11:00:00.000Z",
      "updatedAt": "2026-07-17T11:00:00.000Z"
    }
  ],
  "edges": [
    { "id": "e-db-auth", "from": "proj-db", "to": "proj-auth" }
  ]
}
```

### Writing card copy

Cards are small sticky notes, not paragraphs:

- **`title`: ≤ ~6 words.** It's rendered big in a hand-written font and clamped at
  3 lines — front-load the meaning.
- **`note`: one short line** of detail (a command, a path, a number). It's clamped at
  4 lines on the card; anything longer is lost. Put long explanations in your normal
  docs, not the board.

**Write it so a person can read it, not a compiler.** The board is glanced at, often
weeks later, often by someone who has forgotten the details. A title has to make sense
cold.

- **No invented internal nouns.** "Pause-on-post hard rail" means nothing to a reader.
  Say what it *does*: "Ads always start paused".
- **No unexplained acronyms or flag names in the title.** `META_LIVE`, `CONNECT_ONLY`
  and the like belong in the `note`, not the headline. Title: "Turn ads on for real".
- **Say the outcome, not the mechanism.** "Fee cron live-only guard" → "Only charge
  fees on real campaigns".
- **Plain verbs beat nouns.** "Meta payment account restored" reads better as
  "Fix the Meta payment account".

Quick test: if a friend who has never seen the codebase read the title aloud, would
they know what finishing it means? If not, rewrite it.

### Hard rules

- **Never change an existing `id`** to mean something new — ids anchor the user's
  layout, overrides, and animation diffing.
- **Always keep valid JSON.** Read → modify → write the whole file.
- **Do not set colors.** Color comes from `status` (done=green, doing=yellow, todo=blue);
  the critical path is highlighted automatically.
- **Bump `updatedAt`** on meaningful change. Note: if the user hand-edited a card
  (status/title/note override), your update replaces their override — only touch cards
  you have real news about.
- **Only edit `data/where-are-we.json`.** Never `layout.local.json` or `NEXT.md`.

### A good habit

At the end of a session: every touched milestone has an accurate `status`; today has at
least one `daily` node with `projectRef`; new milestones have `section`, `blockedBy`,
and connecting `edges`. Then the user opens the board and immediately sees where they
are, what's done, and what's next.
