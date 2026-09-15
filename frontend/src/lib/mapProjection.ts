export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type Projected<T> = T & { x: number; y: number };

const MARGIN = 8; // % padding so edge stations/labels aren't clipped
const SPAN = 100 - MARGIN * 2;
const MIN_GAP = 2.4; // minimum % distance kept between any two dots

/**
 * Places geo points onto a 0-100 x/y box.
 *
 * The previous implementation did straight min/max linear scaling of
 * raw lat/lng. That works for a handful of evenly-spread points, but a
 * real metro network is NOT evenly spread - Delhi/NCR has ~280+
 * stations bunched tightly in the city centre and a few far-flung ones
 * (Shyam Park, Hindon River, Lal Quila...) way out at the edges. Linear
 * scaling stretches the box to fit those outliers, which squashes the
 * entire dense cluster into a tiny corner - exactly the illegible
 * pile-up of overlapping dots/labels seen on the heatmap.
 *
 * Fix: rank-based (percentile) placement. Each station is positioned
 * by where it falls in sorted order along each axis, not by its raw
 * coordinate value. Outliers no longer compress everyone else - every
 * station gets a roughly even slice of the canvas. A short decluttering
 * pass then nudges apart any points still closer than MIN_GAP (e.g.
 * interchange stations sharing near-identical coordinates), so every
 * station keeps its own visible, clickable dot.
 */
export function projectPoints<T extends GeoPoint>(
  points: T[],
): Projected<T>[] {
  const valid = points.filter(
    (p) =>
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      !(p.latitude === 0 && p.longitude === 0),
  );

  if (!valid.length) return [];
  if (valid.length === 1) {
    return [{ ...valid[0], x: 50, y: 50 }];
  }

  const n = valid.length;
  const byLat = [...valid].sort((a, b) => a.latitude - b.latitude);
  const byLng = [...valid].sort((a, b) => a.longitude - b.longitude);

  const latRank = new Map<T, number>();
  byLat.forEach((p, i) => latRank.set(p, i / (n - 1)));
  const lngRank = new Map<T, number>();
  byLng.forEach((p, i) => lngRank.set(p, i / (n - 1)));

  const projected = valid.map((p) => ({
    ...p,
    x: MARGIN + (lngRank.get(p) ?? 0.5) * SPAN,
    y: MARGIN + (1 - (latRank.get(p) ?? 0.5)) * SPAN,
  }));

  return declutter(projected);
}

/** Pushes points that land within MIN_GAP of each other apart, a little
 * at a time, so overlapping/duplicate coordinates (interchanges) still
 * render as distinct, clickable dots instead of stacking invisibly. */
function declutter<T extends { x: number; y: number }>(
  points: T[],
): T[] {
  const result = points.map((p) => ({ ...p }));
  const passes = 3;

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        if (dist < MIN_GAP) {
          const angle =
            dist === 0 ? (j * 2.399963) /* golden angle */ : Math.atan2(dy, dx);
          const push = (MIN_GAP - dist) / 2 + 0.02;
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);

          a.x = clamp(a.x - ux * push);
          a.y = clamp(a.y - uy * push);
          b.x = clamp(b.x + ux * push);
          b.y = clamp(b.y + uy * push);
        }
      }
    }
  }

  return result;
}

function clamp(v: number) {
  return Math.min(100 - MARGIN / 2, Math.max(MARGIN / 2, v));
}

/**
 * Projects the FULL/master station list once into a stable x/y
 * coordinate space, keyed by station id.
 *
 * Why this exists: the crowd heat map, crowd density map and live
 * train map all only ever *show* a filtered subset of stations at a
 * time (nearest-15, current train's route, stations with a running
 * train...). The old code called `projectPoints()` directly on that
 * filtered subset, which reruns the rank-based layout on whatever
 * happens to be visible. Two different filters produce two different
 * rank orderings, so a station's dot and the metro line drawn through
 * it (built from that same subset) could end up in different
 * coordinate spaces - the line looked "correct" for the subset, but
 * individual dots that didn't have a same-line neighbour in the
 * subset had no line to sit on at all, so they floated off to the
 * side (see reported screenshot).
 *
 * Fix: project the complete station list ONE time, and have every
 * filtered view (dots shown, line paths drawn) look up coordinates
 * from this single map via `applyStationProjection` /
 * `buildFullLineSegments` instead of re-projecting. Every station -
 * shown or not - lives at one fixed (x, y), so a visible dot is
 * always exactly on its line's path.
 */
export function buildStationProjection<T extends GeoPoint & { id: number }>(
  stations: T[],
): Map<number, { x: number; y: number }> {
  const projected = projectPoints(stations);
  const map = new Map<number, { x: number; y: number }>();
  for (const p of projected) {
    map.set(p.id, { x: p.x, y: p.y });
  }
  return map;
}

/**
 * Positions a (possibly filtered) list of points using coordinates
 * already computed by `buildStationProjection`, instead of running the
 * rank-based layout again on just that subset. Points whose station
 * isn't present in the projection are dropped rather than mis-placed,
 * so a stale/partial station list never puts a dot in the wrong spot.
 */
export function applyStationProjection<
  T extends { id?: number; station_id?: number },
>(points: T[], projection: Map<number, { x: number; y: number }>): Projected<T>[] {
  const out: Projected<T>[] = [];
  for (const p of points) {
    const id = p.station_id ?? p.id;
    if (id == null) continue;
    const coords = projection.get(id);
    if (!coords) continue;
    out.push({ ...p, x: coords.x, y: coords.y });
  }
  return out;
}