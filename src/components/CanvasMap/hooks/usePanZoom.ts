import { useEffect, useRef, useState } from "react";
import type { Waypoint } from "../../../type";

type WaypointEditState =
  | "idle"
  | "placing" // 点击确定位置
  | "rotating"; // 拖动确定朝向

export const usePanZoom = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isSetWaypoint: boolean,
  setEditingNode: React.Dispatch<React.SetStateAction<Waypoint | null>>,
  setIsSetWaypoint: React.Dispatch<React.SetStateAction<boolean>>,
  editingNode: Waypoint | null,
  setIsEditingNode: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [scale, setScale] = useState(30);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [editState, setEditState] = useState<WaypointEditState>("idle");

  const worldToCanvas = (wx: number, wy: number) => ({
    x: wx * scale + offset.x,
    y: -wy * scale + offset.y,
  });
  const canvasToWorld = (cx: number, cy: number) => ({
    x: (cx - offset.x) / scale,
    y: -(cy - offset.y) / scale,
  });
  // const rotatingPoint = useRef<{ x: number; y: number } | null>(null);

  // Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const newScale = e.deltaY < 0 ? scale * 1.1 : scale * 0.9;

      setOffset({
        x: mx - ((mx - offset.x) / scale) * newScale,
        y: my - ((my - offset.y) / scale) * newScale,
      });
      setScale(newScale);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [scale, offset, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMouseCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const down = (e: MouseEvent) => {
      /** 设点位模式 */
      if (isSetWaypoint) {
        if (editState === "idle") {
          const { x, y } = getMouseCanvasPos(e);
          const { x: wx, y: wy } = canvasToWorld(x, y);

          // 第一次点击：确定位置
          setEditingNode({
            x: wx, // 世界坐标（米）
            y: wy,
            theta: 0, // 弧度
            name: "",
          });
          setEditState("rotating");
        } else if (editState === "rotating") {
          // 第二次点击：确认方向
          setEditState("idle");
          setIsSetWaypoint(false);
          setIsEditingNode(true);
        }
        return;
      }

      /** 普通拖拽地图 */
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const move = (e: MouseEvent) => {
      const { x, y } = getMouseCanvasPos(e);

      /** 旋转箭头 */
      if (isSetWaypoint && editState === "rotating" && editingNode) {
        const { x: cx, y: cy } = worldToCanvas(editingNode.x, editingNode.y);
        const dx = x - cx;
        const dy = cy - y;

        const theta = Math.atan2(dy, dx);
        setEditingNode((node) =>
          node
            ? {
                ...node,
                theta,
              }
            : null
        );
        return;
      }

      /** 拖地图 */
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const up = () => {
      isDragging.current = false;
    };

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [
    canvasRef,
    isSetWaypoint,
    editState,
    setIsSetWaypoint,
    setEditingNode,
    editingNode,
    setIsEditingNode,
    offset.x,
    offset.y,
    scale,
    offset,
  ]);

  return {
    scale,
    offset,
    setScale,
    setOffset,
    coord: { worldToCanvas, canvasToWorld },
  };
};
