import { useEffect, useRef, useState } from "react";
import type { CanvasMapProps } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { ContextMenu } from "./components/ContextMenu";
import type { Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";

const CanvasMap = (props: CanvasMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSetWaypoint, setIsSetWaypoint] = useState<boolean>(false); // canvas px
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const { scale, offset, setScale, setOffset, coord } = usePanZoom(
    canvasRef,
    isSetWaypoint,
    setEditingNode,
    setIsSetWaypoint,
    editingNode,
    setIsEditingNode
  );
  const { ctxRef } = useCanvasInit(
    canvasRef,
    containerRef,
    props.mapData,
    setScale,
    setOffset
  );
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !props.mapData) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawMap(ctx, props.mapData, coord.worldToCanvas, scale);
    drawGrid(
      ctx,
      props.mapData,
      coord.worldToCanvas,
      scale,
      props.baseGridSize
    );
    drawRobot(ctx, props.robot, coord.worldToCanvas, scale);
    drawWaypoints(ctx, props.waypoints, coord.worldToCanvas);
    if (editingNode) {
      drawArrow(ctx, editingNode.x, editingNode.y, editingNode.theta, coord);
    }
  }, [props, scale, offset, ctxRef, coord, editingNode]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <canvas ref={canvasRef} />
      </div>
      <ContextMenu
        canvasRef={canvasRef}
        waypoints={props.waypoints}
        coord={coord}
        setEditingNode={setEditingNode}
        sendMessage={props.sendMessage}
        scale={scale}
        offset={offset}
        isSetWaypoint={isSetWaypoint}
        setIsEditingNode={setIsEditingNode}
      ></ContextMenu>
      {isEditingNode ? (
        <WaypointEditor
          editingNode={editingNode!}
          setEditingNode={setEditingNode}
          sendMessage={props.sendMessage}
          setIsEditingNode={setIsEditingNode}
        ></WaypointEditor>
      ) : null}

      <Bottom
        canvasRef={canvasRef}
        isSetWaypoint={isSetWaypoint}
        setIsSetWaypoint={setIsSetWaypoint}
      ></Bottom>
    </>
  );
};

export default CanvasMap;
