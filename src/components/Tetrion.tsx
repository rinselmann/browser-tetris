import { createContext, useContext, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ITetrion, DefaultTetrion } from "../lib/tetrion";
import { Group, Mesh } from "three";

export function TetrionGrid() {
  return (
    <group>
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, -5]} />
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, 5]} />
    </group>
  );
}

const TetrionContext = createContext<ITetrion | null>(null);
function useTetrion() {
  return useContext(TetrionContext);
}

export function TetrionBlocks({ rows = 20, columns = 10 }: { rows?: number; columns?: number }) {
  const tetrion = useTetrion();
  const blocksRef = useRef<Group>(null!);

  useFrame(() => {
    if (blocksRef.current && tetrion) {
      blocksRef.current.children.forEach((block, index) => {
        if (block instanceof Mesh) {
          const row = index % rows;
          const col = Math.floor(index / rows);
          const cell = tetrion.playfield[row][col];

          block.visible = cell !== null;
          block.material.color.set(cell?.color || "gray");
        }
      });
    }
  });

  // Render a grid of blocks with changeable colors based on the playfield dimensions
  return (
    <group ref={blocksRef}>
      {Array.from({ length: columns }, (_, i) =>
        Array.from({ length: rows }, (_, j) => (
          <mesh key={`${i}-${j}`} position={[i - (columns / 2 - 0.5), 0, j - (rows / 2 - 0.5)]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Tetrion() {
  const tetrionRef = useRef<ITetrion | null>(null);

  if (!tetrionRef.current) {
    tetrionRef.current = new DefaultTetrion();
  }

  useFrame((_state, delta) => {
    tetrionRef.current?.tick(delta);
  });

  return (
    <TetrionContext.Provider value={tetrionRef.current}>
      <group>
        <TetrionGrid />
        <TetrionBlocks />
      </group>
    </TetrionContext.Provider>
  );
}
