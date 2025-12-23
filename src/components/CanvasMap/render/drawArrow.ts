import type { Waypoint } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  editingNode: Waypoint | null,
  coord: Coord
) => {
  if (!editingNode) return;

  const { x: wx, y: wy, theta } = editingNode;
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
