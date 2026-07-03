import { useEffect, useState } from "react";
import { wsAuthedUrl } from "@/lib/ws";
import { LogFile } from "./logsApi";

type WsMessage = { type: "files"; files: LogFile[] };

export function useLogFilesSocket() {
  const [files, setFiles] = useState<LogFile[] | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsAuthedUrl("/ws/logs-index/"));

    ws.onmessage = event => {
      const data: WsMessage = JSON.parse(event.data);
      setFiles(data.files);
    };

    return () => ws.close();
  }, []);

  return { files, isLoading: files === null };
}
