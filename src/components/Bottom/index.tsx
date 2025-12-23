import type { WaypointEditState } from "../CanvasMap/types";

export const Bottom = ({
  canvasRef,
  setWaypointEditState,
  waypointEditState,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setWaypointEditState: React.Dispatch<React.SetStateAction<WaypointEditState>>;
  waypointEditState: WaypointEditState;
}) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          textAlign: "center",
          width: "100%",
        }}
      >
        <button
          onClick={() => {
            setWaypointEditState((pre) => {
              const canvas = canvasRef.current;
              const res = pre === "drag" ? "addPoint" : "drag";
              if (canvas) {
                if (res === "drag") {
                  canvas.style.cursor = "";
                } else {
                  canvas.style.cursor = "pointer";
                }
              }
              return res;
            });
          }}
        >
          {waypointEditState === "drag" ? "添加节点" : "取消"}
        </button>
      </div>
    </>
  );
};
