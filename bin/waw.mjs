#!/usr/bin/env node
// Where Are We — drop-in CLI.
//
//   where-are-we                 start the board for the current repo (data in ./.waw)
//   where-are-we --data-dir X    use a custom data folder
//   where-are-we --port 9000     prefer a port (walks up if taken)
//   where-are-we --open          open the board in your browser
//   where-are-we init            write AI instructions (AGENTS.md + Cursor rule) into this repo

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { startServer } from "../server/index.mjs";

const args = process.argv.slice(2);

function getFlag(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
}

const cwd = process.cwd();
const dataDir = path.resolve(cwd, String(getFlag("data-dir") ?? ".waw"));

const AGENTS_SNIPPET = (dataPath) => `
## Where Are We — live project board

This repo uses the "Where Are We" visual board. Keep it current by editing exactly
one file: \`${dataPath}/where-are-we.json\`. Edits appear on the canvas live, sketched
in by hand. Read \`${dataPath}/NEXT.md\` for the current next move.

Rules:
- Add a \`project\` node per milestone; assign each a \`section\`; declare \`blockedBy\`.
- Each session, add \`daily\` nodes (day: YYYY-MM-DD) with \`projectRef\` links.
- Update \`status\` (todo/doing/done) + bump \`updatedAt\` as work progresses.
- Keep ids stable; always write valid JSON; never edit \`layout.local.json\`.

Node shape: { id, title, status, note?, view: "project"|"daily", day?, section?,
projectRef?, blockedBy?, link?: {file, line?}, createdAt, updatedAt }
Sections: { id, title, order? } in the top-level "sections" array.
Edges: { id, from, to, label? } in the top-level "edges" array.
`;

const CURSOR_RULE = (dataPath) => `---
description: Keep the live "Where Are We" crayon board updated as you work
alwaysApply: true
---

# Where Are We — live project board

Keep the visual board current by editing \`${dataPath}/where-are-we.json\` (valid JSON,
stable ids, bump updatedAt on change). Add project nodes with a section + blockedBy,
daily nodes with day + projectRef, and edges for flow. Never edit
\`${dataPath}/layout.local.json\`. Read \`${dataPath}/NEXT.md\` for the next move.
`;

async function init() {
  const rel = path.relative(cwd, dataDir).replaceAll("\\", "/") || ".waw";
  // AGENTS.md: append (or create) the board section.
  const agentsPath = path.join(cwd, "AGENTS.md");
  const snippet = AGENTS_SNIPPET(rel);
  if (fs.existsSync(agentsPath)) {
    const existing = await fsp.readFile(agentsPath, "utf8");
    if (!existing.includes("Where Are We — live project board")) {
      await fsp.appendFile(agentsPath, `\n${snippet}`);
      console.log("[waw] appended board instructions to AGENTS.md");
    } else {
      console.log("[waw] AGENTS.md already has board instructions");
    }
  } else {
    await fsp.writeFile(agentsPath, `# Instructions for AI assistants\n${snippet}`);
    console.log("[waw] created AGENTS.md");
  }
  // Cursor rule.
  const ruleDir = path.join(cwd, ".cursor", "rules");
  await fsp.mkdir(ruleDir, { recursive: true });
  await fsp.writeFile(path.join(ruleDir, "where-are-we.mdc"), CURSOR_RULE(rel));
  console.log("[waw] wrote .cursor/rules/where-are-we.mdc");
  console.log(`[waw] done. Start the board with: where-are-we${rel === ".waw" ? "" : ` --data-dir ${rel}`}`);
}

async function main() {
  if (args[0] === "init") {
    await init();
    return;
  }
  const portFlag = getFlag("port");
  const { port } = await startServer({
    dataDir,
    port: portFlag ? Number(portFlag) : 8787,
    strictPort: false,
    serveStatic: true,
    writeGitignore: true,
  });
  const url = `http://localhost:${port}`;
  console.log(`[waw] board ready: ${url}`);
  if (getFlag("open")) {
    const cmd =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(cmd);
  }
}

main().catch((err) => {
  console.error("[waw] fatal:", err.message);
  process.exit(1);
});
