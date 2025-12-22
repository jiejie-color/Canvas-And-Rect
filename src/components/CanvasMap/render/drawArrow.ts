import type { Coordinate } from "../types";

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  theta: number,
  coord: Coordinate
) => {
  const { x: cx, y: cy } = coord.worldToCanvas(wx, wy);
  const len = 30;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-theta);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 8, -6);
  ctx.moveTo(len, 0);
  ctx.lineTo(len - 8, 6);

  ctx.strokeStyle = "orange";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
};
