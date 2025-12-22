
export function quaternionToYaw(q: {
  w: number;
  x: number;
  y: number;
  z: number;
}) {
  return Math.atan2(
    2 * (q.w * q.z + q.x * q.y),
    1 - 2 * (q.y * q.y + q.z * q.z)
  );
}


