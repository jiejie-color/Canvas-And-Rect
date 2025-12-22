import { useEffect, useRef, useState } from "react";
import type { MapMessage, NavigationStatus, Robot, Waypoint } from "../type";
import type { SendMessage } from "react-use-websocket";

interface Props {
  mapData: MapMessage | null;
  robot: Robot;
  baseGridSize?: number; // 单位：米
  sendMessage: SendMessage;
  waypoints: Waypoint[];
  navigationStatus: NavigationStatus; // 新增导航状态属性
}

/**
 * Professional ROS Web Visualization Canvas
 * Coordinate convention:
 *   - World(Map) frame, unit = meter
 *   - All render elements MUST use world -> canvas transform
 */
const CanvasMap = ({
  mapData,
  robot,
  baseGridSize = 1,
  waypoints,
  sendMessage,
  navigationStatus,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [scale, setScale] = useState(30); // px / meter
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // canvas px
  const [cursor, setCursor] = useState<string>(""); // canvas px
  const [isSetWaypoint, setIsSetWaypoint] = useState<boolean>(false); // canvas px

  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  type ContextTarget =
    | { type: "empty" }
    | { type: "waypoint"; waypoint: Waypoint };

  const [contextTarget, setContextTarget] = useState<ContextTarget>({
    type: "empty",
  });

  const btnStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 4,
    border: "none",
    background: "#444",
    color: "#fff",
    cursor: "pointer",
  };

  /** world -> canvas */
  const worldToCanvas = (wx: number, wy: number) => {
    return {
      x: wx * scale + offset.x,
      y: -wy * scale + offset.y,
    };
  };
  const canvasToWorld = (cx: number, cy: number) => {
    return {
      x: (cx - offset.x) / scale,
      y: -(cy - offset.y) / scale,
    };
  };
  const hitTestWaypoint = (cx: number, cy: number, r = 8): Waypoint | null => {
    for (const p of waypoints) {
      const { x: px, y: py } = worldToCanvas(p.x, p.y);
      if (Math.hypot(px - cx, py - cy) <= r) {
        return p;
      }
    }
    return null;
  };

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !mapData) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap(ctx);
    drawGrid(ctx);
    drawRobot(ctx);
    drawOrigin(ctx);
    drawWaypoints(ctx);
  };

  const drawWaypoints = (ctx: CanvasRenderingContext2D) => {
    // 绘制 Waypoints
    waypoints.forEach((p) => {
      const { x: cx, y: cy } = worldToCanvas(p.x, p.y);

      ctx.save();
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(p.name, cx + 8, cy - 8);
      ctx.restore();
    });
  };
  /** Map layer */
  const drawMap = (ctx: CanvasRenderingContext2D) => {
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

  /** Grid layer (meter based) */
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    if (!mapData) return;

    const { width, height, resolution, origin } = mapData.info;

    const mapW = width * resolution;
    const mapH = height * resolution;

    // 自适应网格密度（像素）
    let gridPx = baseGridSize * scale;
    while (gridPx < 30) gridPx *= 2;
    while (gridPx > 120) gridPx /= 2;

    const gridMeter = gridPx / scale;

    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= mapW; x += gridMeter) {
      const wx = origin.position.x + x;
      const p1 = worldToCanvas(wx, origin.position.y);
      const p2 = worldToCanvas(wx, origin.position.y + mapH);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let y = 0; y <= mapH; y += gridMeter) {
      const wy = origin.position.y + y;
      const p1 = worldToCanvas(origin.position.x, wy);
      const p2 = worldToCanvas(origin.position.x + mapW, wy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  /** Robot layer */
  const drawRobot = (ctx: CanvasRenderingContext2D) => {
    if (!robot) return;

    const { x, y } = worldToCanvas(robot.x, robot.y);
    const cy = y;
    const cx = x;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-robot.yaw);

    const size = 0.3 * scale; // 30cm

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size * 0.6);
    ctx.lineTo(-size, -size * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /** Map origin (0,0) */
  const drawOrigin = (ctx: CanvasRenderingContext2D) => {
    const { x, y } = worldToCanvas(0, 0);
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  /** Init canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
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
  }, []);

  /** Auto fit map */
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
  }, [mapData]);

  /** Zoom */
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
  }, [scale, offset]);

  /** Pan */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => (isDragging.current = false);

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  useEffect(() => {
    draw();
  }, [mapData, robot, scale, offset, waypoints, navigationStatus]);

  /** Right click context menu (professional map interaction) */
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    wx: number;
    wy: number;
  }>({ visible: false, x: 0, y: 0, wx: 0, wy: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = cursor;
  }, [cursor]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const hit = hitTestWaypoint(cx, cy);
      if (!isSetWaypoint) {
        if (hit) {
          setCursor("pointer");
        } else {
          setCursor("");
        }
      }

      if (!hit) {
        setContextMenu((m) => ({ ...m, visible: false }));
      }
      setContextTarget(
        hit ? { type: "waypoint", waypoint: hit } : { type: "empty" }
      );
    };

    const onLeave = () => {};

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [scale, offset, waypoints, isSetWaypoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { x: wx, y: wy } = canvasToWorld(cx, cy);

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        wx,
        wy,
      });
    };

    const onClick = () => {
      setContextMenu((m) => ({ ...m, visible: false }));
    };

    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("click", onClick);
    };
  }, [scale, offset]);

  const isValid =
    editingNode &&
    editingNode!.name.trim().length > 0 &&
    Number.isFinite(editingNode!.x) &&
    Number.isFinite(editingNode!.y);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 10,
            width: "100%",
            textAlign: "center",
          }}
        >
          <button
            style={btnStyle}
            onClick={() => {
              setCursor("pointer");
              setIsSetWaypoint((pre) => !pre);
            }}
          >
            {isSetWaypoint ? "取消" : "设置点位"}
          </button>
        </div>
        <div ref={containerRef} style={{ width: "100%", flex: 1 }}>
          <canvas ref={canvasRef} style={{ cursor: "" }} />
        </div>
        <div>
          {contextMenu.visible && (
            <div
              style={{
                position: "fixed",
                top: contextMenu.y,
                left: contextMenu.x,
                background: "#1f1f1f",
                color: "#fff",
                borderRadius: 4,
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                zIndex: 1000,
                fontSize: 14,
              }}
            >
              {contextTarget.type === "empty" ? (
                <div
                  style={{ padding: "8px 14px", cursor: "pointer" }}
                  onClick={async () => {
                    setEditingNode({
                      x: contextMenu.wx,
                      y: contextMenu.wy,
                      theta: robot.yaw,
                      name: "",
                    });
                    setContextMenu((m) => ({ ...m, visible: false }));
                  }}
                >
                  ➕ 添加节点
                </div>
              ) : null}
              {contextTarget.type === "waypoint" ? (
                <>
                  <div
                    style={{ padding: "8px 14px", cursor: "pointer" }}
                    onClick={async () => {
                      sendMessage(
                        JSON.stringify({
                          op: "call_service",
                          id: `call_multi_navigate_${Date.now()}`,
                          service: "/multi_navigate",
                          args: {
                            waypoint_ids: [contextTarget.waypoint.id],
                          },
                        })
                      );
                    }}
                  >
                    🧭 导航到此
                  </div>
                  <div
                    style={{ padding: "8px 14px", cursor: "pointer" }}
                    onClick={async () => {
                      sendMessage(
                        JSON.stringify({
                          op: "call_service",
                          id: `call_delete_waypoint_${Date.now()}`,
                          service: "/delete_waypoint",
                          args: {
                            id: contextTarget.waypoint.id,
                          },
                        })
                      );
                      sendMessage(
                        JSON.stringify({
                          op: "call_service",
                          id: `create_waypoint_${Date.now() + 1}`,
                          service: "/list_waypoints",
                          args: {},
                        })
                      );
                    }}
                  >
                    🧭 删除点位
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
        {editingNode && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setEditingNode(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1f1f1f",
                color: "#fff",
                borderRadius: 8,
                padding: "16px 20px",
                minWidth: 260,
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ marginBottom: 10, fontSize: 14 }}>x坐标</div>
              <input
                value={editingNode.x}
                onChange={(e) =>
                  setEditingNode({ ...editingNode, x: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: "1px solid #444",
                  background: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                  marginBottom: 10,
                }}
              />
              <div style={{ marginBottom: 10, fontSize: 14 }}>y坐标</div>
              <input
                value={editingNode.y}
                onChange={(e) =>
                  setEditingNode({ ...editingNode, y: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: "1px solid #444",
                  background: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                  marginBottom: 10,
                }}
              />
              <div style={{ marginBottom: 10, fontSize: 14 }}>方向（弧度）</div>
              <input
                value={editingNode.theta}
                onChange={(e) => {
                  const raw = e.target.value;
                  const value = Number(raw);

                  if (Number.isNaN(value)) return;

                  const clampedTheta = Math.max(
                    -Math.PI,
                    Math.min(Math.PI, value)
                  );
                  setEditingNode({
                    ...editingNode,
                    theta: clampedTheta,
                  });
                }}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: "1px solid #444",
                  background: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                  marginBottom: 8,
                }}
              />
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.01"
                value={editingNode.theta}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEditingNode({
                    ...editingNode,
                    theta: Math.max(-Math.PI, Math.min(Math.PI, value)),
                  });
                }}
                style={{
                  width: "100%",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              />
              <div style={{ marginBottom: 10, fontSize: 14 }}>节点名称</div>

              <input
                autoFocus
                value={editingNode.name}
                onChange={(e) =>
                  setEditingNode({ ...editingNode, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: "1px solid #444",
                  background: "#2a2a2a",
                  color: "#fff",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editingNode.name.trim()) {
                    sendMessage(
                      JSON.stringify({
                        op: "call_service",
                        id: `create_waypoint_${Date.now()}`,
                        service: "/create_waypoint",
                        args: {
                          waypoint: {
                            x: editingNode!.x,
                            y: editingNode!.y,
                            theta: editingNode.theta,
                            name: editingNode.name,
                          },
                        },
                      })
                    );
                    sendMessage(
                      JSON.stringify({
                        op: "call_service",
                        id: `create_waypoint_${Date.now()}`,
                        service: "/list_waypoints",
                        args: {},
                      })
                    );
                    setEditingNode(null);
                  }
                  if (e.key === "Escape") {
                    setEditingNode(null);
                  }
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <button onClick={() => setEditingNode(null)} style={btnStyle}>
                  取消
                </button>
                <button
                  disabled={!(editingNode && isValid)}
                  onClick={() => {
                    sendMessage(
                      JSON.stringify({
                        op: "call_service",
                        id: `create_waypoint_${Date.now()}`,
                        service: "/create_waypoint",
                        args: {
                          waypoint: {
                            x: editingNode.x,
                            y: editingNode.y,
                            theta: editingNode.theta,
                            name: editingNode.name,
                          },
                        },
                      })
                    );
                    sendMessage(
                      JSON.stringify({
                        op: "call_service",
                        id: `create_waypoint_${Date.now() + 1}`,
                        service: "/list_waypoints",
                        args: {},
                      })
                    );
                    setEditingNode(null);
                  }}
                  style={{
                    ...btnStyle,
                    background: "#1677ff",
                    opacity: editingNode.name.trim() ? 1 : 0.5,
                  }}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CanvasMap;
