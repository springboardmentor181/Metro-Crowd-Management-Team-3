"use client";

import { Maximize2, Minimize2 } from "lucide-react";

export default function MapFullscreenToggle({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isFullscreen ? "Exit fullscreen" : "Maximize"}
      className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white backdrop-blur transition hover:bg-white/10"
    >
      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );
}
