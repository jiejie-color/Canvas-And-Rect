import type { SendMessage } from "react-use-websocket";
import type { MapMessage, Robot, Waypoint } from "../../type";

export interface CanvasMapProps {
  mapData: MapMessage | null;
  robot: Robot;
  baseGridSize?: number;
  sendMessage: SendMessage;
  waypoints: Waypoint[];
}
export interface Offset {
  x: number;
  y: number;
}

export type ContextTarget =
  | { type: "empty" }
  | { type: "waypoint"; waypoint: Waypoint };

export type WaypointEditState = "drag" | "addPoint" | "rotating"; // 拖动确定朝向
