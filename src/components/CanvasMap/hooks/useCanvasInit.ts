import { useEffect, useRef } from "react";
import type { MapMessage } from "../../../type";

export const useCanvasInit = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapData: MapMessage | null,
  setScale: React.Dispatch<React.SetStateAction<number>>,
  setOffset: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >
) => {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  // const isDragging = useRef(false);
  // const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef!.current;
    const container = containerRef!.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
  }, [canvasRef, containerRef]);

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height, resolution, origin } = mapData.info;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    const worldW = width * resolution;
    const worldH = height * resolution;

    const s = Math.min(canvasW / worldW, canvasH / worldH) * 0.9;
    setScale(s);

    setOffset({
      x: canvasW / 2 - (origin.position.x + worldW / 2) * s,
      y: canvasH / 2 - (origin.position.y + worldH / 2) * s,
    });
  }, [mapData, setScale, setOffset, canvasRef]);

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const down = (e: MouseEvent) => {
  //     isDragging.current = true;
  //     lastMouse.current = { x: e.clientX, y: e.clientY };
  //   };
  //   const move = (e: MouseEvent) => {
  //     if (!isDragging.current) return;
  //     const dx = e.clientX - lastMouse.current.x;
  //     const dy = e.clientY - lastMouse.current.y;
  //     setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  //     lastMouse.current = { x: e.clientX, y: e.clientY };
  //   };
  //   const up = () => (isDragging.current = false);

  //   canvas.addEventListener("mousedown", down);
  //   canvas.addEventListener("mousemove", move);
  //   window.addEventListener("mouseup", up);

  //   return () => {
  //     canvas.removeEventListener("mousedown", down);
  //     canvas.removeEventListener("mousemove", move);
  //     window.removeEventListener("mouseup", up);
  //   };
  // }, [canvasRef, setOffset]);

  return { ctxRef };
};
