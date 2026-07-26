# Graph Report - C:\Users\andre\AppData\Local\Temp\claude\repos\where-are-we  (2026-07-26)

## Corpus Check
- Corpus is ~28,633 words - fits in a single context window. You may not need a graph.

## Summary
- 285 nodes · 509 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14

## God Nodes (most connected - your core abstractions)
1. `App()` - 19 edges
2. `compilerOptions` - 17 edges
3. `Rect` - 13 edges
4. `WawNode` - 13 edges
5. `CanvasView()` - 9 edges
6. `nodeSize()` - 8 edges
7. `Canvas reliability phased plan (0-6)` - 8 edges
8. `scripts` - 7 edges
9. `startServer()` - 7 edges
10. `pointInRect()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `The Six Word Rule` --semantically_similar_to--> `Card copy writing rules`  [INFERRED] [semantically similar]
  DESIGN.md → AGENTS.md
- `Brand personality (hand-drawn, calm, credible)` --semantically_similar_to--> `The Architect's Sketchbook (creative north star)`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN.md
- `Product design principles` --semantically_similar_to--> `The One Loud Thing Rule`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN.md
- `Accessibility & inclusion defaults` --semantically_similar_to--> `The Contrast Floor Rule`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN.md
- `Anti-references (SaaS dashboard, childish, cluttered whiteboard, cold corporate)` --semantically_similar_to--> `Design Do's and Don'ts`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Canvas reliability pass: plan, bug cluster, and shipped fixes** — handoff_canvas_fix_phased_plan, handoff_canvas_fix_bug_cluster, handover_canvas_reliability_pass [EXTRACTED 0.95]
- **where-are-we.json shared data contract across AI-editing, README schema, and handover file split** — agents_where_are_we_json, readme_data_schema, handover_data_files_split [INFERRED 0.85]
- **Crayon brand identity: north star, anti-references, and design principles together define the product's visual/voice contract** — design_architects_sketchbook, product_anti_references, product_design_principles [INFERRED 0.85]

## Communities (16 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (38): App(), nowIso(), PRESET_SLOTS, todayStr(), NodeItem, SectionItem, lodForScale(), Analysis (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (41): Card copy writing rules, daily node (work session log), board edges (start -> finish flow), graphify query/update workflow, AGENTS.md hard rules, data/layout.local.json (user layout), data/NEXT.md breadcrumb, project node (milestone) (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (22): DrawnPath(), Props, EdgeShape, Props, Props, SectionShape, emitFlakes(), polylineMidpoint() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (25): devDependencies, concurrently, elkjs, perfect-freehand, react, react-dom, roughjs, @types/react (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (23): bin, where-are-we, dependencies, chokidar, ws, description, files, name (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (20): AGENTS_SNIPPET(), args, CURSOR_RULE(), cwd, dataDir, getFlag(), init(), main() (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (18): CanvasView(), Drag, EdgeItem, EraseTarget, Props, Lod, NodeShape, Props (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (17): Live, useLive(), wsUrl(), Camera, ClientMessage, EdgeStyle, EMPTY_LAYOUT, NodeLink (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (7): ELK, ElkEdgeSection, ElkExtendedEdge, elkjs/lib/elk.bundled.js, ElkLabel, ElkNode, ElkPoint

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): The Architect's Sketchbook (creative north star), Design Do's and Don'ts, The One Loud Thing Rule, Anti-references (SaaS dashboard, childish, cluttered whiteboard, cold corporate), Brand personality (hand-drawn, calm, credible), Product design principles

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (5): Tool, CRAYON_PICKS, Props, Toolbar(), TOOLS

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (3): The Earned Blur Rule, Elevation model (flat board, floating tools), The Ink-Not-Object Rule

## Ambiguous Edges - Review These
- `Card resize shipped feature` → `Canvas tools (pan, move, draw, connect, card, erase)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **86 isolated node(s):** `args`, `cwd`, `dataDir`, `name`, `version` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Card resize shipped feature` and `Canvas tools (pan, move, draw, connect, card, erase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useLive()` connect `Community 8` to `Community 0`, `Community 9`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `args`, `cwd`, `dataDir` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11193339500462535 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06097560975609756 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10887096774193548 - nodes in this community are weakly interconnected._