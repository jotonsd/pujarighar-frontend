"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Small inline "copy to clipboard" icon button. */
export default function CopyButton({ value, isBn }: { value: string; isBn: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={isBn ? "কপি করুন" : "Copy"}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
