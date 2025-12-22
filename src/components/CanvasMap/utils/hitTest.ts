import type { Waypoint } from "../../../type";
import type { Coordinate } from "../types";

export const hitTestWaypoint = (
  cx: number,
  cy: number,
  waypoints: Waypoint[],
  worldToCanvas: Coordinate["worldToCanvas"]
): Waypoint | null => {
  for (const p of waypoints) {
    const { x: px, y: py } = worldToCanvas(p.x, p.y);
    if (Math.hypot(px - cx, py - cy) <= 8) {
      return p;
    }
  }
  return null;
};
