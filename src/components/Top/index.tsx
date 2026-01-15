import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { CONTROL_LAUNCH_SERVICE, CURRENT_MAP_INFO_TOPIC, LAUNCH_STATUS_TOPIC, NAVIGATION_STATUS_TOPIC, PAUSE_NAVIGATION_SERVICE } from "../../hooks/topic";
import type { Current_Map_Info_Message, Launch_Status_Message, Navigation_Status_Message } from "../../type/topicRespon";

export const Top = () => {
  const hasStartedRef = useRef(false);
  const [navigationStatus, setNavigationStatus] = useState<Navigation_Status_Message>();
  const [curMap, setCurMap] = useState<string>();
  const [launch_status, setLaunch_status] = useState<Launch_Status_Message>();
  const { sendMessage, emitter } = useWebSocketContext();

  useEffect(() => {
    const launchStatusListener = (res: Launch_Status_Message) => setLaunch_status(res);
    emitter.on(LAUNCH_STATUS_TOPIC, launchStatusListener);
    const navigationStatusListener = (res: Navigation_Status_Message) => setNavigationStatus(res);
    emitter.on(NAVIGATION_STATUS_TOPIC, navigationStatusListener);
    const currentMapInfoListener = (res: Current_Map_Info_Message) => setCurMap(res.msg.map_name)
    emitter.on(CURRENT_MAP_INFO_TOPIC, currentMapInfoListener);

    // 发送订阅消息
    sendMessage({ op: "subscribe", topic: NAVIGATION_STATUS_TOPIC });
    sendMessage({
      op: "subscribe",
      id: LAUNCH_STATUS_TOPIC,
      topic: LAUNCH_STATUS_TOPIC,
    });
    sendMessage({
      op: "subscribe",
      id: CURRENT_MAP_INFO_TOPIC,
      topic: CURRENT_MAP_INFO_TOPIC,
    });
    // 清理回调
    return () => {
      sendMessage({
        op: "unsubscribe",
        id: LAUNCH_STATUS_TOPIC,
        topic: LAUNCH_STATUS_TOPIC,
      });
      emitter.off(LAUNCH_STATUS_TOPIC, launchStatusListener);
      sendMessage({
        op: "unsubscribe",
        id: CURRENT_MAP_INFO_TOPIC,
        topic: CURRENT_MAP_INFO_TOPIC,
      });
      emitter.off(CURRENT_MAP_INFO_TOPIC, currentMapInfoListener);
      sendMessage({
        op: "unsubscribe",
        id: NAVIGATION_STATUS_TOPIC,
        topic: NAVIGATION_STATUS_TOPIC,
      });
      emitter.off(NAVIGATION_STATUS_TOPIC, navigationStatusListener);
    };
  }, [emitter, sendMessage]);

  useEffect(() => {
    if (!launch_status) {
      return;
    }
    const running = launch_status.msg.navigation_running;

    if (!running && !hasStartedRef.current) {
      sendMessage({
        op: "call_service",
        service: CONTROL_LAUNCH_SERVICE,
        args: {
          launch_type: "car_vel",
          action: "start",
          package_name: "car_vel"
        },
        id: CONTROL_LAUNCH_SERVICE
      });
    }
    hasStartedRef.current = true;
  }, [launch_status, sendMessage]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 10,
          textAlign: "center",
          width: "100%",
          color: "white",
        }}
      >
        <span style={{ margin: '0 20px' }}>
          当前地图: {curMap}
        </span>
        <span>
          {launch_status?.msg.mapping_running
            ? `建图模式:开启`
            : null}
        </span>
        <span style={{ margin: '0 20px' }}>
          {launch_status?.msg.navigation_running
            ? `导航模式:开启`
            : null}
        </span>

        {navigationStatus
          ? `导航状态: ${navigationStatus?.msg.status} 导航点位: ${navigationStatus?.msg.waypoint_name}`
          : null}
        {navigationStatus?.msg.status === "navigating" ? (
          <button
            style={{ marginLeft: 10 }}
            onClick={() => {
              sendMessage(
                ({
                  op: "call_service",
                  service: PAUSE_NAVIGATION_SERVICE,
                  id: PAUSE_NAVIGATION_SERVICE,
                })
              );
            }}
          >
            取消导航
          </button>
        ) : null}
      </div>
    </>
  );
};
