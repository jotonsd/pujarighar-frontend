"use client";

import { useGetLogContentQuery } from "@/api/logs/logsApi";
import { useLogFilesSocket } from "@/api/logs/useLogFilesSocket";
import { useLogTailSocket } from "@/api/logs/useLogTailSocket";
import PageHeader from "@/components/ui/PageHeader";
import { RefreshCw, Search } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Level = "INFO" | "ERROR" | "WARNING" | "CRITICAL" | "DEBUG" | "OTHER";

const LEVELS: Level[] = ["INFO", "ERROR", "WARNING", "CRITICAL", "DEBUG"];

const LEVEL_STYLE: Record<Level, { dot: string; text: string; badgeActive: string; badgeIdle: string }> = {
  INFO:     { dot: "bg-blue-400",   text: "text-blue-300",   badgeActive: "bg-blue-400/15 text-blue-300 border-blue-400/40",     badgeIdle: "border-gray-700 text-gray-400 hover:border-blue-400/40" },
  ERROR:    { dot: "bg-red-500",    text: "text-red-400",    badgeActive: "bg-red-500/15 text-red-300 border-red-500/40",        badgeIdle: "border-gray-700 text-gray-400 hover:border-red-500/40" },
  WARNING:  { dot: "bg-amber-400",  text: "text-amber-300",  badgeActive: "bg-amber-400/15 text-amber-300 border-amber-400/40",  badgeIdle: "border-gray-700 text-gray-400 hover:border-amber-400/40" },
  CRITICAL: { dot: "bg-purple-500", text: "text-purple-300", badgeActive: "bg-purple-500/15 text-purple-300 border-purple-500/40", badgeIdle: "border-gray-700 text-gray-400 hover:border-purple-500/40" },
  DEBUG:    { dot: "bg-gray-400",   text: "text-gray-300",   badgeActive: "bg-gray-400/15 text-gray-200 border-gray-400/40",     badgeIdle: "border-gray-700 text-gray-400 hover:border-gray-400/40" },
  OTHER:    { dot: "bg-gray-600",   text: "text-gray-300",   badgeActive: "",                                                    badgeIdle: "" },
};

function getLevel(line: string): Level {
  if (/\bCRITICAL\b/.test(line)) return "CRITICAL";
  if (/\bERROR\b/.test(line)) return "ERROR";
  if (/\bWARNING\b/.test(line)) return "WARNING";
  if (/\bDEBUG\b/.test(line)) return "DEBUG";
  if (/\bINFO\b/.test(line)) return "INFO";
  return "OTHER";
}

export default function LogViewerPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { files, isLoading: filesLoading } = useLogFilesSocket();

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeLevels, setActiveLevels] = useState<Set<Level>>(new Set());

  useEffect(() => {
    if (!selected && files && files.length > 0) {
      setSelected(files[0].name);
    }
  }, [files, selected]);

  // Search needs a one-shot filtered scan of the whole file — the REST endpoint.
  // Otherwise, live-tail the file over a WebSocket (no repeated polling).
  const searching = query.trim() !== "";
  const liveFile = !searching && autoRefresh ? selected : null;

  const { lines: liveLines, connected } = useLogTailSocket(liveFile);

  const { data: content, isFetching, refetch } = useGetLogContentQuery(
    selected ? { filename: selected, lines: 500, q: query || undefined } : { filename: "" },
    { skip: !selected || !!liveFile },
  );

  const displayedLines = liveFile ? liveLines : content?.lines ?? [];

  const levelCounts = useMemo(() => {
    const counts: Record<Level, number> = { INFO: 0, ERROR: 0, WARNING: 0, CRITICAL: 0, DEBUG: 0, OTHER: 0 };
    for (const line of displayedLines) counts[getLevel(line)]++;
    return counts;
  }, [displayedLines]);

  const visibleLines = activeLevels.size
    ? displayedLines.filter(line => activeLevels.has(getLevel(line)))
    : displayedLines;

  const toggleLevel = (level: Level) => {
    setActiveLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  // Auto-scroll to the bottom as new lines arrive, but don't fight the user
  // if they've scrolled up to read older lines.
  const preRef = useRef<HTMLPreElement>(null);
  const stickToBottomRef = useRef(true);

  const handleScroll = () => {
    const el = preRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [selected]);

  useEffect(() => {
    const el = preRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div>
      <PageHeader
        title={isBn ? "লগ ভিউয়ার" : "Log Viewer"}
        description={isBn ? "সার্ভার লগ ফাইল দেখুন" : "View backend server log files"}
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={!!liveFile}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isBn ? "রিফ্রেশ" : "Refresh"}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
        {/* File list */}
        <div className="bg-white rounded-lg shadow-sm p-2 h-fit">
          {filesLoading ? (
            <p className="text-xs text-gray-400 px-2 py-1.5">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
          ) : (
            <ul className="space-y-0.5">
              {files?.map(f => (
                <li key={f.name}>
                  <button
                    type="button"
                    onClick={() => setSelected(f.name)}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors ${
                      selected === f.name
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate">{f.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatSize(f.size)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Content viewer */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex flex-col h-[75vh]">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isBn ? "লগে খুঁজুন..." : "Search in log..."}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap px-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="accent-amber-600"
              />
              {isBn ? "লাইভ" : "Live"}
              {liveFile && (
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-300 animate-pulse"}`} />
              )}
            </label>
          </div>

          {/* Level indicators / filters */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {LEVELS.map(level => {
              const style = LEVEL_STYLE[level];
              const active = activeLevels.has(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-medium transition-colors ${
                    active ? style.badgeActive : style.badgeIdle
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {level}
                  <span className="opacity-70">{levelCounts[level]}</span>
                </button>
              );
            })}
            {activeLevels.size > 0 && (
              <button
                type="button"
                onClick={() => setActiveLevels(new Set())}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline ml-1"
              >
                {isBn ? "মুছুন" : "clear"}
              </button>
            )}
          </div>

          <pre
            ref={preRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 bg-gray-900 text-gray-200 rounded-lg p-3 text-[11px] leading-relaxed overflow-y-auto whitespace-pre-wrap break-all font-mono"
          >
            {!selected
              ? (isBn ? "একটি ফাইল নির্বাচন করুন" : "Select a file")
              : visibleLines.length
                ? visibleLines.map((line, i) => (
                    <div key={i} className={LEVEL_STYLE[getLevel(line)].text}>{line}</div>
                  ))
                : (isBn ? "কোনো লগ পাওয়া যায়নি" : "No log lines found")}
          </pre>
        </div>
      </div>
    </div>
  );
}
