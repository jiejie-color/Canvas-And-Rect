import { useEffect, useRef } from "react";

export const useCanvasInit = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>
) => {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

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

  return { ctxRef };
};
