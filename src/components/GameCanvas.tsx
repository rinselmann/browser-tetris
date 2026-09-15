"use client";

import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Tetrion } from "./Tetrion";
import { useThree } from "@react-three/fiber";

const BOARD_ROWS = 20;
const BOARD_COLUMNS = 10;
const BOARD_PADDING = 1.3;

export function GameCamera() {
  const { size } = useThree();

  const zoom = Math.min(
    size.width / (BOARD_COLUMNS * BOARD_PADDING),
    size.height / (BOARD_ROWS * BOARD_PADDING),
  );

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      zoom={zoom}
    />
  );
}

export default function GameCanvas() {
  return (
    <Canvas className="bg-board-bg">
      <GameCamera />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <Tetrion />
    </Canvas>
  );
}
