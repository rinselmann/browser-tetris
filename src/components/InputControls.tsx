"use client";

import { KeyboardControls, KeyboardControlsEntry, useKeyboardControls } from "@react-three/drei";
import { ReactNode, useMemo } from "react";

export enum Controls {
  moveLeft = "moveLeft",
  moveRight = "moveRight",
  rotateLeft = "rotateLeft",
  rotateRight = "rotateRight",
  softDrop = "softDrop",
}

export interface InputControlsProps {
  children: ReactNode;
}

export default function InputControls({ children }: InputControlsProps) {
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

  return <KeyboardControls map={inputMap}>{children}</KeyboardControls>;
}

export function useInputControls() {
  return useKeyboardControls<Controls>();
}
