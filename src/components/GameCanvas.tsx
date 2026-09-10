"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import PlaceholderBlock from "@/components/PlaceholderBlock";

/**
 * Scaffold scene. This exists to prove the WebGL pipeline works end to end;
 * the real game will replace the placeholder block with the playfield.
 */
export default function GameCanvas() {
  return (
    <Canvas camera={{ position: [3, 3, 5], fov: 50 }} className="bg-board-bg">
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <PlaceholderBlock />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
