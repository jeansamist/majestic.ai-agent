"use client";

import { motion } from "framer-motion";

const DEFAULT_SUGGESTIONS = [
  "I'd like a quote",
  "I need to file a claim",
  "What does Majestic cover?",
  "Book a call with Lisa",
];

interface SuggestionsProps {
  onSelect: (text: string) => void;
}

export function Suggestions({ onSelect }: SuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 px-6 pb-3"
    >
      {DEFAULT_SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="rounded-full border border-gold/22 bg-gold/7 px-4 py-1.5 text-xs font-medium text-gold/82 transition-all hover:bg-gold/16 hover:text-gold-2 hover:-translate-y-px cursor-pointer"
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
}
