import { useRef, useEffect, useState } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 矩形固定在世界坐标系
  const rect = { x: 100, y: 100, w: 200, h: 120 };

  const gridSize = 50;

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const gap = gridSize * scale;
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    for (let x = offset.x % gap; x <= width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = offset.y % gap; y <= height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawRect = (ctx: CanvasRenderingContext2D) => {
    const x = rect.x * scale + offset.x;
    const y = rect.y * scale + offset.y;
    const w = rect.w * scale;
    const h = rect.h * scale;

    ctx.fillStyle = "rgba(0, 150, 255, 0.6)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  };

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    drawRect(ctx);
  };

  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    draw();
  }, []);

  // 鼠标缩放
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const oldScale = scale;
      const newScale = e.deltaY < 0 ? scale * 1.1 : scale * 0.9;

      // 缩放中心跟随鼠标
      const newOffsetX = mouseX - ((mouseX - offset.x) / oldScale) * newScale;
      const newOffsetY = mouseY - ((mouseY - offset.y) / oldScale) * newScale;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [scale, offset]);

  // 鼠标拖动画布（网格 + 矩形一起移动）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;

      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 重新绘制
  useEffect(() => {
    draw();
  }, [scale, offset]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", background: "#f0f0f0" }}
    >
      <canvas ref={canvasRef} style={{ cursor: "grab" }} />
    </div>
  );
}

export default App;
