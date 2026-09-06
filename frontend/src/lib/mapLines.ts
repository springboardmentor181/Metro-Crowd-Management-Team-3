
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
