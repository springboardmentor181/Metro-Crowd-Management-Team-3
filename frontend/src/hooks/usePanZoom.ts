"use client";

import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Button-only zoom + click-and-drag pan for a fixed-size map canvas.
 * With 280+ stations on screen at once, letting people zoom into a
 * crowded cluster (instead of forcing everything to fit legibly in
 * one static box) is what actually makes a dense network readable.
 *
 * Zoom is strictly limited to the +/- buttons (zoomIn/zoomOut below)
 * - there is intentionally no wheel/scroll or pinch handler here, so
 * scrolling over the map never changes the scale. Panning only ever
 * happens while the mouse button is held down and moving (see
 * onPointerDown/onPointerMove/endDrag) - the map never drifts or
 * pans on its own. */
export function usePanZoom() {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const zoomBy = useCallback((factor: number) => {
    setScale((prev) => clamp(prev * factor, MIN_SCALE, MAX_SCALE));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
        moved: false,
      };
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragState.current.moved = true;
    }
    setPos({
      x: dragState.current.origX + dx,
      y: dragState.current.origY + dy,
    });
  }, []);

  const endDrag = useCallback(() => {
    dragState.current = null;
  }, []);

  return {
    scale,
    x: pos.x,
    y: pos.y,
    zoomIn: () => zoomBy(1.35),
    zoomOut: () => zoomBy(1 / 1.35),
    reset,
    isZoomed: scale > 1.01 || pos.x !== 0 || pos.y !== 0,
    // No onWheel here on purpose - zoom must only happen via the +/-
    // buttons (zoomIn/zoomOut), never from mouse scroll/trackpad.
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
    },
  };
}