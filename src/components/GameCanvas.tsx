"use client";

import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Tetrion } from "./Tetrion";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { OrthographicCamera as ThreeOrthographicCamera } from "three";

const BOARD_ROWS = 20;
const BOARD_COLUMNS = 10;
const BOARD_PADDING = 1.3;

function ResponsiveBoardCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof ThreeOrthographicCamera)) {
      return;
    }

    camera.zoom = Math.min(
      size.width / (BOARD_COLUMNS * BOARD_PADDING),
      size.height / (BOARD_ROWS * BOARD_PADDING),
    );
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
}

/**
 * Scaffold scene. This exists to prove the WebGL pipeline works end to end;
 * the real game will replace the placeholder block with the playfield.
 */
export default function GameCanvas() {
  return (
    <Canvas className="bg-board-bg">
      <OrthographicCamera
        makeDefault
        position={[0, 5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <ResponsiveBoardCamera />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <Tetrion />
    </Canvas>
  );
}
