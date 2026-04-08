"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Code, Eye } from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface EmbedData {
  publicKey: string;
  snippet: string;
  scriptUrl: string;
  widgetButtonLabel: string;
  widgetEnabled: boolean;
}

export function EmbedGenerator() {
  const [data, setData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get("/api/admin/embed")
      .then((r) => setData(r.data as EmbedData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48 bg-white/4" />
        <Skeleton className="h-20 bg-white/4" />
        <Skeleton className="h-9 w-32 bg-white/4" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Instruction */}
      <p className="text-[13px] leading-relaxed text-white/60">
        Paste this snippet before the closing{" "}
        <code className="rounded bg-white/7 px-1.5 py-0.5 text-[12px] text-gold font-mono">
          {"</body>"}
        </code>{" "}
        tag on your website. It injects a floating chat button that opens the Majestic agent.
      </p>

      {/* Code block */}
      <div className="relative overflow-hidden rounded-xl border border-gold/12 bg-black/28">
        <div className="flex items-center gap-2 border-b border-gold/10 px-4 py-2.5">
          <Code className="size-3.5 text-gold/50" />
          <span className="text-[11px] text-gold/50 font-mono">HTML</span>
        </div>
        <pre className="majestic-scroll overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-emerald-300/80">
          {data.snippet}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-4 py-2 text-[12px] font-semibold text-gold transition-all hover:bg-gold/22 cursor-pointer"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy Snippet"}
        </button>

        <a
          href={`/agent?key=${data.publicKey}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-[12px] text-white/50 transition-all hover:text-white/80"
        >
          <Eye className="size-3.5" />
          Preview Agent
        </a>
      </div>

      {/* Data attributes reference */}
      <div className="rounded-xl border border-gold/10 bg-white/2 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Optional data attributes
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { attr: "data-label", default: data.widgetButtonLabel, desc: "Button label" },
            { attr: "data-position", default: "bottom-right", desc: "bottom-right or bottom-left" },
            { attr: "data-theme", default: "dark", desc: "Colour theme (dark only for now)" },
          ].map((row) => (
            <div key={row.attr} className="flex items-center gap-3 text-[12px]">
              <code className="shrink-0 rounded bg-white/7 px-2 py-0.5 font-mono text-gold/80">
                {row.attr}
              </code>
              <span className="text-white/30">default: {row.default}</span>
              <span className="text-white/20">— {row.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
