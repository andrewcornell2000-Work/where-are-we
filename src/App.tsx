import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CanvasView } from "./canvas/CanvasView";
import { lodForScale } from "./canvas/lod";
import type { EdgeItem, EraseTarget, NodeItem, SectionItem, Tool } from "./canvas/CanvasView";
import { Toolbar } from "./ui/Toolbar";
import { TopBar } from "./ui/TopBar";
import { InlineEditor } from "./ui/InlineEditor";
import { useLive } from "./lib/useLive";
import { layoutDaily } from "./lib/autolayout";
import { layoutFlow, type FlowLayout } from "./lib/elklayout";
import { analyze } from "./lib/analysis";
import { linearOrder, spineEdges } from "./lib/flow";
import {
  edgeAnchor,
  inflate,
  nodeSize,
  pointInRect,
  polylineHitsAny,
  rectOf,
  rectsOverlap,
  routeEdge,
  type Rect,
} from "./lib/geometry";
import { CRAYON } from "./lib/theme";
import { EMPTY_LAYOUT, nextStatus } from "./types";
import type {
  Camera,
  FreehandStroke,
  NodePos,
  ViewKind,
  WawEdge,
  WawLayout,
  WawNode,
} from "./types";

/**
 * Gap left when shoving an auto-laid card off a pinned one. Must stay wider
 * than twice the edge router's clearance, or the shove creates a corridor no
 * edge can route through and lines end up cutting across cards.
 */
const NUDGE_GAP = 56;

/** Memory-seat style slots for saved arrangements. */
const PRESET_SLOTS = ["1", "2", "3"];

