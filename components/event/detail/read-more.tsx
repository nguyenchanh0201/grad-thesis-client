"use client";

import { useState } from "react";

interface Props {
  children: React.ReactNode;
  maxHeight?: number;
}

export function ReadMore({ children, maxHeight = 200 }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? "none" : maxHeight }}
      >
        {children}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
