"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface GameUIState {
  level: number;
  score: number;
  lines: number;
  isGameOver: boolean;
  setLevel: (level: number) => void;
  setScore: (score: number) => void;
  setLines: (lines: number) => void;
  setIsGameOver: (isGameOver: boolean) => void;
}

export const GameUIContext = createContext<GameUIState>({
  level: 1,
  score: 0,
  lines: 0,
  isGameOver: false,
  setLevel: () => {},
  setScore: () => {},
  setLines: () => {},
  setIsGameOver: () => {},
});

export function useGameUI() {
  return useContext(GameUIContext);
}

export interface GameUIProviderProps {
  children: ReactNode;
}

export function GameUIProvider({ children }: GameUIProviderProps) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const context = useMemo(
    () => ({
      score,
      level,
      lines,
      isGameOver,
      setScore,
      setLevel,
      setLines,
      setIsGameOver,
    }),
    [score, level, lines, isGameOver],
  );

  return <GameUIContext.Provider value={context}>{children}</GameUIContext.Provider>;
}
