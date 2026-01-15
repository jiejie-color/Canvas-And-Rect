import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import type { Robot, Waypoint } from "../../type";
import { LAUNCH_STATUS_TOPIC, LIST_WAYPOINTS_SERVICE, MAP_TOPIC, ODOMETRY_TOPIC, PLAN_TOPIC, PROJECTED_MAP_TOPIC, ROBOT_POSE_TOPIC, SCAN_TOPIC } from "../../hooks/topic";
import { quaternionToYaw } from "./utils";
import type { Launch_Status_Message, List_Waypoints_Message, Map_Message, Odometry_Message, Plan_Message, Robot_Bose_Message, Scan_Message } from "../../type/topicRespon";


export const useGetData = () => {
    const { sendMessage, emitter } = useWebSocketContext();

    const [mapData, setMapData] = useState<Map_Message | null>(null); // 添加状态存储地图数据
    const [projected_map, setProjected_map] = useState<Map_Message | null>(null); // 添加状态存储地图数据
    const [robot, setRobot] = useState<Robot>({ x: 0, y: 0, yaw: 0 });
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [laserScan, setLaserScan] = useState<Scan_Message>();
    const [plan, setPlan] = useState<Plan_Message>(); // 新增路径规划状态存储
    const launch_statusRef = useRef<Launch_Status_Message>({ msg: { mapping_running: false, navigation_running: false } });


    useEffect(() => {
        const handleMapTopic = (res: Map_Message) => setMapData(res);
        sendMessage({ op: "subscribe", topic: MAP_TOPIC });
        emitter.on(MAP_TOPIC, handleMapTopic);

        const handleProjectedMapTopic = (res: Map_Message) => setProjected_map(res);
        emitter.on(PROJECTED_MAP_TOPIC, handleProjectedMapTopic);
        sendMessage({
            op: "subscribe", topic: ROBOT_POSE_TOPIC, throttle_rate: 200,
        });
        const handleRobotPoseTopic = (res: Robot_Bose_Message) => {
            if (launch_statusRef.current?.msg.mapping_running) return
            setRobot({
                x: res.msg.pose.position.x,
                y: res.msg.pose.position.y,
                yaw: quaternionToYaw(res.msg.pose.orientation),
            })

        };
        emitter.on(ROBOT_POSE_TOPIC, handleRobotPoseTopic);

        sendMessage({
            op: "subscribe", topic: ODOMETRY_TOPIC, throttle_rate: 200,
        });
        const handleOdometryTopic = (res: Odometry_Message) => {
            if (launch_statusRef.current?.msg.mapping_running) {
                setRobot({
                    x: res.msg.pose.pose.position.x,
                    y: res.msg.pose.pose.position.y,
                    yaw: quaternionToYaw(res.msg.pose.pose.orientation),
                })
            }
        };
        emitter.on(ODOMETRY_TOPIC, handleOdometryTopic);

        const handleListWaypointsTopic = (res: List_Waypoints_Message) => setWaypoints(res.values.waypoints ?? []);
        sendMessage({
            op: "call_service", service: LIST_WAYPOINTS_SERVICE, id: LIST_WAYPOINTS_SERVICE
        });
        emitter.on(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);

        const handleScanTopic = (res: Scan_Message) => setLaserScan(res);
        emitter.on(SCAN_TOPIC, handleScanTopic);

        const handlePlanTopic = (res: Plan_Message) => setPlan(res);
        emitter.on(PLAN_TOPIC, handlePlanTopic);

        const launchStatusListener = (res: Launch_Status_Message) => launch_statusRef.current = res;
        emitter.on(LAUNCH_STATUS_TOPIC, launchStatusListener);

        return () => {
            sendMessage({ op: "unsubscribe", topic: MAP_TOPIC });
            emitter.off(MAP_TOPIC, handleMapTopic);

            sendMessage({ op: "unsubscribe", topic: PROJECTED_MAP_TOPIC });
            emitter.off(PROJECTED_MAP_TOPIC, handleProjectedMapTopic);

            sendMessage({ op: "unsubscribe", topic: ROBOT_POSE_TOPIC });
            emitter.off(ROBOT_POSE_TOPIC, handleRobotPoseTopic);

            emitter.off(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);

            emitter.off(SCAN_TOPIC, handleScanTopic);
            emitter.off(PLAN_TOPIC, handlePlanTopic);
            emitter.off(ODOMETRY_TOPIC, handleOdometryTopic);
            emitter.off(LAUNCH_STATUS_TOPIC, launchStatusListener);

            sendMessage({
                op: "unsubscribe", topic: ODOMETRY_TOPIC, throttle_rate: 200,
            });
        };
    }, [emitter, sendMessage]);

    return { mapData, robot, projected_map, waypoints, laserScan, plan, };
}