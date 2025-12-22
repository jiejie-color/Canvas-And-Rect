export const Bottom = ({
  canvasRef,
  isSetWaypoint,
  setIsSetWaypoint,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isSetWaypoint: boolean;
  setIsSetWaypoint: React.Dispatch<React.SetStateAction<boolean>>;
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
            setIsSetWaypoint((pre) => {
              const canvas = canvasRef.current;
              if (canvas) {
                if (pre) {
                  canvas.style.cursor = "";
                } else {
                  canvas.style.cursor = "pointer";
                }
              }
              return !pre;
            });
          }}
        >
          {isSetWaypoint ? "取消" : "添加节点"}
        </button>
      </div>
    </>
  );
};
