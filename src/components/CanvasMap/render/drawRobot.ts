import type { Robot } from "../../../type";
import type { Coordinate } from "../types";

export const drawRobot = (
  ctx: CanvasRenderingContext2D,
  robot: Robot,
  worldToCanvas: Coordinate["worldToCanvas"],
  scale: number
) => {
  const { x, y } = worldToCanvas(robot.x, robot.y);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-robot.yaw);

  const size = 0.3 * scale;
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size, size * 0.6);
  ctx.lineTo(-size, -size * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};
