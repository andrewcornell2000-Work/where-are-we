// Where Are We — local live server (v2).
//
// - Watches <dataDir>/where-are-we.json (AI-owned content) and
//   <dataDir>/layout.local.json (app-owned layout); pushes combined state to
//   every connected browser over a WebSocket the instant either changes.
// - Receives layout saves from the browser and writes them back atomically.
// - Writes <dataDir>/NEXT.md — a tiny "do this next" breadcrumb any AI can read
//   cheaply after a context reset.
// - Can serve the prebuilt dist/ so the CLI runs as a single process in any repo.

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import chokidar from "chokidar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");

const EMPTY_CONTENT = { version: 2, title: "Where Are We", sections: [], nodes: [], edges: [] };
const EMPTY_LAYOUT = {
  version: 2,
  pinned: {},
  strokes: [],
  manualNodes: [],
  manualEdges: [],
  hiddenIds: [],
  hiddenEdgeIds: [],
  overrides: {},
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function log(...args) {
  console.log("[waw]", ...args);
}

/** Migrate/normalize any layout shape (including v1 files) to v2. */
function normalizeLayout(raw) {
  const l = raw && typeof raw === "object" ? raw : {};
  return {
    version: 2,
    pinned: { ...(l.positions ?? {}), ...(l.pinned ?? {}) },
    strokes: Array.isArray(l.strokes) ? l.strokes : [],
    manualNodes: Array.isArray(l.manualNodes) ? l.manualNodes : [],
    manualEdges: Array.isArray(l.manualEdges) ? l.manualEdges : [],
    hiddenIds: Array.isArray(l.hiddenIds) ? l.hiddenIds : [],
    hiddenEdgeIds: Array.isArray(l.hiddenEdgeIds) ? l.hiddenEdgeIds : [],
    overrides: l.overrides && typeof l.overrides === "object" ? l.overrides : {},
    camera: l.camera,
  };
}

function isValidLayoutPayload(l) {
  return (
    l &&
    typeof l === "object" &&
    (l.pinned === undefined || typeof l.pinned === "object") &&
    (l.strokes === undefined || Array.isArray(l.strokes)) &&
    (l.manualNodes === undefined || Array.isArray(l.manualNodes)) &&
    (l.manualEdges === undefined || Array.isArray(l.manualEdges)) &&
    (l.hiddenIds === undefined || Array.isArray(l.hiddenIds)) &&
    (l.hiddenEdgeIds === undefined || Array.isArray(l.hiddenEdgeIds)) &&
    (l.overrides === undefined || typeof l.overrides === "object")
  );
}

async function writeJsonAtomic(file, data) {
  const tmp = `${file}.tmp-${process.pid}`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
  await fsp.rename(tmp, file);
}

// ---------- NEXT.md (dependency analysis, mirrors src/lib/analysis.ts) ----------

function analyzeContent(content) {
  const nodes = (content.nodes ?? []).filter((n) => n.view === "project");
  const edges = content.edges ?? [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const deps = new Map(nodes.map((n) => [n.id, new Set((n.blockedBy ?? []).filter((d) => byId.has(d)))]));
  for (const e of edges) {
    if (byId.has(e.from) && byId.has(e.to)) deps.get(e.to).add(e.from);
  }
  const isDone = (id) => byId.get(id)?.status === "done";
  const ready = nodes.filter((n) => n.status !== "done" && [...deps.get(n.id)].every(isDone));

  // Longest incomplete chain (critical path) via Kahn + DP.
  const inc = nodes.filter((n) => n.status !== "done").map((n) => n.id);
  const incSet = new Set(inc);
  const succ = new Map(inc.map((id) => [id, []]));
  const indeg = new Map(inc.map((id) => [id, 0]));
  for (const id of inc) {
    for (const d of deps.get(id)) {
      if (incSet.has(d)) {
        succ.get(d).push(id);
        indeg.set(id, indeg.get(id) + 1);
      }
    }
  }
  const order = [];
  const queue = inc.filter((id) => indeg.get(id) === 0);
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const s of succ.get(id)) {
      indeg.set(s, indeg.get(s) - 1);
      if (indeg.get(s) === 0) queue.push(s);
    }
  }
  const best = new Map(order.map((id) => [id, 1]));
  const prev = new Map(order.map((id) => [id, null]));
  for (const id of order) {
    for (const s of succ.get(id)) {
      if (best.get(id) + 1 > (best.get(s) ?? 0)) {
        best.set(s, best.get(id) + 1);
        prev.set(s, id);
      }
    }
  }
  let endId = null;
  let endLen = 0;
  for (const [id, len] of best) if (len > endLen) ((endLen = len), (endId = id));
  const chain = [];
  for (let cur = endId; cur; cur = prev.get(cur)) chain.unshift(cur);
  const readyIds = new Set(ready.map((n) => n.id));
  const nextId = chain.find((id) => readyIds.has(id)) ?? ready.map((n) => n.id).sort()[0] ?? null;

  const done = nodes.filter((n) => n.status === "done").length;
  return { nodes, byId, ready, chain, nextId, done, total: nodes.length };
}

