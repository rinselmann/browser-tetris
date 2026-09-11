"use client";

import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Tetrion } from "./Tetrion";

/**
 * Scaffold scene. This exists to prove the WebGL pipeline works end to end;
 * the real game will replace the placeholder block with the playfield.
 */
export default function GameCanvas() {
  return (
    <Canvas camera={{ position: [3, 3, 5], fov: 50 }} className="bg-board-bg">
      <OrthographicCamera makeDefault position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={40} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <Tetrion />
    </Canvas>
  );
}
