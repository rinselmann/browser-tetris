import { RefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DefaultTetrion, ITetrion } from "../lib/tetrion";
import { Group, Mesh } from "three";
import { useInputControls } from "./InputControls";
import { useGameUI } from "./GameUIContext";

export function TetrionGrid() {
  return (
    <group>
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, -5]} />
      <gridHelper args={[10, 10, "gray", "gray"]} position={[0, 0, 5]} />
    </group>
  );
}

interface TetrionBlocksProps {
  rows?: number;
  columns?: number;
  tetrionRef: RefObject<ITetrion | null>;
}

export function TetrionBlocks({ rows = 20, columns = 10, tetrionRef }: TetrionBlocksProps) {
  const [, get] = useInputControls();
  const blocksRef = useRef<Group>(null!);
  const inputStateRef = useRef(get());
  const { score, lines, level, setScore, setLines, setLevel } = useGameUI();

  useFrame(() => {
    const tetrion = tetrionRef.current;
    if (!tetrion || !blocksRef.current) {
      return;
    }

    blocksRef.current.children.forEach((block, index) => {
      if (block instanceof Mesh) {
        const row = index % rows;
        const col = Math.floor(index / rows);
        const cell = tetrion.playfield[row][col];

        block.visible = cell !== null;
        block.material.color.set(cell?.color || "gray");
      }
    });

    // handle input
    const controls = get();
    if (controls.moveLeft && !inputStateRef.current.moveLeft) {
      tetrion.moveTetrominoLeft();
    }
    if (controls.moveRight && !inputStateRef.current.moveRight) {
      tetrion.moveTetrominoRight();
    }
    if (controls.rotateLeft && !inputStateRef.current.rotateLeft) {
      tetrion.rotateTetrominoLeft();
    }
    if (controls.rotateRight && !inputStateRef.current.rotateRight) {
      tetrion.rotateTetrominoRight();
    }

    // Space key activates soft drop
    if (controls.softDrop && !inputStateRef.current.softDrop) {
      tetrion.activateSoftDrop();
    } else if (!controls.softDrop && inputStateRef.current.softDrop) {
      tetrion.deactivateSoftDrop();
    }

    inputStateRef.current = controls;

    // Update score in the hud
    if (score !== tetrion.score) {
      setScore(tetrion.score);
    }

    if (level !== tetrion.level) {
      setLevel(tetrion.level);
    }

    if (lines !== tetrion.linesCleared) {
      setLines(tetrion.linesCleared);
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

  useFrame((_state, delta) => {
    if (!tetrionRef.current) {
      tetrionRef.current = new DefaultTetrion();
    }

    tetrionRef.current?.tick(delta);
  });

  return (
    <group>
      <TetrionGrid />
      <TetrionBlocks tetrionRef={tetrionRef} />
    </group>
  );
}
