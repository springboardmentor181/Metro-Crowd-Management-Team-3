"use client";

import { useCallback, useMemo, useRef, useState, type WheelEvent, type PointerEvent } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

interface Point {
  x: number;
  y: number;
}

export function useMapZoomPan() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;

    setZoom((prevZoom) => {
      const nextZoom = clampZoom(prevZoom * factor);
      if (nextZoom === prevZoom) return prevZoom;

      setPan((prevPan) => {
        
        const scaleRatio = nextZoom / prevZoom;
        return {
          x: cursorX - (cursorX - prevPan.x) * scaleRatio,
          y: cursorY - (cursorY - prevPan.y) * scaleRatio,
        };
      });

      return nextZoom;
    });
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(e.clientX, e.clientY, factor);
    },
    [zoomAt],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (zoom <= 1) return; 
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
      setIsDragging(true);
    },
    [zoom, pan],
  );

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }, []);

  const endDrag = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
  }, []);

  const zoomIn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.4);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.4);
  }, [zoomAt]);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const layerStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: "0 0",
      transition: isDragging ? "none" : "transform 120ms ease-out",
      width: "100%",
      height: "100%",
      position: "absolute" as const,
      inset: 0,
      cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
    }),
    [pan, zoom, isDragging],
  );

  const containerProps = {
    ref: containerRef,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerLeave: endDrag,
  };

  return { zoom, layerStyle, containerProps, zoomIn, zoomOut, reset };
}
