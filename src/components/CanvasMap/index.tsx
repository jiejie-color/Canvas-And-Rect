import { useEffect, useRef, useState } from "react";
import type { OperatingState } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
// import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { drawPath } from "./render/drawPath"; // 导入路径绘制函数
import { ContextMenu } from "./components/ContextMenu";
import type { Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";
import { drawLaserScan } from "./render/drawLaserScan";
import { RobotControls } from "../RobotControls";
import { drawFreePoints } from "./render/drawFreePoints";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { useGetData } from "./useGetData";
import { Top } from "../Top";

const CanvasMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [operatingState, setOperatingState] =
    useState<OperatingState>("");
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  // const [mode, setMode] = useState<Mode>("navigation");
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isLaser, setIsLaser] = useState<boolean>(false);
  const [isPlan, setIsPlan] = useState<boolean>(false);
  const [isRobotControls, setIsRobotControls] = useState<boolean>(false);
  const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);
  const { sendMessage, mode, setMode, mapData, } = useWebSocketContext();
  const { robot, waypoints, laserScan, plan, } = useGetData();

  const { view, coord } = usePanZoom(
    canvasRef,
    operatingState,
    setOperatingState,
    setEditingNode,
    setIsEditingNode,
    mapData,
    editingNode,
    setMapRotation,
    mapRotation,
    setFreePoints,
    freePoints,
  );
  const { ctxRef } = useCanvasInit(canvasRef, containerRef,);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

    // 逐个渲染不同的图层
    renderMapLayer(ctx);
    renderRobotLayer(ctx);
    renderLaserLayer(ctx);
    renderNavigationLayer(ctx);
    renderEditingLayer(ctx);

    ctx.restore();

    // 辅助函数定义
    function renderMapLayer(context: CanvasRenderingContext2D) {
      if (mapData) {
        drawMap(context, mapData, coord.worldToCanvas, view.scale);
      }
    }

    function renderRobotLayer(context: CanvasRenderingContext2D) {
      if ((mode === "navigation" || mode === "mapping") && robot) {
        drawRobot(context, robot, coord.worldToCanvas, view.scale);
      }
    }

    function renderLaserLayer(context: CanvasRenderingContext2D) {
      if (laserScan && isLaser && robot) {
        drawLaserScan(context, laserScan, coord.worldToCanvas, robot);
      }
    }

    function renderNavigationLayer(context: CanvasRenderingContext2D) {
      if (mode === "navigation") {
        if (waypoints) {
          drawWaypoints(context, waypoints, coord.worldToCanvas);
        }

        if (plan && isPlan) {
          drawPath(context, plan, coord.worldToCanvas);
        }

        if ((operatingState === "addPoint" || operatingState === "setInitialPose") && editingNode) {
          drawArrow(context, editingNode, coord);
        }
      }
    }

    function renderEditingLayer(context: CanvasRenderingContext2D) {
      if (mode === "editing" && (operatingState === "freeErase" || operatingState === "addObstacles")) {
        console.log(freePoints);
        drawFreePoints(context, freePoints);
      }
    }
  }, [
    mapData,
    robot,
    laserScan,
    waypoints,
    plan,
    view,
    ctxRef,
    coord,
    editingNode,
    operatingState,
    mode,
    isLaser,
    isPlan,
    freePoints
  ]);
  return (
    <>
      <Top></Top>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh", backgroundColor: "#303030" }}>
        <canvas ref={canvasRef} />
      </div>
      <ContextMenu
        canvasRef={canvasRef}
        waypoints={waypoints}
        coord={coord}
        setEditingNode={setEditingNode}
        sendMessage={sendMessage}
        operatingState={operatingState}
        setIsEditingNode={setIsEditingNode}
      ></ContextMenu>
      {isEditingNode ? (
        <WaypointEditor
          editingNode={editingNode!}
          setEditingNode={setEditingNode}
          sendMessage={sendMessage}
          setIsEditingNode={setIsEditingNode}
        ></WaypointEditor>
      ) : null}
      <Bottom
        canvasRef={canvasRef}
        operatingState={operatingState}
        setOperatingState={setOperatingState}
        mode={mode}
        setMode={setMode}
        setIsLaser={setIsLaser}
        isLaser={isLaser}
        isPlan={isPlan}
        setIsPlan={setIsPlan}
        isRobotControls={isRobotControls}
        setIsRobotControls={setIsRobotControls}
      ></Bottom>
      {isRobotControls ? <RobotControls></RobotControls> : null}

    </>
  );
};

export default CanvasMap;