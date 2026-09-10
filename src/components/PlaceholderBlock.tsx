import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * A single cube standing in for one tetromino cell.
 *
 * The `useFrame` loop is the same hook the game loop will eventually use to
 * drive gravity and lock delay, so this doubles as a check that per-frame
 * updates are running.
 */
export default function PlaceholderBlock() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#22d3ee" roughness={0.35} metalness={0.1} />
    </mesh>
  );
}
