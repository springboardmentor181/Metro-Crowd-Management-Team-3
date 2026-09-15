export interface DeclutterablePoint {
  x: number;
  y: number;
}

/**
 * Nudges points that are stacked too close together (in the same 0-100
 * projected coordinate space used by the dashboard maps) apart from each
 * other, so a dense cluster of stations (e.g. the Delhi/Noida corridor)
 * doesn't render as one illegible pile of overlapping dots and labels.
 *
 * Pure position relaxation - every other field on the point is preserved
 * as-is, only x/y are adjusted, and only enough to stop touching.
 */
export function declutterPositions<T extends DeclutterablePoint>(
  points: T[],
  options?: { minDistance?: number; iterations?: number },
): T[] {
  const minDistance = options?.minDistance ?? 3.2;
  const iterations = options?.iterations ?? 24;

  if (points.length < 2) return points;

  const next = points.map((p) => ({ ...p }));

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;

    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i];
        const b = next[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);

        if (dist < minDistance) {
          moved = true;
          if (dist < 0.0001) {
            // Identical coordinates - nudge apart in a deterministic
            // direction (based on index) so re-renders stay stable
            // instead of jittering randomly every frame.
            const angle = (i * 47 + j * 91) % 360;
            dx = Math.cos((angle * Math.PI) / 180);
            dy = Math.sin((angle * Math.PI) / 180);
            dist = 1;
          }
          const overlap = (minDistance - dist) / 2;
          const nx = (dx / dist) * overlap;
          const ny = (dy / dist) * overlap;
          a.x -= nx;
          a.y -= ny;
          b.x += nx;
          b.y += ny;
        }
      }
    }

    if (!moved) break;
  }

  // Keep every point inside the visible canvas after nudging.
  for (const p of next) {
    p.x = Math.min(96, Math.max(4, p.x));
    p.y = Math.min(96, Math.max(4, p.y));
  }

  return next;
}