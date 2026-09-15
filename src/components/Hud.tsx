"use client";

import { useGameUI } from "./GameUIContext";

/**
 * Placeholder heads-up display. Values are hard-coded until game state exists.
 */
export default function Hud() {
  const { score, level, lines, isGameOver } = useGameUI();

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 text-zinc-100">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tetris</h1>
      </header>
      <div className="place-self-center" hidden={!isGameOver}>
        Game Over
      </div>
      <dl className="flex gap-8 font-mono text-sm">
        <div>
          <dt className="text-zinc-400">Score</dt>
          <dd className="text-lg">{score}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Level</dt>
          <dd className="text-lg">{level}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Lines</dt>
          <dd className="text-lg">{lines}</dd>
        </div>
      </dl>
    </div>
  );
}
