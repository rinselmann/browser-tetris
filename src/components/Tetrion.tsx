import { RefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ITetrion, DefaultTetrion } from "../lib/tetrion";
import { Group, Mesh } from "three";
import { KeyboardControls, KeyboardControlsEntry, useKeyboardControls } from "@react-three/drei";

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
  const [, get] = useKeyboardControls<Controls>();
  const blocksRef = useRef<Group>(null!);
  const inputStateRef = useRef(get());

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

enum Controls {
  moveLeft = "moveLeft",
  moveRight = "moveRight",
  rotateLeft = "rotateLeft",
  rotateRight = "rotateRight",
  softDrop = "softDrop",
}

export function Tetrion() {
  const tetrionRef = useRef<ITetrion | null>(null);

  useFrame((_state, delta) => {
    if (!tetrionRef.current) {
      tetrionRef.current = new DefaultTetrion();
    }

    tetrionRef.current?.tick(delta);
  });

  const inputMap = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [
      { name: Controls.moveLeft, keys: ["ArrowLeft", "A"] },
      { name: Controls.moveRight, keys: ["ArrowRight", "D"] },
      { name: Controls.rotateLeft, keys: ["ArrowUp", "W"] },
      { name: Controls.rotateRight, keys: ["ArrowDown", "S"] },
      { name: Controls.softDrop, keys: ["Space"] },
    ],
    [],
  );

  return (
    <KeyboardControls map={inputMap}>
      <group>
        <TetrionGrid />
        <TetrionBlocks tetrionRef={tetrionRef} />
      </group>
    </KeyboardControls>
  );
}
