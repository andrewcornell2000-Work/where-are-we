# Graph Report - Where Are We  (2026-07-17)

## Corpus Check
- 24 files · ~8,835 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 164 nodes · 287 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.tsx
- devDependencies
- NodeShape.tsx
- compilerOptions
- index.mjs
- Where Are We
- CanvasView.tsx
- Toolbar.tsx
- Rect

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `Rect` - 9 edges
3. `WawNode` - 8 edges
4. `EdgeShape()` - 7 edges
5. `NodeShape()` - 7 edges
6. `Where Are We` - 7 edges
7. `scripts` - 6 edges
8. `App()` - 6 edges
9. `strokePath()` - 6 edges
10. `NodePos` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `Rect`  [EXTRACTED]
  src/canvas/EdgeShape.tsx → src/lib/geometry.ts
- `Props` --references--> `FreehandStroke`  [EXTRACTED]
  src/canvas/StrokeShape.tsx → src/types.ts
- `App()` --calls--> `computePositions()`  [EXTRACTED]
  src/App.tsx → src/lib/autolayout.ts
- `App()` --calls--> `rectOf()`  [EXTRACTED]
  src/App.tsx → src/lib/geometry.ts
- `App()` --calls--> `useLive()`  [EXTRACTED]
  src/App.tsx → src/lib/useLive.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.15
Nodes (21): App(), nowIso(), todayStr(), computePositions(), nodeSize(), rectOf(), Live, useLive() (+13 more)

### Community 1 - "devDependencies"
Cohesion: 0.07
Nodes (28): allowScripts, esbuild@0.25.12, dependencies, perfect-freehand, react, react-dom, roughjs, description (+20 more)

### Community 2 - "NodeShape.tsx"
Cohesion: 0.16
Nodes (20): DrawnPath(), emitFlakes(), Props, EdgeShape(), NodeShape(), shortFile(), edgeAnchor(), rectCenter() (+12 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 4 - "index.mjs"
Cohesion: 0.16
Nodes (16): broadcast(), buildState(), CONTENT_FILE, DATA_DIR, __dirname, EMPTY_CONTENT, EMPTY_LAYOUT, ensureDataFiles() (+8 more)

### Community 5 - "Where Are We"
Cohesion: 0.12
Nodes (15): A good habit, Hard rules, Instructions for AI assistants working in this project, The file format, Use graphify for accurate connections, What you do, and when, Data schema (`data/where-are-we.json`), How it works (+7 more)

### Community 6 - "CanvasView.tsx"
Cohesion: 0.27
Nodes (12): CanvasView(), distToSegment(), Drag, Props, Props, StrokeShape(), outlineToPath(), strokePath() (+4 more)

### Community 7 - "Toolbar.tsx"
Cohesion: 0.40
Nodes (5): Tool, CRAYON_PICKS, Props, Toolbar(), TOOLS

### Community 9 - "Rect"
Cohesion: 0.40
Nodes (6): EdgeItem, NodeItem, Props, Props, Rect, WawNode

## Knowledge Gaps
- **69 isolated node(s):** `name`, `private`, `version`, `type`, `description` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `private`, `version` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Where Are We` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._