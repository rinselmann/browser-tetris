export function TetrionGrid() {
  return (
    <group>
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, -5]} />
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, 5]} />
    </group>
  );
}