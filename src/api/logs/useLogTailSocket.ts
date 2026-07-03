import { useEffect, useRef, useState } from "react";
import { wsAuthedUrl } from "@/lib/ws";

type WsMessage = { type: "init" | "append" | "reset"; lines: string[] };

export function useLogTailSocket(filename: string | null) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!filename) {
      setLines([]);
      return;
    }

    setLines([]);
    setConnected(false);

    const ws = new WebSocket(wsAuthedUrl(`/ws/logs/${filename}/`));
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = event => {
      const data: WsMessage = JSON.parse(event.data);
      if (data.type === "append") {
        setLines(prev => [...prev, ...data.lines]);
      } else {
        // "init" or "reset" (file rotated/truncated) both replace the buffer.
        setLines(data.lines);
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [filename]);

  return { lines, connected };
}
