"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface CalendlyCardProps {
  calendlyUrl: string;
  agentPhotoUrl?: string | null;
  onBooked?: (payload: unknown) => void;
}

export function CalendlyCard({ calendlyUrl, agentPhotoUrl, onBooked }: CalendlyCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Calendly widget script once
    if (!document.getElementById("calendly-script")) {
      const s = document.createElement("script");
      s.id = "calendly-script";
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      document.head.appendChild(s);
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        onBooked?.(e.data.payload);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onBooked]);

  const src = `${calendlyUrl}?hide_gdpr_banner=1&background_color=0d1b3e&text_color=ffffff&primary_color=d4a82e`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-gold/25 bg-white/4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gold/12 px-4 py-3">
        {agentPhotoUrl ? (
          <Image
            src={agentPhotoUrl}
            alt="Lisa Walker"
            width={34}
            height={34}
            className="rounded-full border-2 border-gold/40 object-cover"
          />
        ) : (
          <div className="size-[34px] rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center text-gold font-bold text-sm">
            L
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gold">Book a call with Lisa Walker</p>
          <p className="text-xs text-white/45 mt-0.5">Founder & CEO · 11+ years experience</p>
        </div>
      </div>

      {/* Calendly embed */}
      <div
        ref={ref}
        className="calendly-inline-widget"
        data-url={src}
        style={{ minWidth: "280px", height: "480px" }}
      />
    </motion.div>
  );
}
