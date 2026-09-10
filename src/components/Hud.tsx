/**
 * Placeholder heads-up display. Values are hard-coded until game state exists.
 */
export default function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 text-zinc-100">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tetris</h1>
        <p className="text-sm text-zinc-400">Scaffold only — no game logic yet.</p>
      </header>

      <dl className="flex gap-8 font-mono text-sm">
        <div>
          <dt className="text-zinc-400">Score</dt>
          <dd className="text-lg">0</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Level</dt>
          <dd className="text-lg">1</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Lines</dt>
          <dd className="text-lg">0</dd>
        </div>
      </dl>
    </div>
  );
}
