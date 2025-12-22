import type { Coordinate } from "../types";

export const drawOrigin = (
  ctx: CanvasRenderingContext2D,
  worldToCanvas: Coordinate["worldToCanvas"]
) => {
  const { x, y } = worldToCanvas(0, 0);
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
};
