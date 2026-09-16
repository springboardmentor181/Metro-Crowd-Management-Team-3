export function speedFactorFor(delayMinutes: number): number {
  return 1 / (1 + delayMinutes / 10);
}

export function etaToStationSeconds(params: {
  stationIds: number[];
  segmentSeconds: number[];
  fromStationId: number;
  toStationId: number;
  direction: number;
  remainingCurrentSegmentSeconds: number | null;
  delayMinutes: number;
  targetStationId: number;
}): number | null {
  const {
    stationIds,
    segmentSeconds,
    fromStationId,
    toStationId,
    direction,
    remainingCurrentSegmentSeconds,
    delayMinutes,
    targetStationId,
  } = params;

  if (stationIds.length < 2 || segmentSeconds.length < 1) return null;

  const targetIndex = stationIds.indexOf(targetStationId);
  if (targetIndex === -1) return null;

  if (targetStationId === fromStationId) return 0;

  if (remainingCurrentSegmentSeconds === null) return null;

  const speedFactor = speedFactorFor(delayMinutes);
  let pos = stationIds.indexOf(toStationId);
  if (pos === -1) return null;

  let dir = direction;
  let total = remainingCurrentSegmentSeconds;

  if (pos === targetIndex) return Math.round(total);

  const maxSteps = stationIds.length * 2;
  for (let i = 0; i < maxSteps; i += 1) {
    if (pos === stationIds.length - 1) dir = -1;
    else if (pos === 0) dir = 1;

    const segIndex = Math.max(
      0,
      Math.min(segmentSeconds.length - 1, dir === 1 ? pos : pos - 1),
    );
    const segmentDuration = segmentSeconds[segIndex];
    total += speedFactor ? segmentDuration / speedFactor : segmentDuration;

    pos = Math.max(0, Math.min(stationIds.length - 1, pos + dir));

    if (pos === targetIndex) return Math.round(total);
  }

  return null;
}

export function stationsAwayToStation(params: {
  stationIds: number[];
  fromStationId: number;
  direction: number;
  targetStationId: number;
}): number | null {
  const { stationIds, fromStationId, direction, targetStationId } = params;
  if (stationIds.length < 2) return null;

  const targetIndex = stationIds.indexOf(targetStationId);
  if (targetIndex === -1) return null;
  if (fromStationId === targetStationId) return 0;

  let pos = stationIds.indexOf(fromStationId);
  if (pos === -1) return null;
  let dir = direction;

  const maxSteps = stationIds.length * 2;
  for (let i = 0; i < maxSteps; i += 1) {
    if (pos === stationIds.length - 1) dir = -1;
    else if (pos === 0) dir = 1;

    pos = Math.max(0, Math.min(stationIds.length - 1, pos + dir));

    if (pos === targetIndex) return i + 1;
  }

  return null;
}

export function formatEtaMinutes(etaSeconds: number | null | undefined): string {
  if (etaSeconds === null || etaSeconds === undefined) return "";
  if (etaSeconds <= 45) return "Arriving now";
  const minutes = Math.round(etaSeconds / 60);
  return `${minutes} min`;
}
