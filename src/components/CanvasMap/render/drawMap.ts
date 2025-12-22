import type { MapMessage } from "../../../type";
import type { Coordinate } from "../types";

export const drawMap = (
  ctx: CanvasRenderingContext2D,
  mapData: MapMessage,
  worldToCanvas: Coordinate["worldToCanvas"],
  scale: number
) => {
  if (!mapData) return;

  const { width, height, resolution, origin } = mapData.info;
  const data = mapData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = data[y * width + x];
      if (v < 0) continue;

      ctx.fillStyle = v === 100 ? "#000" : v > 0 ? "#999" : "#fff";

      const wx = origin.position.x + x * resolution;
      const wy = origin.position.y + y * resolution;

      const { x: cx, y: cy } = worldToCanvas(wx, wy);

      ctx.fillRect(cx, cy, resolution * scale, resolution * scale);
    }
  }
};
