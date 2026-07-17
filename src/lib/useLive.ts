import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage, WawContent, WawLayout } from "../types";

function wsUrl(): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/ws`;
}

export interface Live {
  content: WawContent | null;
  serverLayout: WawLayout | null;
  /** Increments every time the server sends fresh state. */
  serverRev: number;
  connected: boolean;
  saveLayout: (layout: WawLayout) => void;
}

export function useLive(): Live {
  const [content, setContent] = useState<WawContent | null>(null);
  const [serverLayout, setServerLayout] = useState<WawLayout | null>(null);
  const [serverRev, setServerRev] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const ws = new WebSocket(wsUrl());
      socketRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 900);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (ev) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.type === "state") {
          setContent(msg.content);
          setServerLayout(msg.layout);
          setServerRev((r) => r + 1);
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
    };
  }, []);

  const saveLayout = useCallback((layout: WawLayout) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: "saveLayout", layout };
      ws.send(JSON.stringify(msg));
    }
  }, []);

  return { content, serverLayout, serverRev, connected, saveLayout };
}
