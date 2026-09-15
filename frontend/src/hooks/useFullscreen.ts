"use client";

import { useEffect, useRef, useState } from "react";

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === ref.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    if (!ref.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await ref.current.requestFullscreen();
    }
  }

  return { ref, isFullscreen, toggleFullscreen };
}
