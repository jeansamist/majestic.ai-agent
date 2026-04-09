"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code, Eye } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Paste this snippet before the closing{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
          {"</body>"}
        </code>{" "}
        tag on your website to inject a floating chat button.
      </p>

      {/* Code block */}
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
          <Code className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">HTML</span>
        </div>
        <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-foreground">
          {data.snippet}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={copy} variant="default" size="sm" className="gap-2">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy Snippet"}
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={`/agent?key=${data.publicKey}`} target="_blank" rel="noreferrer">
            <Eye className="size-3.5" />
            Preview Agent
          </a>
        </Button>
      </div>

      {/* Data attributes reference */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Optional data attributes
        </p>
        <div className="flex flex-col gap-2">
          {[
            { attr: "data-label", default: data.widgetButtonLabel, desc: "Button label" },
            { attr: "data-position", default: "bottom-right", desc: "bottom-right or bottom-left" },
          ].map((row) => (
            <div key={row.attr} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-mono text-xs">{row.attr}</Badge>
              <span className="text-muted-foreground">default: {row.default}</span>
              <span className="text-muted-foreground/60">— {row.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
