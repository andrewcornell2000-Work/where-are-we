import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev mode: Vite serves the UI on :5173 and proxies /ws through to the local
// live server. The port must match server/index.mjs — both read WAW_PORT.
const wsPort = process.env.WAW_PORT || "8787";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/ws": {
        target: `ws://localhost:${wsPort}`,
        ws: true,
      },
    },
  },
});