function renderNextMd(content) {
  const a = analyzeContent(content);
  const pct = a.total ? Math.round((a.done / a.total) * 100) : 0;
  const lines = [
    `# Where Are We — next up`,
    ``,
    `Progress: ${a.done}/${a.total} done (${pct}%)`,
    ``,
  ];
  if (a.nextId) {
    const n = a.byId.get(a.nextId);
    lines.push(`## Do this next`, ``, `- **${n.title}**${n.note ? ` — ${n.note}` : ""}`, ``);
  }
  const otherReady = a.ready.filter((n) => n.id !== a.nextId);
  if (otherReady.length) {
    lines.push(`## Also ready`, ``);
    for (const n of otherReady.slice(0, 5)) lines.push(`- ${n.title}${n.note ? ` — ${n.note}` : ""}`);
    lines.push(``);
  }
  if (a.chain.length > 1) {
    lines.push(`## Critical path`, ``, a.chain.map((id) => a.byId.get(id)?.title ?? id).join(" -> "), ``);
  }
  lines.push(`_(generated by Where Are We — do not edit; edit where-are-we.json instead)_`, ``);
  return lines.join("\n");
}

// ---------- Server ----------

export async function startServer(options = {}) {
  const dataDir = path.resolve(options.dataDir ?? path.join(PKG_ROOT, "data"));
  const basePort = Number(options.port ?? process.env.WAW_PORT ?? 8787);
  const strictPort = options.strictPort ?? true;
  const serveStatic = options.serveStatic ?? false;
  const distDir = options.distDir ?? path.join(PKG_ROOT, "dist");

  const CONTENT_FILE = path.join(dataDir, "where-are-we.json");
  const LAYOUT_FILE = path.join(dataDir, "layout.local.json");
  const NEXT_FILE = path.join(dataDir, "NEXT.md");

  await fsp.mkdir(dataDir, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) await writeJsonAtomic(CONTENT_FILE, EMPTY_CONTENT);
  if (!fs.existsSync(LAYOUT_FILE)) await writeJsonAtomic(LAYOUT_FILE, EMPTY_LAYOUT);
  if (options.writeGitignore) {
    const gi = path.join(dataDir, ".gitignore");
    if (!fs.existsSync(gi)) await fsp.writeFile(gi, "layout.local.json\nNEXT.md\n*.tmp-*\n");
  }

  let lastContent = EMPTY_CONTENT;
  let lastLayout = EMPTY_LAYOUT;
  let suppressLayoutUntil = 0;

  async function readJson(file, fallback) {
    try {
      const raw = await fsp.readFile(file, "utf8");
      if (!raw.trim()) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      log(`could not parse ${path.basename(file)} (${err.message}); keeping last good copy`);
      return null;
    }
  }

  async function buildState() {
    const content = await readJson(CONTENT_FILE, EMPTY_CONTENT);
    const layout = await readJson(LAYOUT_FILE, EMPTY_LAYOUT);
    if (content) lastContent = content;
    if (layout) lastLayout = normalizeLayout(layout);
    return { type: "state", content: lastContent, layout: lastLayout };
  }

  async function refreshNextMd() {
    try {
      await fsp.writeFile(NEXT_FILE, renderNextMd(lastContent));
    } catch (err) {
      log("failed to write NEXT.md:", err.message);
    }
  }

  const server = http.createServer(async (req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    if (url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, dataDir }));
      return;
    }
    if (!serveStatic) {
      res.writeHead(404);
      res.end();
      return;
    }
    // Static serving of the built app (CLI mode).
    const rel = url === "/" ? "index.html" : url.slice(1);
    const file = path.join(distDir, path.normalize(rel));
    if (!file.startsWith(distDir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const body = await fsp.readFile(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      // SPA fallback
      try {
        const body = await fsp.readFile(path.join(distDir, "index.html"));
        res.writeHead(200, { "content-type": MIME[".html"] });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("Build not found. Run: npm run build");
      }
    }
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  // The http server's listen errors are re-emitted on the WebSocketServer; the
  // retry/exit logic lives on the http server handler, so swallow them here.
  wss.on("error", () => {});

  function broadcast(message, except) {
    const data = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client !== except && client.readyState === 1) client.send(data);
    }
  }

  wss.on("connection", async (socket) => {
    log("client connected");
    socket.send(JSON.stringify(await buildState()));

    socket.on("message", async (raw) => {
      if (raw.length > 8 * 1024 * 1024) return; // sanity cap
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg?.type === "saveLayout" && isValidLayoutPayload(msg.layout)) {
        try {
          const normalized = normalizeLayout(msg.layout);
          suppressLayoutUntil = Date.now() + 1500;
          await writeJsonAtomic(LAYOUT_FILE, normalized);
          lastLayout = normalized;
          broadcast({ type: "state", content: lastContent, layout: lastLayout }, socket);
        } catch (err) {
          log("failed to write layout:", err.message);
        }
      }
    });

    socket.on("close", () => log("client disconnected"));
  });

  const watcher = chokidar.watch([CONTENT_FILE, LAYOUT_FILE], {
    ignoreInitial: true,
    // Editors and AI tools often save via write-temp-then-rename, which emits
    // add/unlink instead of change — handle all three.
    awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 30 },
  });

  const onFsEvent = async (file) => {
    const base = path.basename(file);
    if (base === path.basename(LAYOUT_FILE) && Date.now() < suppressLayoutUntil) return;
    log(`${base} changed -> pushing update`);
    broadcast(await buildState());
    if (base === path.basename(CONTENT_FILE)) await refreshNextMd();
  };
  watcher.on("change", onFsEvent);
  watcher.on("add", onFsEvent);

  // Initial state + NEXT.md
  await buildState();
  await refreshNextMd();

  // Port handling: strict (dev, proxy points at a fixed port) fails loudly;
  // CLI mode walks up the port ladder until a free one is found.
  const port = await new Promise((resolve, reject) => {
    let attempt = basePort;
    const tryListen = () => {
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          if (strictPort) {
            reject(
              new Error(
                `Port ${attempt} is already in use. Is another "Where Are We" running? ` +
                  `Set WAW_PORT to use a different port.`,
              ),
            );
            return;
          }
          attempt += 1;
          if (attempt > basePort + 20) {
            reject(new Error("No free port found in range."));
            return;
          }
          tryListen();
        } else {
          reject(err);
        }
      });
      server.listen(attempt, () => resolve(attempt));
    };
    tryListen();
  });

  log(`live server on http://localhost:${port}  (ws: /ws)`);
  log(`data dir: ${dataDir}`);
  return { server, port, dataDir };
}

// Run directly (dev mode: `node server/index.mjs`).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer({ strictPort: true }).catch((err) => {
    console.error("[waw] fatal:", err.message);
    process.exit(1);
  });
}
