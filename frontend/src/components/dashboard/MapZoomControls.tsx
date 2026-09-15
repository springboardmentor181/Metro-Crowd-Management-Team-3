"use client";

import { Plus, Minus, Maximize2 } from "lucide-react";

export default function MapZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur">
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
      >
        <Plus size={16} />
      </button>

      <div className="text-center text-[10px] font-semibold text-white/60">
        {zoom.toFixed(1)}x
      </div>

      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
      >
        <Minus size={16} />
      </button>

      <button
        type="button"
        onClick={onReset}
        title="Reset view"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
}
