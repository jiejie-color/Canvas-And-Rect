import React, { useState } from "react"; // 添加React和useState导入
import useWebSocket from "react-use-websocket";
import CanvasMap from "./components/CanvasMap";
export interface Waypoint {
  id?: string;
  x: number; // 世界坐标（米）
  y: number;
  theta: number;
  name: string;
}
function App() {
  // 矩形固定在世界坐标系
  const [mapData, setMapData] = useState(null); // 添加状态存储地图数据
  const [robot, setRobot] = useState({ x: 0, y: 0, yaw: 0 });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [navigationStatus, setNavigationStatus] = useState(null); // 新增导航状态存储
  function quaternionToYaw(q) {
    return Math.atan2(
      2 * (q.w * q.z + q.x * q.y),
      1 - 2 * (q.y * q.y + q.z * q.z)
    );
  }
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    "ws://192.168.18.53:9090",
    {
      onMessage: (event) => {
        try {
          const res = JSON.parse(event.data); // 解析消息
          if (res.topic === "/map") {
            // 处理/map主题的返回
            setMapData(res.msg); // 更新地图数据状态
          } else if (res.topic === "/amcl_pose") {
            const p = res.msg.pose.pose.position;
            const q = res.msg.pose.pose.orientation;

            setRobot({
              x: p.x,
              y: p.y,
              yaw: quaternionToYaw(q),
            });
          } else if (res.service === "/list_waypoints") {
            setWaypoints(res.values.waypoints);
          } else if (res.topic === "/navigation_status") {
            // 处理导航状态主题
            setNavigationStatus(res.msg);
          }
        } catch (e) {
          console.error("解析消息失败:", e);
        }
      },
      onError: (event) => {
        console.error("WebSocket error:", event);
      },
      onOpen: (event) => {
        console.log("WebSocket connection opened");
        sendMessage(JSON.stringify({ op: "subscribe", topic: "/map" }));
        sendMessage(JSON.stringify({ op: "subscribe", topic: "/amcl_pose" }));
        sendMessage(
          JSON.stringify({ op: "subscribe", topic: "/navigation_status" })
        );
        sendMessage(
          JSON.stringify({
            op: "call_service",
            id: "call_list_waypoints_1",
            service: "/list_waypoints",
            args: {},
          })
        );
      },
    }
  );

  return (
    <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          textAlign: "center",
          width: "100%",
        }}
      >
        {navigationStatus
          ? `导航状态: ${navigationStatus?.status} 导航点位: ${navigationStatus?.waypoint_name}`
          : null}
        {navigationStatus?.status === "navigating" ? (
          <button
            style={{
              marginLeft: "10px",
              padding: "6px 12px",
              backgroundColor: "#444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "backgroundColor 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#444")}
            onClick={() => {
              sendMessage(
                JSON.stringify({
                  op: "call_service",
                  service: "/pause_navigation",
                  id: "pause_navigation",
                })
              );
            }}
          >
            取消导航
          </button>
        ) : null}
      </div>
      <CanvasMap
        robot={robot}
        mapData={mapData}
        waypoints={waypoints}
        sendMessage={sendMessage}
        navigationStatus={navigationStatus}
      />
      {/* 传递地图数据给组件 */}
    </div>
  );
}

export default App;