const FIT_MIN = 0.2;
const FIT_MAX = 1.3;
const GHOST_GAP = 140;
const UNDO_LIMIT = 50;

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export default function App() {
  const live = useLive();
  const [layout, setLayout] = useState<WawLayout>(EMPTY_LAYOUT);
  const [camera, setCameraState] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<string>(CRAYON.yellow);
  const [view, setView] = useState<ViewKind>("project");
  const [dailyDay, setDailyDay] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowLayout | null>(null);
  // Card tool is one-shot by default; a second click on the button pins it.
  const [cardPinned, setCardPinned] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("waw-theme") === "light" ? "light" : "dark",
  );

  const [, forceTick] = useReducer((x) => x + 1, 0);

  // Animation bookkeeping (refs so pans/zooms never restart in-flight draw-ins).
  const drawnRef = useRef<Set<string>>(new Set());
  const animRef = useRef<Map<string, number>>(new Map());
  const sigRef = useRef<Map<string, string>>(new Map());
  const doneQueueRef = useRef<Set<string>>(new Set());
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const layoutRef = useRef(layout);
  const cameraRef = useRef(camera);
  layoutRef.current = layout;
  cameraRef.current = camera;

  const lastLocalEditRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cameraInitRef = useRef(false);
  // A camera adopted from disk before ELK produced any rects may frame empty
  // space; it stays unverified until checked against real content rects.
  const cameraCheckedRef = useRef(false);
  const undoRef = useRef<WawLayout[]>([]);
  const lastUndoKeyRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const pendingServerRef = useRef<{ layout: WawLayout; at: number } | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleSave = useCallback(() => {
    lastLocalEditRef.current = Date.now();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      live.saveLayout({ ...layoutRef.current, camera: cameraRef.current });
    }, 550);
  }, [live]);

  const setCamera = useCallback(
    (c: Camera) => {
      // User-driven camera intent always wins; never auto-fit over it later.
      cameraInitRef.current = true;
      cameraCheckedRef.current = true;
      setCameraState(c);
      cameraRef.current = c;
      scheduleSave();
    },
    [scheduleSave],
  );

  const mutateLayout = useCallback(
    (fn: (l: WawLayout) => WawLayout, opts?: { undoKey?: string; undoable?: boolean }) => {
      const undoable = opts?.undoable ?? true;
      if (undoable) {
        const key = opts?.undoKey ?? `k-${Date.now()}`;
        const last = lastUndoKeyRef.current;
        // Collapse rapid same-key mutations (e.g. every pointermove of one drag).
        if (!(opts?.undoKey && last.key === key && Date.now() - last.at < 1200)) {
          undoRef.current.push(JSON.parse(JSON.stringify(layoutRef.current)));
          if (undoRef.current.length > UNDO_LIMIT) undoRef.current.shift();
        }
        lastUndoKeyRef.current = { key, at: Date.now() };
      }
      setLayout((l) => {
        const next = fn(l);
        layoutRef.current = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    setLayout(prev);
    layoutRef.current = prev;
    lastUndoKeyRef.current = { key: "", at: 0 };
    scheduleSave();
  }, [scheduleSave]);

  // Adopt server layout on fresh state. If the user is mid-edit, defer instead of
  // dropping the update (the v1 behavior silently lost it).
  useEffect(() => {
    if (!live.serverLayout) return;
    const adopt = (l: WawLayout) => {
      setLayout(l);
      layoutRef.current = l;
      if (!cameraInitRef.current && l.camera) {
        cameraInitRef.current = true;
        setCameraState(l.camera);
        cameraRef.current = l.camera;
      }
    };
    if (Date.now() - lastLocalEditRef.current >= 1200) {
      adopt(live.serverLayout);
      return;
    }
    pendingServerRef.current = { layout: live.serverLayout, at: Date.now() };
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = setTimeout(() => {
      const pending = pendingServerRef.current;
      if (!pending) return;
      // Discard if we've edited (and therefore saved) since this arrived.
      if (lastLocalEditRef.current > pending.at) {
        pendingServerRef.current = null;
        return;
      }
      adopt(pending.layout);
      pendingServerRef.current = null;
    }, 1400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.serverRev]);

  const cardScale = layout.settings?.cardScale ?? 1;
  const snap = layout.settings?.snap ?? false;
  const linearFlow = layout.settings?.linearFlow ?? true;
  const presets = layout.presets ?? {};
  // Which memory slots are filled, so the buttons can show it.
  const filledSlots = useMemo(
    () => PRESET_SLOTS.filter((k) => !!presets[k]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout.presets],
  );
  const [armSlot, setArmSlot] = useState(false);

  // Apply + persist the theme on the root element so CSS variables flip.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("waw-theme", theme);
  }, [theme]);

  // Card text scales with the card geometry computed in nodeSize().
  useEffect(() => {
    document.documentElement.style.setProperty("--card-scale", String(cardScale));
  }, [cardScale]);

  const onCardScale = useCallback(
    (delta: number) => {
      mutateLayout((l) => {
        const next = Math.round(Math.min(1.6, Math.max(0.8, (l.settings?.cardScale ?? 1) + delta)) * 100) / 100;
        return { ...l, settings: { ...l.settings, cardScale: next } };
      });
    },
    [mutateLayout],
  );

  const onToggleSnap = useCallback(() => {
    mutateLayout((l) => ({ ...l, settings: { ...l.settings, snap: !(l.settings?.snap ?? false) } }));
  }, [mutateLayout]);

  // Memory slots, like the seat buttons in a car: arm "Set", press a number to
  // store the current arrangement; press a number on its own to go back to it.
  const onSavePreset = useCallback(
    (slot: string) => {
      mutateLayout((l) => ({
        ...l,
        presets: {
          ...l.presets,
          [slot]: {
            pinned: JSON.parse(JSON.stringify(l.pinned)),
            camera: cameraRef.current,
            savedAt: nowIso(),
          },
        },
      }));
      setArmSlot(false);
    },
    [mutateLayout],
  );

  const onRecallPreset = useCallback(
    (slot: string) => {
      const p = layoutRef.current.presets?.[slot];
      if (!p) return;
      // Replace rather than merge: going back to a saved arrangement means
      // exactly that arrangement, including cards that are no longer pinned.
      mutateLayout((l) => ({ ...l, pinned: JSON.parse(JSON.stringify(p.pinned)) }));
      if (p.camera) setCamera(p.camera);
    },
    [mutateLayout, setCamera],
  );

  const onToggleFlow = useCallback(() => {
    mutateLayout((l) => ({
      ...l,
      settings: { ...l.settings, linearFlow: !(l.settings?.linearFlow ?? true) },
    }));
  }, [mutateLayout]);

  const onToggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  // Clicking the already-active Card tool pins it; any other selection unpins.
  const onToolSelect = useCallback(
    (t: Tool) => {
      if (t === "text" && tool === "text") {
        setCardPinned(true);
        return;
      }
      setCardPinned(false);
      setTool(t);
    },
    [tool],
  );

  const content = live.content;

  // ---- Merged model (AI content + manual items + user overrides, minus hidden) ----
  const allNodesUnfiltered: WawNode[] = useMemo(() => {
    const base = [...(content?.nodes ?? []), ...layout.manualNodes];
    return base.map((n) => {
      const o = layout.overrides[n.id];
      if (!o) return n;
      return { ...n, title: o.title ?? n.title, note: o.note ?? n.note, status: o.status ?? n.status };
    });
  }, [content, layout.manualNodes, layout.overrides]);

  const allNodes: WawNode[] = useMemo(() => {
    const hidden = new Set(layout.hiddenIds);
    return allNodesUnfiltered.filter((n) => !hidden.has(n.id));
  }, [allNodesUnfiltered, layout.hiddenIds]);

  const nodeById = useMemo(() => {
    const m = new Map<string, WawNode>();
    for (const n of allNodes) m.set(n.id, n);
    return m;
  }, [allNodes]);

  const allEdges: WawEdge[] = useMemo(() => {
    const hiddenE = new Set(layout.hiddenEdgeIds);
    const visible = new Set(allNodes.map((n) => n.id));
    return [...(content?.edges ?? []), ...layout.manualEdges].filter(
      (e) => !hiddenE.has(e.id) && visible.has(e.from) && visible.has(e.to),
    );
  }, [content, layout.manualEdges, layout.hiddenEdgeIds, allNodes]);

  const sections = useMemo(() => content?.sections ?? [], [content]);

  /** section id -> its order, for judging how far an edge reaches. */
  const sectionOrder = useMemo(() => {
    const m = new Map<string, number>();
    [...sections]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((s, i) => m.set(s.id, s.order ?? i));
    return m;
  }, [sections]);

  const projectNodes = useMemo(() => allNodes.filter((n) => n.view === "project"), [allNodes]);

  // Edges as DRAWN. In flow mode the fan-out of a dependency graph is replaced
  // by a single chain so the board reads 1 -> 2 -> 3; hand-drawn connections are
  // always kept. `allEdges` stays the real graph and still drives analysis.
  const drawnEdges: WawEdge[] = useMemo(() => {
    if (!linearFlow || view !== "project") return allEdges;
    const manualIds = new Set(layout.manualEdges.map((m) => m.id));
    return [
      ...spineEdges(linearOrder(projectNodes, allEdges, sectionOrder)),
      ...allEdges.filter((e) => manualIds.has(e.id)),
    ];
  }, [linearFlow, view, projectNodes, allEdges, sectionOrder, layout.manualEdges]);
  const analysis = useMemo(() => analyze(projectNodes, allEdges), [projectNodes, allEdges]);

  const availableDays = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNodes) if (n.view === "daily" && n.day) set.add(n.day);
    return [...set].sort();
  }, [allNodes]);

  const today = todayStr();
  const effectiveDay =
    dailyDay ?? (availableDays.includes(today) ? today : availableDays[availableDays.length - 1] ?? today);

  // Progress logged against the day currently on screen.
  const dayCounts = useMemo(() => {
    const onDay = allNodes.filter((n) => n.view === "daily" && n.day === effectiveDay);
    return {
      done: onDay.filter((n) => n.status === "done").length,
      doing: onDay.filter((n) => n.status === "doing").length,
    };
  }, [allNodes, effectiveDay]);

  const viewNodes = useMemo(() => {
    if (view === "project") return projectNodes;
    return allNodes.filter((n) => n.view === "daily" && n.day === effectiveDay);
  }, [allNodes, projectNodes, view, effectiveDay]);

  // ---- ELK flowchart layout (project view). Pins are applied after, so dragging
  // a card does not trigger a re-flow. ----
  const flowSignature = useMemo(() => {
    if (view !== "project") return "";
    const n = projectNodes
      .map((x) => `${x.id}|${x.section ?? ""}|${x.title.length}|${(x.note ?? "").length}|${x.link ? 1 : 0}|${x.projectRef ? 1 : 0}`)
      .join(";");
    const e = drawnEdges.map((x) => `${x.id}|${x.from}|${x.to}`).join(";");
    const s = sections.map((x) => `${x.id}|${x.order ?? 0}`).join(";");
    return `${n}#${e}#${s}#${cardScale}`;
  }, [view, projectNodes, drawnEdges, sections, cardScale]);

  useEffect(() => {
    if (view !== "project" || projectNodes.length === 0) return;
    let cancelled = false;
    layoutFlow(projectNodes, drawnEdges, sections, cardScale)
      .then((f) => {
        if (!cancelled) setFlow(f);
      })
      .catch((err) => console.error("[waw] elk layout failed:", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowSignature]);

  // ---- Rects for the current view ----
  const daily = useMemo(
    () => (view === "daily" ? layoutDaily(viewNodes, sections, layout.pinned) : null),
    [view, viewNodes, sections, layout.pinned],
  );

  const viewRects = useMemo(() => {
    const map = new Map<string, Rect>();
    if (view === "project") {
      if (!flow) return map;
      const missing: WawNode[] = [];
      for (const n of viewNodes) {
        const pin = layout.pinned[n.id];
        const pos = pin ?? flow.rects[n.id];
        if (!pos) {
          missing.push(n); // brand-new node: ELK pass still in flight
          continue;
        }
        map.set(n.id, rectOf(n, pos, cardScale));
      }
      // Temporary placeholder for brand-new nodes so they render immediately:
      // below their section's cards, or right of all content.
      for (const n of missing) {
        const peers = viewNodes
          .filter((p) => p.section === n.section && map.has(p.id))
          .map((p) => map.get(p.id)!);
        const all = [...map.values()];
        const { w, h } = nodeSize(n, undefined, cardScale);
        let x = 120;
        let y = 120;
        if (peers.length) {
          x = Math.min(...peers.map((r) => r.x));
          y = Math.max(...peers.map((r) => r.y + r.h)) + 28;
        } else if (all.length) {
          x = Math.max(...all.map((r) => r.x + r.w)) + 120;
          y = Math.min(...all.map((r) => r.y));
        }
        map.set(n.id, { x, y, w, h });
      }
      // ELK lays out without knowing about pins; shift auto-laid cards (and
      // placeholders) downward off any pinned card they landed on.
      const pinnedRects = viewNodes
        .filter((n) => layout.pinned[n.id] && map.has(n.id))
        .map((n) => map.get(n.id)!);
      if (pinnedRects.length) {
        for (const n of viewNodes) {
          if (layout.pinned[n.id]) continue;
          let r = map.get(n.id);
          if (!r) continue;
          let guard = 0;
          let moved = false;
          while (guard++ < 20) {
            const hit = pinnedRects.find((p) => rectsOverlap(r!, p, 16));
            if (!hit) break;
            r = { ...r!, y: hit.y + hit.h + NUDGE_GAP };
            moved = true;
          }
          if (moved) map.set(n.id, r!);
        }
      }
    } else if (daily) {
      for (const n of viewNodes) {
        const pos = daily.positions[n.id];
        if (pos) map.set(n.id, rectOf(n, pos, cardScale));
      }
    }
    return map;
  }, [view, viewNodes, flow, layout.pinned, daily, cardScale]);

  // ---- Re-animate nodes whose content changed; drop stale user overrides when
  // the AI itself updates a card. ----
  useEffect(() => {
    if (!content) return;
    let changed = false;
    const staleOverrides: string[] = [];
    for (const n of content.nodes) {
      const prev = sigRef.current.get(n.id);
      if (prev !== undefined && prev !== n.updatedAt) {
        drawnRef.current.delete(n.id);
        changed = true;
        if (layoutRef.current.overrides[n.id]) staleOverrides.push(n.id);
      }
      sigRef.current.set(n.id, n.updatedAt);
    }
    if (staleOverrides.length) {
      mutateLayout(
        (l) => {
          const overrides = { ...l.overrides };
          for (const id of staleOverrides) delete overrides[id];
          return { ...l, overrides };
        },
        { undoable: false },
      );
    }
    if (changed) forceTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Prune animation bookkeeping for items that no longer exist.
  useEffect(() => {
    const valid = new Set<string>([
      ...allNodesUnfiltered.map((n) => n.id),
      ...(content?.edges ?? []).map((e) => e.id),
      ...layout.manualEdges.map((e) => e.id),
      ...sections.map((s) => s.id),
    ]);
    for (const ref of [drawnRef.current]) {
      for (const id of [...ref]) if (!valid.has(id)) ref.delete(id);
    }
    for (const id of [...sigRef.current.keys()]) if (!valid.has(id)) sigRef.current.delete(id);
    for (const id of [...animRef.current.keys()]) if (!valid.has(id)) animRef.current.delete(id);
  }, [allNodesUnfiltered, content, layout.manualEdges, sections]);

  // First-load framing (deliberately does NOT schedule a layout save). Runs once
  // real rects exist: adopts a fit when no camera was restored, and rescues a
  // restored camera that frames empty space (saved against stale content, or
  // adopted before ELK produced any rects).
  useEffect(() => {
    if (cameraCheckedRef.current) return;
    if (!content || viewRects.size === 0) return;
    cameraCheckedRef.current = true;
    const rects = [...viewRects.values()];
    if (cameraInitRef.current && contentVisible(cameraRef.current, rects)) return;
    cameraInitRef.current = true;
    const c = fitCamera(rects);
    if (c) {
      setCameraState(c);
      cameraRef.current = c;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, viewRects.size]);

  // Lazily decide draw-in animation for an id (memoization cache in refs; safe to
  // mutate during render, required so new items animate on their first paint).
  const ensureAnim = useCallback((id: string): { draw: boolean; delay: number } => {
    if (drawnRef.current.has(id)) return { draw: false, delay: 0 };
    const existing = animRef.current.get(id);
    if (existing !== undefined) return { draw: true, delay: existing };
    const delay = Math.min(animRef.current.size, 10) * 170;
    animRef.current.set(id, delay);
    return { draw: true, delay };
  }, []);

  // Batched animation completion (one re-render per burst, not one per stroke).
  const onAnimDone = useCallback((id: string) => {
    doneQueueRef.current.add(id);
    if (doneTimerRef.current) return;
    doneTimerRef.current = setTimeout(() => {
      for (const done of doneQueueRef.current) {
        animRef.current.delete(done);
        drawnRef.current.add(done);
      }
      doneQueueRef.current.clear();
      doneTimerRef.current = undefined;
      forceTick();
    }, 60);
  }, []);

  // ---- Build render items ----
  const nodeItems: NodeItem[] = [];
  const edgeItems: EdgeItem[] = [];
  const sectionItems: SectionItem[] = [];

  if (view === "project" && flow) {
    // Section containers: bounding box of member rects (tracks pinned cards too).
    for (const s of [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      const members = viewNodes.filter((n) => n.section === s.id);
      const rects = members.map((n) => viewRects.get(n.id)).filter((r): r is Rect => !!r);
      if (!rects.length) continue;
      const minX = Math.min(...rects.map((r) => r.x)) - 34;
      const minY = Math.min(...rects.map((r) => r.y)) - 78;
      const maxX = Math.max(...rects.map((r) => r.x + r.w)) + 34;
      const maxY = Math.max(...rects.map((r) => r.y + r.h)) + 34;
      const a = ensureAnim(s.id);
      const sp = analysis.sectionProgress[s.id] ?? { done: 0, total: 0 };
      sectionItems.push({
        id: s.id,
        title: s.title,
        rect: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        nodeIds: members.filter((n) => viewRects.has(n.id)).map((n) => n.id),
        color: s.color,
        done: sp.done,
        total: sp.total,
        draw: a.draw,
        delay: a.delay,
      });
    }

    for (const e of drawnEdges) {
      const from = viewRects.get(e.from);
      const to = viewRects.get(e.to);
      if (!from || !to) continue;
      // ELK's route is only trusted while it still matches reality: both
      // endpoints must attach to the cards' current rects and the path must
      // not cut through any other card (pins move cards after layout).
      const obstacles = [...viewRects.entries()]
        .filter(([id]) => id !== e.from && id !== e.to)
        .map(([, r]) => r);
      const route = flow.routes[e.id];
      let points =
        route &&
        route.length >= 2 &&
        pointInRect(inflate(from, 20), route[0][0], route[0][1]) &&
        pointInRect(inflate(to, 20), route[route.length - 1][0], route[route.length - 1][1]) &&
        !polylineHitsAny(route, obstacles.map((r) => inflate(r, 9)))
          ? route
          : undefined;
      if (!points) points = routeEdge(from, to, obstacles);
      const a = ensureAnim(e.id);
      // An edge that jumps more than one section is a long-range dependency.
      // It still matters, but drawn at full weight it competes with the
      // step-by-step flow; quieting it lets the eye follow the spine first.
      const fromSec = sectionOrder.get(nodeById.get(e.from)?.section ?? "");
      const toSec = sectionOrder.get(nodeById.get(e.to)?.section ?? "");
      const quiet = fromSec !== undefined && toSec !== undefined && toSec - fromSec > 1;
      edgeItems.push({
        id: e.id,
        points,
        label: e.label,
        quiet,
        draw: a.draw,
        delay: a.delay,
        erasable: true,
      });
    }
  }

  if (view === "daily" && daily) {
    // Group headers as light section frames (no ring).
    for (const h of daily.headers) {
      const members = viewNodes.filter((n) =>
        h.id === "__log" ? !n.section || !sections.some((s) => s.id === n.section) : n.section === h.id,
      );
      const rects = members.map((n) => viewRects.get(n.id)).filter((r): r is Rect => !!r);
      if (!rects.length) continue;
      const minX = Math.min(...rects.map((r) => r.x)) - 28;
      const minY = Math.min(...rects.map((r) => r.y)) - 64;
      const maxX = Math.max(...rects.map((r) => r.x + r.w)) + 28;
      const maxY = Math.max(...rects.map((r) => r.y + r.h)) + 28;
      sectionItems.push({
        id: `day-${h.id}`,
        title: h.title,
        rect: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        nodeIds: members.filter((n) => viewRects.has(n.id)).map((n) => n.id),
        done: 0,
        total: 0,
        draw: false,
        delay: 0,
      });
    }
  }

  for (const n of viewNodes) {
    const rect = viewRects.get(n.id);
    if (!rect) continue;
    const a = ensureAnim(n.id);
    nodeItems.push({
      node: n,
      rect,
      draw: a.draw,
      delay: a.delay,
      selected: selectedId === n.id,
      isNext: view === "project" && analysis.nextId === n.id,
      interactive: true,
      projectRefTitle: n.view === "daily" && n.projectRef ? nodeById.get(n.projectRef)?.title : undefined,
    });
  }

  if (view === "daily") {
    // Ghost previews of the linked project card (render-only, never interactive).
    for (const n of viewNodes) {
      if (!n.projectRef) continue;
      const proj = nodeById.get(n.projectRef);
      const dailyRect = viewRects.get(n.id);
      if (!proj || !dailyRect) continue;
      const ghostRect: Rect = {
        x: dailyRect.x + dailyRect.w + GHOST_GAP,
        y: dailyRect.y,
        w: dailyRect.w,
        h: dailyRect.h,
      };
      const highlighted = selectedId === n.id;
      nodeItems.push({
        node: { ...proj, id: `ghost-${n.id}` },
        rect: ghostRect,
        draw: false,
        delay: 0,
        selected: false,
        dimmed: !highlighted,
        interactive: false,
      });
      edgeItems.push({
        id: `link-${n.id}`,
        points: [
          edgeAnchor(dailyRect, ghostRect.x, ghostRect.y + ghostRect.h / 2),
          edgeAnchor(ghostRect, dailyRect.x + dailyRect.w, dailyRect.y + dailyRect.h / 2),
        ],
        color: highlighted ? CRAYON.chalkWhite : CRAYON.grey,
        draw: false,
        delay: 0,
        dimmed: !highlighted,
        erasable: false,
      });
    }
  }

  // ---- Camera helpers ----
  // True when the camera shows a meaningful slice of the content bounds
  // (more than a sliver in both dimensions).
  function contentVisible(cam: Camera, rects: Rect[]): boolean {
    if (!rects.length) return false;
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));
    const sx0 = minX * cam.scale + cam.x;
    const sy0 = minY * cam.scale + cam.y;
    const sx1 = maxX * cam.scale + cam.x;
    const sy1 = maxY * cam.scale + cam.y;
    const overlapW = Math.min(sx1, window.innerWidth) - Math.max(sx0, 0);
    const overlapH = Math.min(sy1, window.innerHeight) - Math.max(sy0, 0);
    return overlapW > 80 && overlapH > 60;
  }

  function fitCamera(rects: Rect[]): Camera | null {
    if (!rects.length) return null;
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));
    const pad = 44;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.max(FIT_MIN, Math.min(FIT_MAX, Math.min(vw / (maxX - minX + pad * 2), vh / (maxY - minY + pad * 2))));
    const cx = minX + (maxX - minX) / 2;
    const cy = minY + (maxY - minY) / 2;
    return { scale, x: vw / 2 - cx * scale, y: vh / 2 - cy * scale };
  }

  const onFit = useCallback(() => {
    const rects = [...viewRects.values(), ...sectionItems.map((s) => s.rect)];
    const c = fitCamera(rects);
    if (c) setCamera(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRects, setCamera]);

  const jumpToNode = useCallback(
    (id: string) => {
      const n = nodeById.get(id);
      const r = viewRects.get(id);
      if (!n || !r) return;
      const scale = Math.max(0.85, cameraRef.current.scale);
      const [cx, cy] = [r.x + r.w / 2, r.y + r.h / 2];
      setCamera({ scale, x: window.innerWidth / 2 - cx * scale, y: window.innerHeight / 2 - cy * scale });
      setSelectedId(id);
    },
    [nodeById, viewRects, setCamera],
  );

  const onLatest = useCallback(() => {
    let latest: WawNode | null = null;
    for (const n of viewNodes) if (!latest || n.updatedAt > latest.updatedAt) latest = n;
    if (latest) jumpToNode(latest.id);
  }, [viewNodes, jumpToNode]);

  const onJumpToNext = useCallback(() => {
    if (analysis.nextId) {
      if (view !== "project") setView("project");
      jumpToNode(analysis.nextId);
    }
  }, [analysis.nextId, view, jumpToNode]);

  // ---- Mutations ----
  const onMoveNode = useCallback(
    (id: string, pos: NodePos) => {
      // Spread over any existing pin so a custom size survives a later drag.
      mutateLayout((l) => ({ ...l, pinned: { ...l.pinned, [id]: { ...l.pinned[id], ...pos } } }), {
        undoKey: `move-${id}`,
      });
    },
    [mutateLayout],
  );

  // Dragging a section header moves every card in it as one, pinning them all.
  // A single undo key means the whole drag collapses to one undo step.
  const onMoveGroup = useCallback(
    (positions: Record<string, NodePos>) => {
      const ids = Object.keys(positions);
      if (!ids.length) return;
      mutateLayout(
        (l) => {
          const pinned = { ...l.pinned };
          for (const id of ids) pinned[id] = { ...pinned[id], ...positions[id] };
          return { ...l, pinned };
        },
        { undoKey: `group-${ids.slice().sort()[0]}` },
      );
    },
    [mutateLayout],
  );

  // Resizing pins the card at its current spot with an explicit size
  // (Auto-arrange clears it along with position pins).
  const onResizeNode = useCallback(
    (id: string, pos: NodePos) => {
      mutateLayout((l) => ({ ...l, pinned: { ...l.pinned, [id]: pos } }), { undoKey: `resize-${id}` });
    },
    [mutateLayout],
  );

  const onAutoArrange = useCallback(() => {
    mutateLayout((l) => ({ ...l, pinned: {} }));
  }, [mutateLayout]);

  const onAddNode = useCallback(
    (pos: { x: number; y: number }) => {
      const id = `manual-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
      const node: WawNode = {
        id,
        title: "New card",
        status: "todo",
        view,
        day: view === "daily" ? effectiveDay : undefined,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      drawnRef.current.add(id);
      mutateLayout((l) => ({
        ...l,
        manualNodes: [...l.manualNodes, node],
        pinned: { ...l.pinned, [id]: { x: pos.x, y: pos.y } },
      }));
      setSelectedId(id);
      setEditingId(id);
      // One-shot Card tool: hand control back to Pan unless the user pinned it.
      if (!cardPinned) setTool("pan");
    },
    [view, effectiveDay, mutateLayout, cardPinned],
  );

  const onAddStroke = useCallback(
    (s: FreehandStroke) => {
      mutateLayout((l) => ({ ...l, strokes: [...l.strokes, s] }));
    },
    [mutateLayout],
  );

  const onConnectClick = useCallback(
    (nodeId: string) => {
      if (!connectSourceId) {
        setConnectSourceId(nodeId);
        return;
      }
      if (connectSourceId !== nodeId) {
        const edge: WawEdge = {
          id: `medge-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          from: connectSourceId,
          to: nodeId,
        };
        drawnRef.current.add(edge.id);
        mutateLayout((l) => ({ ...l, manualEdges: [...l.manualEdges, edge] }));
      }
      setConnectSourceId(null);
    },
    [connectSourceId, mutateLayout],
  );

  const onErase = useCallback(
    (t: EraseTarget) => {
      if (t.kind === "stroke") {
        mutateLayout((l) => ({ ...l, strokes: l.strokes.filter((s) => s.id !== t.id) }));
        return;
      }
      if (t.kind === "edge") {
        const isManual = layoutRef.current.manualEdges.some((e) => e.id === t.id);
        mutateLayout((l) =>
          isManual
            ? { ...l, manualEdges: l.manualEdges.filter((e) => e.id !== t.id) }
            : { ...l, hiddenEdgeIds: [...new Set([...l.hiddenEdgeIds, t.id])] },
        );
        return;
      }
      const isManual = layoutRef.current.manualNodes.some((n) => n.id === t.id);
      if (isManual) {
        mutateLayout((l) => {
          const pinned = { ...l.pinned };
          delete pinned[t.id];
          const overrides = { ...l.overrides };
          delete overrides[t.id];
          return {
            ...l,
            manualNodes: l.manualNodes.filter((n) => n.id !== t.id),
            manualEdges: l.manualEdges.filter((e) => e.from !== t.id && e.to !== t.id),
            pinned,
            overrides,
          };
        });
      } else {
        mutateLayout((l) => ({ ...l, hiddenIds: [...new Set([...l.hiddenIds, t.id])] }));
      }
      if (selectedId === t.id) setSelectedId(null);
      if (editingId === t.id) setEditingId(null);
    },
    [mutateLayout, selectedId, editingId],
  );

  const onUnhide = useCallback(
    (id: string) => {
      mutateLayout((l) => ({ ...l, hiddenIds: l.hiddenIds.filter((h) => h !== id) }));
    },
    [mutateLayout],
  );

  const onCycleStatus = useCallback(
    (id: string) => {
      const current = nodeById.get(id);
      if (!current) return;
      const ns = nextStatus(current.status);
      const isManual = layoutRef.current.manualNodes.some((n) => n.id === id);
      if (isManual) {
        mutateLayout((l) => ({
          ...l,
          manualNodes: l.manualNodes.map((n) => (n.id === id ? { ...n, status: ns, updatedAt: nowIso() } : n)),
        }));
      } else {
        mutateLayout((l) => ({
          ...l,
          overrides: { ...l.overrides, [id]: { ...l.overrides[id], status: ns } },
        }));
      }
    },
    [nodeById, mutateLayout],
  );

  const onEditCommit = useCallback(
    (title: string, note: string) => {
      const id = editingId;
      if (!id) return;
      const isManual = layoutRef.current.manualNodes.some((n) => n.id === id);
      if (isManual) {
        mutateLayout((l) => ({
          ...l,
          manualNodes: l.manualNodes.map((n) =>
            n.id === id ? { ...n, title, note: note || undefined, updatedAt: nowIso() } : n,
          ),
        }));
      } else {
        mutateLayout((l) => ({
          ...l,
          overrides: { ...l.overrides, [id]: { ...l.overrides[id], title, note: note || undefined } },
        }));
      }
      setEditingId(null);
    },
    [editingId, mutateLayout],
  );

  const onView = useCallback((v: ViewKind) => {
    setView(v);
    setSelectedId(null);
    setConnectSourceId(null);
    setEditingId(null);
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "Escape") {
        setConnectSourceId(null);
        setSelectedId(null);
        setEditingId(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        onErase({ kind: "node", id: selectedId });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, selectedId, onErase]);

  const title = content?.title ?? "Where Are We";
  const nextNode = analysis.nextId ? nodeById.get(analysis.nextId) ?? null : null;
  const hiddenNodes = useMemo(
    () => allNodesUnfiltered.filter((n) => layout.hiddenIds.includes(n.id)),
    [allNodesUnfiltered, layout.hiddenIds],
  );
  const editingRect = editingId ? viewRects.get(editingId) : undefined;
  const editingNode = editingId ? nodeById.get(editingId) : undefined;

  return (
    <div className="app">
      <TopBar
        title={title}
        view={view}
        onView={onView}
        day={effectiveDay}
        availableDays={availableDays}
        onDay={setDailyDay}
        isToday={effectiveDay === today}
        dayDone={dayCounts.done}
        dayDoing={dayCounts.doing}
        connected={live.connected}
        donePct={analysis.donePct}
        nextNode={nextNode ?? null}
        hiddenNodes={hiddenNodes}
        theme={theme}
        onToggleTheme={onToggleTheme}
        cardScale={cardScale}
        onCardScale={onCardScale}
        snap={snap}
        onToggleSnap={onToggleSnap}
        linearFlow={linearFlow}
        onToggleFlow={onToggleFlow}
        presetSlots={PRESET_SLOTS}
        filledSlots={filledSlots}
        armSlot={armSlot}
        onArmSlot={setArmSlot}
        onSavePreset={onSavePreset}
        onRecallPreset={onRecallPreset}
        onFit={onFit}
        onLatest={onLatest}
        onAutoArrange={onAutoArrange}
        onJumpToNext={onJumpToNext}
        onUnhide={onUnhide}
      />
      <Toolbar tool={tool} color={color} cardPinned={cardPinned} onTool={onToolSelect} onColor={setColor} />
      <CanvasView
        sections={sectionItems}
        nodes={nodeItems}
        edges={edgeItems}
        strokes={layout.strokes}
        tool={tool}
        color={color}
        camera={camera}
        lod={lodForScale(camera.scale)}
        snap={snap}
        connectSourceId={connectSourceId}
        onCamera={setCamera}
        onSelect={setSelectedId}
        onMoveNode={onMoveNode}
        onMoveGroup={onMoveGroup}
        onResizeNode={onResizeNode}
        onAddNode={onAddNode}
        onAddStroke={onAddStroke}
        onConnectClick={onConnectClick}
        onErase={onErase}
        onCycleStatus={onCycleStatus}
        onEditRequest={setEditingId}
        onAnimDone={onAnimDone}
      />
      {editingId && editingRect && editingNode && (
        <InlineEditor
          rect={editingRect}
          camera={camera}
          title={editingNode.title}
          note={editingNode.note ?? ""}
          onCommit={onEditCommit}
          onCancel={() => setEditingId(null)}
        />
      )}
      {!content && <div className="loading">connecting to your live board…</div>}
      {content && view === "project" && !flow && viewNodes.length > 0 && (
        <div className="loading">sketching the layout…</div>
      )}
      {view === "daily" && viewNodes.length === 0 && content && (
        <div className="empty-hint">Nothing logged for {effectiveDay} yet. Your AI will draw here as you work.</div>
      )}
    </div>
  );
}
