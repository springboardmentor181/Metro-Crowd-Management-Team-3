export interface ProjectedWithLine {
  x: number;
  y: number;
  line_name?: string | null;
  line_color?: string | null;
  station_order?: number | null;
}

export interface LineSegment {
  key: string;
  color: string;
  points: string;
  /** True for the synthetic "unassigned stations" connector built by
   * buildFallbackConnector - render this dashed/muted so it's never
   * mistaken for a real metro line. */
  dashed?: boolean;
}

export function buildLineSegments<T extends ProjectedWithLine>(
  positioned: T[],
): LineSegment[] {
  const byLine = new Map<string, T[]>();

  for (const station of positioned) {
    if (!station.line_name) continue;
    const list = byLine.get(station.line_name) ?? [];
    list.push(station);
    byLine.set(station.line_name, list);
  }

  const segments: LineSegment[] = [];
  for (const [lineName, stations] of byLine) {
    if (stations.length < 2) continue;
    const ordered = [...stations].sort(
      (a, b) => (a.station_order ?? 0) - (b.station_order ?? 0),
    );
    segments.push({
      key: lineName,
      color: ordered[0].line_color ?? "#22c55e",
      points: ordered.map((s) => `${s.x},${s.y}`).join(" "),
    });
  }

  return segments;
}

export interface FullLineStation {
  id: number;
  line_name: string | null;
  line_color: string | null;
  station_order: number | null;
}

/**
 * Builds line segments from the COMPLETE set of stations on each line
 * (from the master station list), using coordinates from a shared
 * `buildStationProjection` map - instead of connecting only whichever
 * stations happen to survive the current filter.
 *
 * This is what keeps a visible station dot always exactly ON its
 * line: both the dot (via `applyStationProjection`) and this line path
 * are read from the exact same per-station coordinate, and the line
 * itself is always the full, continuous route rather than breaking
 * apart wherever the current filter drops a station.
 *
 * @param allStations   Master list of every station (not the filtered/
 *                       visible subset).
 * @param projection     Coordinate map from `buildStationProjection`.
 * @param visibleLineNames  Optional - when set, only draw lines that
 *                       actually have a station currently on screen,
 *                       so an unrelated line elsewhere on the network
 *                       isn't drawn for no reason.
 */
export function buildFullLineSegments<T extends FullLineStation>(
  allStations: T[],
  projection: Map<number, { x: number; y: number }>,
  visibleLineNames?: Set<string> | null,
): LineSegment[] {
  const byLine = new Map<string, T[]>();

  for (const station of allStations) {
    if (!station.line_name) continue;
    if (visibleLineNames && !visibleLineNames.has(station.line_name)) continue;
    const list = byLine.get(station.line_name) ?? [];
    list.push(station);
    byLine.set(station.line_name, list);
  }

  const segments: LineSegment[] = [];
  for (const [lineName, stations] of byLine) {
    const ordered = [...stations].sort(
      (a, b) => (a.station_order ?? 0) - (b.station_order ?? 0),
    );
    const points = ordered
      .map((s) => projection.get(s.id))
      .filter((c): c is { x: number; y: number } => Boolean(c));

    if (points.length < 2) continue;

    segments.push({
      key: lineName,
      color: ordered[0].line_color ?? "#22c55e",
      points: points.map((c) => `${c.x},${c.y}`).join(" "),
    });
  }

  return segments;
}

/**
 * Some stations in the underlying dataset aren't linked to any metro
 * line at all (no line_name/station_order), so they have no real
 * route to sit on no matter how the coordinates are computed - that's
 * a data gap, not a placement bug. Rather than leave those dots
 * floating with nothing touching them, chain them together with a
 * simple nearest-neighbour path so every visible dot always has SOME
 * line running through it. The caller should render this dashed/muted
 * (see the `dashed` flag) so it reads as "unassigned stations", never
 * mistaken for a real line.
 */
export function buildFallbackConnector<T extends { x: number; y: number }>(
  points: T[],
): LineSegment | null {
  if (points.length < 2) return null;

  const remaining = [...points];
  const chain: T[] = [remaining.shift() as T];

  while (remaining.length) {
    const last = chain[chain.length - 1];
    let bestIndex = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    });
    chain.push(remaining.splice(bestIndex, 1)[0]);
  }

  return {
    key: "__unassigned__",
    color: "#facc15",
    points: chain.map((c) => `${c.x},${c.y}`).join(" "),
    dashed: true,
  };
}