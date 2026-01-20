import type { Waypoint, } from "../../type";


export interface Offset {
  x: number;
  y: number;
}

export type ContextTarget =
  | { type: "empty" }
  | { type: "waypoint"; waypoint: Waypoint };

export type OperatingState =
  | ""
  | "drag"
  | "rotate"
  | "addPoint"
  | "setInitialPose" // 拖动确定朝向
  | "freeErase"
  | 'addObstacles'; 