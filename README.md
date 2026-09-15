# browser-tetris

A small browser based Tetris clone. The app consists of a Nextjs wrapper around a 3d game view rendered using React Three Fiber.

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

You should see a playable board: pieces fall, lock and clear, with a HUD showing score, level and
lines, and a Game Over message on top-out. For a production build:

```bash
npm run build
npm start
```

### Controls

| Key           | Action                   |
| ------------- | ------------------------ |
| `Left` / `A`  | Move left                |
| `Right` / `D` | Move right               |
| `Up` / `W`    | Rotate counter-clockwise |
| `Down` / `S`  | Rotate clockwise         |
| `Space`       | Soft drop (hold)         |

Hard drop and hold are not bound yet — see "What's incomplete".

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

**Next.js/React Three Fiber**. Next.js is used for the wrapper and build/dev
environment. The main gameplay area is rendered using React Three Fiber. Currently
the graphics are full 3d, but very simple, with the idea that in the future,
the pieces would be given more texture, and lighting, cinematic camera motion,
and fx could be used for things like line clearing, game intro/ending, etc.

**Focus on Gameplay**. This app focuses on the primary gameplay of Tetris, over
providing a more "full" game experience in order to limit the scope for time.

**Gameplay based on [Gameplay of Tetris](https://tetris.wiki/Gameplay_of_Tetris) and
[Tetris Guideline](https://tetris.wiki/Tetris_Guideline).** The majority of the
time on this demo was spent polishing gameplay so that it is smooth and also follows
standard Tetris guidelines. The tradeoff is that other game features are missing
from this demo, such as high score list, game dashboard, sound, etc.

**Rotation follows the [Super Rotation System](https://tetris.wiki/Super_Rotation_System) (SRS).**
That's the modern-guideline standard: fixed spawn orientations, rotation about the piece's centre,
and the five-candidate wall-kick tables (with the separate table for I) that make T-spins and
kick-outs behave the way players expect.

**Tests are logic-only, on purpose.** Vitest runs in the `node` environment and its `include` glob
only matches `.ts`, not `.tsx`. Game state and Tetris rules — rotation, wall kicks, collision, line
clears — are tested thoroughly, but UI components are not currently tested just to limit the scope.

## Spec conformance

`src/lib/tetrion.test.ts` checks the tetrion against the wiki pages rather than against its own
behaviour, so the suite is the record of how correct the implementation is.

**Verified correct.** 75 passing tests cover the base rotation maths and all four states of every
piece; the SRS kick tables, their values, their vertical sign and the transition indexing; the
7-bag generator, which deals a full permutation before reshuffling and never strands a piece more
than twelve draws; movement, collision and top-out; line clearing through to a tetris; the
100/300/500/800 × level scoring and the level-every-ten-lines progression; the guideline gravity
curve; lock delay with its move resets and fifteen-reset budget; the 20× soft drop and its one
point per cell; and guideline spawn columns.

Three deviations were found by the first pass of this suite and have since been fixed: the kick
offsets were vertically inverted (the wiki tables are y-up, the playfield indexes rows top-down),
the J and L shapes were attached to each other's names, and `isGameOver` was never set on a
blocked spawn. The tests that caught them are still in place.

**Still red on purpose.** 10 tests fail — 3 for hard drop, 4 for hold, 3 for the ghost piece —
because those features have not been implemented yet.

## Todo

- [x] initialize tetrion
- [x] spawn tetronimo
- [x] tick tetrion
- [x] tetronimo falling
- [x] rotation/movement
- [x] soft drop (20x)
- [x] handle wallkicks
- [x] line clearing
- [x] lock delay
- [ ] hard drop
- [ ] show next tetronimo
- [ ] implement hold tetronimo
- [ ] game start dialog
- [ ] game end/restart dialog

## What's incomplete

`src/lib/tetrion.ts` holds the game core — spawning, gravity, movement, rotation with wall kicks,
soft drop, lock delay, locking, line clearing, scoring and levels — driven by
`src/components/Tetrion.tsx`. What is left:

- **No hard drop, hold, or ghost piece.** 10 failing tests are waiting for them in
  `src/lib/tetrion.test.ts`, written against a `PlannedTetrion` interface declared in the test file
  — `hardDrop()`, `hold()`, `heldTetromino`, `ghostPosition` — so they name the API to build
  without `tetrion.ts` having to declare it yet.
- **No next-piece preview.** `nextTetromino` is tracked on the tetrion but nothing renders it.
- **The asset pack is checked in but unused.** `src/assets/` holds block sprites, UI frames, music
  and sound effects; no code references any of them yet, so the game runs silent with plain
  coloured cubes.
- **A leftover placeholder.** `src/lib/example.ts` and its test still exist from the scaffold and
  can go whenever.
- **No persistence** — no high scores, resume after page refresh, or settings
- **A benign console warning** — `THREE.Clock: This module has been deprecated` comes from inside
  `@react-three/fiber`, not from this code. It clears when R3F updates its internals.

## Next steps

1. **Hard drop, hold and ghost piece** — the 10 red tests define
   the API; binding hard drop and hold to keys follows in
   `src/components/InputControls.tsx`.
2. **Performance Pass** Due to time constraints and the fact  
   that 3d resources are not constantly being destroyed and
   created, not much work went into verifying that resources
   are cleaned up correctly.
3. **Next-piece and hold previews** in the HUD, reading
   `nextTetromino` and `heldTetromino`.
4. **Persistance** The initial pass of this would likely use a
   simple client authoritative model, where a backend api is
   provided simply to provide remotely accessible gamestate
   storage.
5. **Sound Effects**
6. **Game Dashboard**
7. **High Score List**
8. **Accessibility**

## Credits

Tetris is a trademark of the Tetris Company. This is an unaffiliated hobby clone.

### AI assistance

- The test suite in `src/lib/tetrion.test.ts`, the spec verification behind it, and the
  "Spec conformance" section above were written by Claude (Opus 5) via
  [Claude Code](https://claude.com/claude-code) and tweaked by hand as code changes
  were made for failing tests. The game logic it tests is hand-written; Claude has
  not modified it, so the tests that stay red are describing work still to do rather than reporting
  a regression.
- The game wrapper, consisting of a bare Next.js app with eslint/prettier and React Three Fiber
  support was generated by Claude.
- The readme was written using assistance from Claude code
- In the interest of time, a few bugs were fixed or diagnosed by Claude, such as
  a bug in the the way the wall kick tables were implemented (y down vs y up)
