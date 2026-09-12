# browser-tetris

## Todo

[x] initialize tetrion
[ ] spawn tetronimo
[x] tick tetrion
[x] tetronimo falling
[x] rotation/movement
[ ] soft drop (20x)
[x] handle wallkicks
[ ] line clearing
[ ] lock delay
[ ] hard drop
[ ] show next tetronimo
[ ] implement hold tetronimo

A bare [Next.js](https://nextjs.org) starting point for a browser Tetris clone. The playfield is
rendered in WebGL via [React Three Fiber](https://r3f.docs.pmnd.rs/), not as DOM elements.

**There is no game yet.** What's here is the app shell, a spinning placeholder cube proving the 3D
pipeline works end to end, and the tooling the game will be built with: Vitest, ESLint, Prettier.

## How to run

### Requirements

This project targets **Node 24.18.0**, pinned in [`.nvmrc`](./.nvmrc). Older majors will fail —
Next 16 requires Node >= 20.9 and Vitest 5 requires >= 22.12.

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install   # first time only — reads .nvmrc
nvm use       # in every new shell — reads .nvmrc
node -v       # expect v24.18.0
```

`nvm use` has to be re-run per shell unless you've set up nvm's shell hook to auto-switch on `cd`
(see nvm's ["Deeper Shell Integration"](https://github.com/nvm-sh/nvm#deeper-shell-integration)).
Not using nvm? Any Node 24.x works — `nvm install --lts` or your platform's installer is fine.

### Install and run

```bash
npm install
npm run dev     # http://localhost:3000
```

You should see a slowly rotating cyan cube you can orbit with the mouse, plus a HUD overlay in the
corners. For a production build:

```bash
npm run build
npm start
```

### Scripts

| Script                  | What it does                        |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Dev server at http://localhost:3000 |
| `npm run build`         | Production build                    |
| `npm start`             | Serve the production build          |
| `npm test`              | Vitest in watch mode                |
| `npm run test:run`      | Vitest once (CI mode)               |
| `npm run test:coverage` | Vitest with a V8 coverage report    |
| `npm run typecheck`     | `tsc --noEmit`                      |
| `npm run lint`          | ESLint                              |
| `npm run lint:fix`      | ESLint with `--fix`                 |
| `npm run format`        | Prettier, writing changes           |
| `npm run format:check`  | Prettier, check only                |

## Choices and tradeoffs

**React Three Fiber instead of a DOM/CSS grid.** A Tetris board is a natural CSS grid, so 3D is a
deliberate cost: WebGL buys depth, lighting and animation that DOM can't match, and pays for it in
a heavier dependency tree and a render path that can't be asserted on in jsdom. `@react-three/drei`
comes along for helpers like `OrbitControls`.

**React is pinned to exactly 19.2.8.** `@react-three/fiber@9.7.0` declares a peer range of
`react >=19 <19.3`, and React 19.3.0 is already released — so an unpinned install resolves to a
version R3F rejects. `@types/react` is held at `~19.2.x` to match the runtime. Revisit this when
R3F 10 ships (it's alpha at time of writing); until then, treat React upgrades as blocked.

**`three` is pinned to 0.185.1** because `three` ships no bundled types and `@types/three` lags one
minor behind the current release. Keeping the two in lockstep avoids type errors on newer `three`
APIs. Bump both together.

**[Gameplay of Tetris](https://tetris.wiki/Gameplay_of_Tetris) is the gameplay spec.** Board
dimensions, the seven tetrominoes, gravity and lock delay, the 7-bag randomiser, hold, the ghost
piece, line-clear and T-spin scoring, and level progression all follow that page rather than any
one particular version of the game. Where it describes several historical behaviours, take the
modern guideline one. `src/lib/tetrion.ts` implements part of it — gravity, movement, locking and
the bag — and `src/lib/tetrion.test.ts` checks that part against the page. The rest is listed under
"What's incomplete".

**Rotation follows the [Super Rotation System](https://tetris.wiki/Super_Rotation_System) (SRS).**
That's the modern-guideline standard: fixed spawn orientations, rotation about the piece's centre,
and the five-candidate wall-kick tables (with the separate table for I) that make T-spins and
kick-outs behave the way players expect. `src/lib/tetrion.ts` implements it, and
`src/lib/tetrion.test.ts` asserts against the tables on that page rather than against the code's
own behaviour — which is how three transcription bugs were caught. See "Spec conformance".

**Vitest over Jest,** for native TS/ESM handling, near-zero config, and a fast watch loop — which
matters because the game logic is where the tests will live.

**Tests are logic-only, on purpose.** Vitest runs in the `node` environment and its `include` glob
only matches `.ts`, not `.tsx`. Tetris rules — rotation, wall kicks, collision, line clears — are
pure functions over plain data, and that's where unit tests earn their cost. Component tests were
explicitly deferred, which also sidesteps the fact that jsdom has no WebGL context, so a `<Canvas>`
can't be mounted in a DOM test anyway. See "Next steps" for how to add them later.

**Tailwind v4** uses CSS-first configuration — there's no `tailwind.config.ts`; theme tokens live in
the `@theme` block in `src/app/globals.css`. Prettier's Tailwind plugin is pointed at that
stylesheet via `tailwindStylesheet` so it can still sort class names.

**No `next/font`.** The Geist fonts that `create-next-app` wires up need mocking under Vitest and
fetch at build time. A system font stack avoids both for no real loss on a game UI.

**ESLint is held at 9.x, not 10.** ESLint 10 is out and npm will warn that 9.x is end-of-life,
but `eslint-config-next@16.3.4` bundles an `eslint-plugin-react` that crashes on ESLint 10
(`contextOrFilename.getFilename is not a function`). Upgrading is blocked until Next ships a
compatible config; the deprecation warning on `npm install` is expected.

**ESLint owns correctness, Prettier owns formatting.** `eslint-config-prettier` is applied last in
`eslint.config.mjs` to switch off every stylistic rule that would otherwise fight Prettier.

## Spec conformance

`src/lib/tetrion.test.ts` checks the tetrion against the wiki pages rather than against its own
behaviour, so the suite is the record of how far the implementation has got.

**Verified correct.** The base rotation maths and all four states of every piece; the SRS kick
tables, their values, their vertical sign and the transition indexing; the 7-bag generator, which
deals a full permutation before reshuffling and never strands a piece more than twelve draws; and
movement, collision and top-out detection.

Three deviations were found by the first pass of this suite and have since been fixed: the kick
offsets were vertically inverted (the wiki tables are y-up, the playfield indexes rows top-down),
the J and L shapes were attached to each other's names, and `isGameOver` was never set on a blocked
spawn. The tests that caught them are still in place.

**Still red on purpose.** Around 42 tests fail because the feature they describe does not exist
yet, not because anything is wrong. They are listed below and they go green as each feature lands.

## What's incomplete

The game core exists in `src/lib/tetrion.ts` — spawning, gravity, movement, rotation with wall
kicks, soft drop and locking — driven by `src/components/Tetrion.tsx`. Everything below has failing
tests waiting for it in `src/lib/tetrion.test.ts`, so `npm run test:run` doubles as the to-do list.
Measured against [the gameplay spec](https://tetris.wiki/Gameplay_of_Tetris):

- **No line clearing** — completed rows are never detected or removed, so the field only fills up.
  6 failing tests.
- **No scoring or levels** — `score`, `level` and `linesCleared` exist as fields but are never
  updated, and gravity is a fixed interval instead of the guideline curve
  `(0.8 - (level - 1) * 0.007) ^ (level - 1)` seconds per row. 10 failing tests.
- **No lock delay** — a piece locks the instant it cannot fall, with none of the 0.5 s and
  15 move-resets the guideline allows. 6 failing tests.
- **No hard drop, hold, or ghost piece.** `nextTetromino` is tracked but never shown. 10 failing
  tests, written against a `PlannedTetrion` interface declared in the test file — `hardDrop()`,
  `hold()`, `heldTetromino`, `ghostPosition` — so they name the API to build without `tetrion.ts`
  having to declare it yet.
- **Soft drop is 4x gravity**, where the guideline is 20x, and it awards no points. 2 failing
  tests, measured at level 10 because at level 1 both rates happen to land on 0.05 s per row.
- **Spawn placement is off-guideline** — pieces spawn at column 4 rather than centred at column 3,
  and inside the visible field rather than in buffer rows above it. 4 failing tests.
- **No UI/component tests** — deliberate, see above.
- **No E2E tests, no CI pipeline, no coverage thresholds.**
- **No persistence** — no high scores, no settings.
- **A benign console warning** — `THREE.Clock: This module has been deprecated` comes from inside
  `@react-three/fiber`, not from this code. It clears when R3F updates its internals.
- **No accessibility or mobile input work.** A WebGL canvas is opaque to screen readers, and there
  are no touch controls.

## Next steps

Suggested build order, roughly dependency-first:

1. **Domain types and constants** in `src/lib/` — `Cell`, `Piece`, `Board`, the seven tetromino
   shapes, board dimensions.
2. **Pure functions, test-first** — spawn, rotate
   ([SRS](https://tetris.wiki/Super_Rotation_System) with wall kicks), collision detection, lock,
   line clear, scoring. This is what the Vitest setup exists for.
3. **State management** — a reducer over the pure functions, exposed through a `useGame` hook.
4. **Input and timing** — keyboard handling (DAS/ARR for held keys) and a gravity loop driven by
   `useFrame` inside the Canvas.
5. **Real board rendering** — replace `PlaceholderBlock` with an instanced mesh so 200+ cells stay
   one draw call, plus a ghost piece and a next/hold preview.
6. **Scoring, levels, and game-over UI** wired into the HUD.
7. **Add UI tests when there's UI worth testing** — install `jsdom` and `@testing-library/react`
   for DOM chrome, and `@react-three/test-renderer` for scene-graph assertions (it builds the
   three.js graph without needing a WebGL context). Then widen the Vitest `include` glob to `.tsx`
   and switch the environment to `jsdom`.
8. **E2E and CI** — Playwright for a real browser run, and a GitHub Actions workflow running
   `typecheck`, `lint`, `format:check`, `test:run`, and `build`.

## Credits

Game assets — block sprites, music, and sound effects — come from the
[Tetris Asset Pack](https://hat-tap.itch.io/tetris-asset-pack) by hat-tap on itch.io.

The test suite in `src/lib/tetrion.test.ts`, the spec verification behind it, and the
"Spec conformance" section above were written by Claude (Opus 5) via
[Claude Code](https://claude.com/claude-code). The game logic it tests is hand-written; Claude has
not modified it, so the tests that stay red are describing work still to do rather than reporting
a regression.

Tetris is a trademark of the Tetris Company. This is an unaffiliated hobby clone.
