export type LobbyPoint = [number, number, number];

/** Pick a meeting position near the actual player, never outside the lobby. */
export function planLobbyDeparture(playerX: number, playerZ: number): { female: LobbyPoint; male: LobbyPoint } {
  const female: LobbyPoint = [Math.max(-5.2, Math.min(5.2, playerX)), 0, Math.max(-4, Math.min(5.5, Math.max(playerZ, 2.05)))];
  return { female, male: [female[0] + 0.88, 0, female[2]] };
}

/** Advance at a fixed world-space speed instead of running faster for longer paths. */
export function advanceLobbyWalk(progress: number, distance: number, delta: number): number {
  return Math.min(1, progress + Math.max(0, Math.min(delta, 0.1)) * 1.5 / Math.max(distance, 0.01));
}
