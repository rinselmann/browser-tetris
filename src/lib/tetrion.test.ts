import {
  DefaultTetrion,
  TetrionConfig,
  createDefaultBag,
  createDefaultTetrominoes,
  createEmptyPlayfield,
} from "@/lib/tetrion";

/**
 * Specs this suite checks the implementation against:
 *   SRS ............ https://tetris.wiki/Super_Rotation_System
 *   7-bag .......... https://tetris.wiki/Random_Generator
 *   Gameplay ....... https://tetris.wiki/Gameplay_of_Tetris
 *
 * Tests assert what those pages specify, not what the code currently does, so a
 * failure here is a report of where the implementation diverges from the spec.
 */

const ROWS = 20;
const COLS = 10;

/** Guideline lock delay, in seconds. */
const LOCK_DELAY = 0.5;

type Tetromino = ReturnType<typeof createDefaultTetrominoes>[number];

function pieceNamed(name: string): Tetromino {
  const piece = createDefaultTetrominoes().find((t) => t.name === name);
  if (!piece) {
    throw new Error(`no tetromino named ${name}`);
  }
  return piece;
}

/** Renders one rotation state as ASCII rows so assertions read like the wiki figures. */
function shapeOf(piece: Tetromino, rotation: number): string[] {
  return piece.rotations[rotation].map((row) => row.map((filled) => (filled ? "X" : ".")).join(""));
}

/** A tetrion with both playfields wiped and no piece in play, for deterministic setups. */
function freshTetrion(config?: TetrionConfig): DefaultTetrion {
  const tetrion = new DefaultTetrion(config);
  tetrion.playfield = createEmptyPlayfield(ROWS, COLS);
  tetrion._collisionPlayfield = createEmptyPlayfield(ROWS, COLS);
  tetrion.currentTetromino = null;
  tetrion.currentTetrominoPosition = null;
  tetrion.currentTetrominoRotation = 0;
  tetrion._frameTime = 0;
  return tetrion;
}

/** Puts a specific piece in play, bypassing the bag. */
function place(
  tetrion: DefaultTetrion,
  piece: Tetromino,
  rotation: number,
  position: { x: number; y: number },
) {
  tetrion._clearCurrentTetrominoFromPlayfield();
  tetrion.currentTetromino = piece;
  tetrion.currentTetrominoRotation = rotation;
  tetrion.currentTetrominoPosition = position;
  tetrion._placeCurrentTetronimoOnPlayfield();
}

/**
 * Marks cells as occupied by locked blocks. Writes both playfields because locking
 * copies `playfield` over `_collisionPlayfield`, which would otherwise wipe a fixture
 * that only set the collision field.
 */
function block(tetrion: DefaultTetrion, cells: [number, number][]) {
  const filler = pieceNamed("O");
  for (const [row, col] of cells) {
    tetrion._collisionPlayfield[row][col] = filler;
    tetrion.playfield[row][col] = filler;
  }
}

/** Fills a whole row with locked blocks except the given columns. */
function fillRowExcept(tetrion: DefaultTetrion, row: number, gaps: number[]) {
  const cells: [number, number][] = [];
  for (let col = 0; col < COLS; col++) {
    if (!gaps.includes(col)) {
      cells.push([row, col]);
    }
  }
  block(tetrion, cells);
}

/** Columns holding a locked block in one row. */
function filledColumns(tetrion: DefaultTetrion, row: number): number[] {
  return tetrion._collisionPlayfield[row].flatMap((cell, col) => (cell ? [col] : []));
}

/** Indices of every row holding at least one locked block. */
function occupiedRows(tetrion: DefaultTetrion): number[] {
  return tetrion._collisionPlayfield.flatMap((row, index) =>
    row.some((cell) => cell) ? [index] : [],
  );
}

/**
 * Drops the piece one row at a time until it locks, waiting out the lock delay if
 * the piece lands without locking. Works whether or not lock delay is implemented.
 */
function dropUntilLocked(tetrion: DefaultTetrion) {
  for (let guard = 0; guard < ROWS + 4 && tetrion.currentTetromino; guard++) {
    const before = tetrion.currentTetrominoPosition?.y;
    tetrion.moveTetrominoDown();
    if (tetrion.currentTetromino && tetrion.currentTetrominoPosition?.y === before) {
      tetrion.tick(LOCK_DELAY + 0.1);
      break;
    }
  }
}

/**
 * Wipes the field, then fills and completes `count` rows with one vertical I,
 * so a test can trigger a single/double/triple/tetris on demand. Repeatable:
 * each call starts from an empty field but keeps score, level and line counters.
 */
function clearLines(tetrion: DefaultTetrion, count: number) {
  tetrion.playfield = createEmptyPlayfield(ROWS, COLS);
  tetrion._collisionPlayfield = createEmptyPlayfield(ROWS, COLS);
  tetrion.currentTetromino = null;
  tetrion.currentTetrominoPosition = null;

  for (let row = ROWS - count; row < ROWS; row++) {
    fillRowExcept(tetrion, row, [4]);
  }
  place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });
  dropUntilLocked(tetrion);
}

describe("tetromino definitions", () => {
  it("defines the seven one-sided tetrominoes", () => {
    const names = createDefaultTetrominoes().map((piece) => piece.name);
    expect(names.sort()).toEqual(["I", "J", "L", "O", "S", "T", "Z"]);
  });

  it("gives every piece four rotation states", () => {
    for (const piece of createDefaultTetrominoes()) {
      expect(piece.rotations).toHaveLength(4);
    }
  });

  it("spawns I flat in the second row of its 4x4 box", () => {
    expect(shapeOf(pieceNamed("I"), 0)).toEqual(["....", "XXXX", "....", "...."]);
  });

  it("spawns T pointing up", () => {
    expect(shapeOf(pieceNamed("T"), 0)).toEqual([".X.", "XXX", "..."]);
  });

  it("spawns S with the step to the right", () => {
    expect(shapeOf(pieceNamed("S"), 0)).toEqual([".XX", "XX.", "..."]);
  });

  it("spawns Z with the step to the left", () => {
    expect(shapeOf(pieceNamed("Z"), 0)).toEqual(["XX.", ".XX", "..."]);
  });

  // SRS: J is blue with the nub over its left end.
  it("spawns J as a blue piece with the nub on the left", () => {
    expect(pieceNamed("J").color).toBe("blue");
    expect(shapeOf(pieceNamed("J"), 0)).toEqual(["X..", "XXX", "..."]);
  });

  // SRS: L is orange with the nub over its right end.
  it("spawns L as an orange piece with the nub on the right", () => {
    expect(pieceNamed("L").color).toBe("orange");
    expect(shapeOf(pieceNamed("L"), 0)).toEqual(["..X", "XXX", "..."]);
  });

  it("rotates T clockwise through the four SRS states", () => {
    const t = pieceNamed("T");
    expect(shapeOf(t, 1)).toEqual([".X.", ".XX", ".X."]);
    expect(shapeOf(t, 2)).toEqual(["...", "XXX", ".X."]);
    expect(shapeOf(t, 3)).toEqual([".X.", "XX.", ".X."]);
  });

  it("rotates I clockwise through the four SRS states", () => {
    const i = pieceNamed("I");
    expect(shapeOf(i, 1)).toEqual(["..X.", "..X.", "..X.", "..X."]);
    expect(shapeOf(i, 2)).toEqual(["....", "....", "XXXX", "...."]);
    expect(shapeOf(i, 3)).toEqual([".X..", ".X..", ".X..", ".X.."]);
  });

  it("leaves O unchanged in every rotation", () => {
    const o = pieceNamed("O");
    for (const rotation of [1, 2, 3]) {
      expect(shapeOf(o, rotation)).toEqual(shapeOf(o, 0));
    }
  });

  it("gives O exactly four cells in a 2x2 block", () => {
    const rows = shapeOf(pieceNamed("O"), 0);
    const filled = rows.flatMap((row, y) =>
      [...row].flatMap((cell, x) => (cell === "X" ? [[y, x]] : [])),
    );
    expect(filled).toHaveLength(4);
    const ys = filled.map(([y]) => y);
    const xs = filled.map(([, x]) => x);
    expect(Math.max(...ys) - Math.min(...ys)).toBe(1);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(1);
  });
});

/**
 * The wiki kick tables use "positive x rightwards and positive y upwards".
 * The playfield here indexes rows top-down, so a correct implementation must
 * store these offsets with y negated.
 */
const TRANSITIONS = ["0->R", "R->0", "R->2", "2->R", "2->L", "L->2", "L->0", "0->L"];

const WIKI_JLSTZ: [number, number][][] = [
  [
    [0, 0],
    [-1, 0],
    [-1, +1],
    [0, -2],
    [-1, -2],
  ], // 0->R
  [
    [0, 0],
    [+1, 0],
    [+1, -1],
    [0, +2],
    [+1, +2],
  ], // R->0
  [
    [0, 0],
    [+1, 0],
    [+1, -1],
    [0, +2],
    [+1, +2],
  ], // R->2
  [
    [0, 0],
    [-1, 0],
    [-1, +1],
    [0, -2],
    [-1, -2],
  ], // 2->R
  [
    [0, 0],
    [+1, 0],
    [+1, +1],
    [0, -2],
    [+1, -2],
  ], // 2->L
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, +2],
    [-1, +2],
  ], // L->2
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, +2],
    [-1, +2],
  ], // L->0
  [
    [0, 0],
    [+1, 0],
    [+1, +1],
    [0, -2],
    [+1, -2],
  ], // 0->L
];

const WIKI_I: [number, number][][] = [
  [
    [0, 0],
    [-2, 0],
    [+1, 0],
    [-2, -1],
    [+1, +2],
  ], // 0->R
  [
    [0, 0],
    [+2, 0],
    [-1, 0],
    [+2, +1],
    [-1, -2],
  ], // R->0
  [
    [0, 0],
    [-1, 0],
    [+2, 0],
    [-1, +2],
    [+2, -1],
  ], // R->2
  [
    [0, 0],
    [+1, 0],
    [-2, 0],
    [+1, -2],
    [-2, +1],
  ], // 2->R
  [
    [0, 0],
    [+2, 0],
    [-1, 0],
    [+2, +1],
    [-1, -2],
  ], // 2->L
  [
    [0, 0],
    [-2, 0],
    [+1, 0],
    [-2, -1],
    [+1, +2],
  ], // L->2
  [
    [0, 0],
    [+1, 0],
    [-2, 0],
    [+1, -2],
    [-2, +1],
  ], // L->0
  [
    [0, 0],
    [-1, 0],
    [+2, 0],
    [-1, +2],
    [+2, -1],
  ], // 0->L
];

/** Labels each transition's offsets so a failure names the transition it came from. */
function labelled(table: { x: number; y: number }[][], axis: "x" | "y") {
  return Object.fromEntries(
    table.map((tests, index) => [TRANSITIONS[index], tests.map((test) => test[axis])]),
  );
}

/** Converts wiki (y-up) offsets into the y-down form a row-indexed playfield needs. */
function toRowDown(table: [number, number][][]) {
  return table.map((tests) => tests.map(([x, y]) => ({ x, y: -y || 0 })));
}

describe("wall kick tables", () => {
  it("shares one table across J, L, S, T and Z", () => {
    const reference = pieceNamed("T").wallkicks;
    for (const name of ["J", "L", "S", "Z"]) {
      expect(pieceNamed(name).wallkicks).toEqual(reference);
    }
  });

  it("gives every piece five tests for each of the eight transitions", () => {
    for (const name of ["I", "J", "L", "S", "T", "Z"]) {
      const table = pieceNamed(name).wallkicks;
      expect(table).toHaveLength(8);
      for (const tests of table) {
        expect(tests).toHaveLength(5);
      }
    }
  });

  it("matches the wiki horizontal offsets for J, L, S, T and Z", () => {
    expect(labelled(pieceNamed("T").wallkicks, "x")).toEqual(labelled(toRowDown(WIKI_JLSTZ), "x"));
  });

  // The wiki table is y-up; rows here run top-down, so stored y must be negated.
  it("stores the J, L, S, T and Z vertical offsets measured downward", () => {
    expect(labelled(pieceNamed("T").wallkicks, "y")).toEqual(labelled(toRowDown(WIKI_JLSTZ), "y"));
  });

  it("matches the wiki horizontal offsets for I", () => {
    expect(labelled(pieceNamed("I").wallkicks, "x")).toEqual(labelled(toRowDown(WIKI_I), "x"));
  });

  // Same sign problem as above, on the separate I table.
  it("stores the I vertical offsets measured downward", () => {
    expect(labelled(pieceNamed("I").wallkicks, "y")).toEqual(labelled(toRowDown(WIKI_I), "y"));
  });

  it("never kicks O", () => {
    expect(pieceNamed("O").wallkicks).toEqual(Array(8).fill([{ x: 0, y: 0 }]));
  });
});

describe("wall kicks in play", () => {
  // Control: R->2 test 2 is (+1,0), purely horizontal, so it is unaffected by
  // the y convention. Proves the kick loop runs at all.
  it("kicks a T off the left wall when rotating R->2", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 1, { x: -1, y: 5 });

    tetrion.rotateTetrominoRight();

    expect(tetrion.currentTetrominoRotation).toBe(2);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 0, y: 5 });
  });

  // R->2 test 4 is (0,+2): two cells UP, i.e. two rows lower in index terms.
  // Tests 1-3 are blocked here, so a correct kick lands the T two rows above.
  it("floor-kicks a T two rows up when rotating R->2", () => {
    const tetrion = freshTetrion();
    block(tetrion, [
      [11, 4], // blocks test 1 (0,0)
      [12, 6], // blocks test 2 (+1,0) and test 3 (+1,down 1)
    ]);
    place(tetrion, pieceNamed("T"), 1, { x: 4, y: 10 });

    tetrion.rotateTetrominoRight();

    expect(tetrion.currentTetrominoRotation).toBe(2);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 8 });
  });

  // I table R->2 test 4 is (-1,+2): one left, two up.
  it("floor-kicks an I one left and two rows up when rotating R->2", () => {
    const tetrion = freshTetrion();
    block(tetrion, [
      [10, 3], // blocks tests 1 (0,0) and 2 (-1,0)
      [10, 7], // blocks test 3 (+2,0)
    ]);
    place(tetrion, pieceNamed("I"), 1, { x: 3, y: 8 });

    tetrion.rotateTetrominoRight();

    expect(tetrion.currentTetrominoRotation).toBe(2);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 2, y: 6 });
  });

  it("refuses the rotation when all five tests collide", () => {
    const tetrion = freshTetrion();
    const occupied = new Set(["5,5", "6,4", "6,5", "6,6"]);
    const cells: [number, number][] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!occupied.has(`${row},${col}`)) {
          cells.push([row, col]);
        }
      }
    }
    block(tetrion, cells);
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 5 });

    tetrion.rotateTetrominoRight();
    expect(tetrion.currentTetrominoRotation).toBe(0);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 5 });

    tetrion.rotateTetrominoLeft();
    expect(tetrion.currentTetrominoRotation).toBe(0);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 5 });
  });
});

describe("7-bag random generator", () => {
  /** Spawns `count` pieces on an empty field and records the order they arrive in. */
  function deal(count: number): string[] {
    const tetrion = new DefaultTetrion();
    const names = [tetrion.currentTetromino!.name];
    for (let i = 1; i < count; i++) {
      tetrion.spawnTetromino();
      names.push(tetrion.currentTetromino!.name);
    }
    return names;
  }

  it("deals each bag of seven as a permutation of all seven pieces", () => {
    const names = deal(70);
    for (let start = 0; start < names.length; start += 7) {
      const bag = names.slice(start, start + 7);
      expect(bag.slice().sort()).toEqual(["I", "J", "L", "O", "S", "T", "Z"]);
    }
  });

  it("never repeats a piece within a bag", () => {
    const names = deal(70);
    for (let start = 0; start < names.length; start += 7) {
      const bag = names.slice(start, start + 7);
      expect(new Set(bag).size).toBe(7);
    }
  });

  it("never leaves more than twelve pieces between two of a kind", () => {
    const names = deal(140);
    const lastSeen = new Map<string, number>();
    for (const [index, name] of names.entries()) {
      const previous = lastSeen.get(name);
      if (previous !== undefined) {
        expect(index - previous - 1).toBeLessThanOrEqual(12);
      }
      lastSeen.set(name, index);
    }
  });

  it("fills a bag with all seven pieces without mutating the source", () => {
    const tetrominoes = createDefaultTetrominoes();
    const bag = createDefaultBag(tetrominoes);

    expect(bag.map((piece) => piece.name).sort()).toEqual(["I", "J", "L", "O", "S", "T", "Z"]);
    expect(tetrominoes.map((piece) => piece.name)).toEqual(["I", "J", "L", "O", "S", "T", "Z"]);
  });

  it("draws from the end of the bag and keeps one piece in reserve", () => {
    const tetrion = new DefaultTetrion();
    tetrion._bag = [pieceNamed("I"), pieceNamed("T")];
    tetrion.nextTetromino = null;

    tetrion.spawnTetromino();

    expect(tetrion.currentTetromino!.name).toBe("T");
    expect(tetrion.nextTetromino!.name).toBe("I");
    expect(tetrion._bag).toHaveLength(0);
  });

  it("refills the bag once it runs out", () => {
    const tetrion = new DefaultTetrion();
    tetrion._bag = [];
    tetrion.nextTetromino = null;

    tetrion.spawnTetromino();

    expect(tetrion.currentTetromino).not.toBeNull();
    expect(tetrion._bag.length).toBeGreaterThan(0);
  });
});

describe("movement and collision", () => {
  it("moves a piece left and right across open field", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 5 });

    tetrion.moveTetrominoLeft();
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 3, y: 5 });

    tetrion.moveTetrominoRight();
    tetrion.moveTetrominoRight();
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 5, y: 5 });
  });

  it("stops at the left wall", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 0, y: 5 });

    tetrion.moveTetrominoLeft();

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 0, y: 5 });
  });

  it("stops at the right wall", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 7, y: 5 });

    tetrion.moveTetrominoRight();

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 7, y: 5 });
  });

  it("stops against a locked block", () => {
    const tetrion = freshTetrion();
    block(tetrion, [[6, 3]]);
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 5 });

    tetrion.moveTetrominoLeft();

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 5 });
  });

  it("drops a piece one row at a time", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 5 });

    tetrion.moveTetrominoDown();

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 6 });
  });

  it("locks the piece into the field once the lock delay expires", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 18 });

    tetrion.moveTetrominoDown();
    expect(tetrion.currentTetromino).not.toBeNull();
    expect(tetrion._collisionPlayfield[18][5]).toBeNull();
    expect(tetrion._collisionPlayfield[19][4]).toBeNull();
    expect(tetrion._collisionPlayfield[19][5]).toBeNull();
    expect(tetrion._collisionPlayfield[19][6]).toBeNull();

    tetrion.tick(LOCK_DELAY + 0.1);

    expect(tetrion._collisionPlayfield[18][5]).not.toBeNull();
    expect(tetrion._collisionPlayfield[19][4]).not.toBeNull();
    expect(tetrion._collisionPlayfield[19][5]).not.toBeNull();
    expect(tetrion._collisionPlayfield[19][6]).not.toBeNull();
  });

  it("lands a later piece on top of a locked one", () => {
    const tetrion = freshTetrion();
    block(tetrion, [
      [19, 4],
      [19, 5],
      [19, 6],
    ]);
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 16 });

    tetrion.moveTetrominoDown();
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 17 });

    tetrion.moveTetrominoDown();
    expect(tetrion.currentTetromino).not.toBeNull();

    tetrion.tick(LOCK_DELAY + 0.1);
    expect(tetrion._collisionPlayfield[18][4]).not.toBeNull();
  });
});

describe("gravity and tick", () => {
  it("holds the piece until a full gravity interval has elapsed", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(0.5);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 2 });

    tetrion.tick(0.6);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 3 });
  });

  it("applies several rows when a single tick spans several intervals", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(3.2);

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 5 });
  });

  /**
   * Measured at level 10 on purpose: at level 1 the current 4x-of-0.2s and the
   * guideline 20x-of-1.0s both come to 0.05s per row, so only a higher level
   * separates them. Level 10 gravity is ~0.0642s, so soft drop is ~0.0032s.
   */
  it("drops at twenty times the level's gravity while soft drop is held", () => {
    const tetrion = freshTetrion({ level: 10 });
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.activateSoftDrop();
    tetrion.tick(0.02);

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 8 });
  });

  it("awards one point per cell soft dropped", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.activateSoftDrop();
    tetrion.tick(0.25); // five rows at 0.05s each

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 7 });
    expect(tetrion.score).toBe(5);
  });

  it("returns to normal gravity when soft drop is released", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.activateSoftDrop();
    tetrion.deactivateSoftDrop();
    tetrion.tick(0.05);

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 2 });
  });

  it("spawns a new piece on the tick after one locks", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 18 });
    tetrion.nextTetromino = pieceNamed("I");

    tetrion.moveTetrominoDown();
    tetrion.tick(0.5);
    expect(tetrion.currentTetromino).toBeNull();

    tetrion.tick(0.2);
    expect(tetrion.currentTetromino).not.toBeNull();
  });
});

describe("game over", () => {
  /** Fills the top four rows so no piece can spawn. */
  function blockSpawnArea(tetrion: DefaultTetrion) {
    const cells: [number, number][] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < COLS; col++) {
        cells.push([row, col]);
      }
    }
    block(tetrion, cells);
  }

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports game over when a piece cannot spawn", () => {
    const tetrion = freshTetrion();
    blockSpawnArea(tetrion);

    tetrion.spawnTetromino();

    expect(tetrion.isGameOver).toBe(true);
  });

  it("leaves no piece in play after a blocked spawn", () => {
    const tetrion = freshTetrion();
    blockSpawnArea(tetrion);

    tetrion.spawnTetromino();

    expect(tetrion.currentTetromino).toBeNull();
  });

  it("does not keep placing pieces once the field is topped out", () => {
    const tetrion = freshTetrion();
    blockSpawnArea(tetrion);

    tetrion.spawnTetromino();
    tetrion.tick(1);

    expect(tetrion.currentTetromino).toBeNull();
  });
});

/**
 * Line clearing — https://tetris.wiki/Gameplay_of_Tetris
 *
 * Not implemented: rows are never checked or removed when a piece locks, so every
 * test in this block fails until clearing lands.
 */
describe("line clearing", () => {
  it("clears a completed row when the piece locks", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 19, [4]);
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([17, 18, 19]);
    expect(filledColumns(tetrion, 19)).toEqual([4]);
  });

  it("shifts the rows above a cleared row down by one", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 19, [4]);
    block(tetrion, [[15, 0]]);
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(filledColumns(tetrion, 16)).toEqual([0]);
    expect(filledColumns(tetrion, 15)).toEqual([]);
  });

  it("leaves a row with any gap untouched", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 19, [4, 7]);
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([16, 17, 18, 19]);
    expect(filledColumns(tetrion, 19)).toHaveLength(9);
  });

  it("clears two completed rows at once", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 18, [4]);
    fillRowExcept(tetrion, 19, [4]);
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([18, 19]);
    expect(filledColumns(tetrion, 18)).toEqual([4]);
    expect(filledColumns(tetrion, 19)).toEqual([4]);
  });

  it("clears four rows at once", () => {
    const tetrion = freshTetrion();
    for (const row of [16, 17, 18, 19]) {
      fillRowExcept(tetrion, row, [4]);
    }
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([]);
  });

  it("clears non-adjacent completed rows and closes both gaps", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 17, [4]);
    fillRowExcept(tetrion, 19, [4]);
    block(tetrion, [[18, 0]]);
    place(tetrion, pieceNamed("I"), 1, { x: 2, y: 16 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([18, 19]);
    expect(filledColumns(tetrion, 18)).toEqual([4]);
    expect(filledColumns(tetrion, 19)).toEqual([0, 4]);
  });

  it("empties the field when its only occupied row is cleared", () => {
    const tetrion = freshTetrion();
    fillRowExcept(tetrion, 19, [3, 4, 5, 6]);
    place(tetrion, pieceNamed("I"), 0, { x: 3, y: 18 });

    dropUntilLocked(tetrion);

    expect(occupiedRows(tetrion)).toEqual([]);
  });
});

/**
 * Scoring and levels — https://tetris.wiki/Gameplay_of_Tetris
 *
 * Not implemented: `score`, `level` and `linesCleared` exist as fields but nothing
 * ever writes to them, and gravity is a fixed interval that ignores the level.
 */
describe("scoring and levels", () => {
  it("starts at level one with nothing scored", () => {
    const tetrion = freshTetrion();

    expect(tetrion.score).toBe(0);
    expect(tetrion.level).toBe(1);
    expect(tetrion.linesCleared).toBe(0);
  });

  it("awards 100 for a single", () => {
    const tetrion = freshTetrion();
    clearLines(tetrion, 1);
    expect(tetrion.score).toBe(100);
  });

  it("awards 300 for a double", () => {
    const tetrion = freshTetrion();
    clearLines(tetrion, 2);
    expect(tetrion.score).toBe(300);
  });

  it("awards 500 for a triple", () => {
    const tetrion = freshTetrion();
    clearLines(tetrion, 3);
    expect(tetrion.score).toBe(500);
  });

  it("awards 800 for a tetris", () => {
    const tetrion = freshTetrion();
    clearLines(tetrion, 4);
    expect(tetrion.score).toBe(800);
  });

  it("multiplies the clear value by the current level", () => {
    const tetrion = freshTetrion({ level: 3 });

    clearLines(tetrion, 1);

    expect(tetrion.score).toBe(300);
  });

  it("accumulates score across successive clears", () => {
    const tetrion = freshTetrion();

    clearLines(tetrion, 1);
    clearLines(tetrion, 2);

    expect(tetrion.score).toBe(400);
  });

  it("counts the lines it has cleared", () => {
    const tetrion = freshTetrion();

    clearLines(tetrion, 4);
    clearLines(tetrion, 3);

    expect(tetrion.linesCleared).toBe(7);
  });

  it("advances a level every ten lines", () => {
    const tetrion = freshTetrion();

    clearLines(tetrion, 4);
    clearLines(tetrion, 4);
    expect(tetrion.level).toBe(1);

    clearLines(tetrion, 2);
    expect(tetrion.level).toBe(2);
  });

  // Guideline gravity: (0.8 - (level - 1) * 0.007) ^ (level - 1) seconds per row.
  it("falls one row per second at level one", () => {
    const tetrion = freshTetrion({ level: 1 });
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(0.9);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 2 });

    tetrion.tick(0.2);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 3 });
  });

  it("shortens the gravity interval as the level rises", () => {
    const tetrion = freshTetrion();
    tetrion.level = 10; // (0.8 - 9 * 0.007) ^ 9, about 0.064s per row
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(0.05);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 2 });

    tetrion.tick(0.03);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 3 });
  });
});

/**
 * Lock delay — https://tetris.wiki/Gameplay_of_Tetris
 *
 * Not implemented: `moveTetrominoDown` locks the instant a piece cannot descend,
 * so there is no slide window and no reset budget.
 */
describe("lock delay", () => {
  /**
   * Lands a piece flat on the floor and returns it, so a test can assert the very
   * same piece is still in play — a respawn after an early lock would also leave
   * `currentTetromino` non-null, which would otherwise pass by accident.
   */
  function land(tetrion: DefaultTetrion, name: string): Tetromino {
    const piece = pieceNamed(name);
    place(tetrion, piece, 0, { x: 4, y: 18 });
    tetrion.moveTetrominoDown();
    return piece;
  }

  it("does not lock the piece on the tick it lands", () => {
    const tetrion = freshTetrion();

    const piece = land(tetrion, "T");

    expect(tetrion.currentTetromino).toBe(piece);
  });

  it("keeps the piece in play for the first half second", () => {
    const tetrion = freshTetrion();
    const piece = land(tetrion, "T");

    tetrion.tick(LOCK_DELAY - 0.1);

    expect(tetrion.currentTetromino).toBe(piece);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 18 });
  });

  it("locks the piece once the delay expires", () => {
    const tetrion = freshTetrion();
    land(tetrion, "T");

    tetrion.tick(LOCK_DELAY + 0.1);

    expect(tetrion.currentTetromino).toBeNull();
  });

  it("restarts the delay when the piece moves sideways", () => {
    const tetrion = freshTetrion();
    const piece = land(tetrion, "T");

    tetrion.tick(LOCK_DELAY - 0.1);
    tetrion.moveTetrominoLeft();
    tetrion.tick(LOCK_DELAY - 0.1);

    expect(tetrion.currentTetromino).toBe(piece);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 3, y: 18 });
  });

  it("restarts the delay when the piece rotates", () => {
    const tetrion = freshTetrion();
    const piece = land(tetrion, "O"); // rotates in place, so it stays on the floor

    tetrion.tick(LOCK_DELAY - 0.1);
    tetrion.rotateTetrominoRight();
    tetrion.tick(LOCK_DELAY - 0.1);

    expect(tetrion.currentTetromino).toBe(piece);
  });

  it("locks regardless once the reset budget of fifteen is spent", () => {
    const tetrion = freshTetrion();
    const piece = land(tetrion, "O");

    for (let reset = 0; reset < 15; reset++) {
      tetrion.tick(LOCK_DELAY - 0.1);
      tetrion.rotateTetrominoRight();
    }
    expect(tetrion.currentTetromino).toBe(piece);

    tetrion.rotateTetrominoRight();
    tetrion.tick(LOCK_DELAY + 0.1);

    expect(tetrion.currentTetromino).toBeNull();
  });
});

/**
 * Hard drop, hold and ghost piece — https://tetris.wiki/Gameplay_of_Tetris
 *
 * Not implemented: none of these exist on the tetrion at all. The interface below
 * declares the API they will need, so these tests fail with "not a function"
 * rather than failing to compile. `tetrion.ts` is untouched.
 */
interface PlannedTetrion {
  hardDrop(): void;
  hold(): void;
  heldTetromino: Tetromino | null;
  ghostPosition: { x: number; y: number } | null;
}

function plannedTetrion(): DefaultTetrion & PlannedTetrion {
  return freshTetrion() as unknown as DefaultTetrion & PlannedTetrion;
}

describe("hard drop", () => {
  it("drops the piece to the landing row", () => {
    const tetrion = plannedTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.hardDrop();

    expect(filledColumns(tetrion, 18)).toEqual([5]);
    expect(filledColumns(tetrion, 19)).toEqual([4, 5, 6]);
  });

  it("locks the piece immediately, without the lock delay", () => {
    const tetrion = plannedTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.hardDrop();

    expect(tetrion.currentTetromino).toBeNull();
  });

  it("awards two points per cell travelled", () => {
    const tetrion = plannedTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.hardDrop(); // rows 2 to 18 is sixteen cells

    expect(tetrion.score).toBe(32);
  });
});

describe("hold", () => {
  it("stashes the current piece and brings in the next", () => {
    const tetrion = plannedTetrion();
    const held = pieceNamed("T");
    const next = pieceNamed("I");
    place(tetrion, held, 0, { x: 4, y: 2 });
    tetrion.nextTetromino = next;

    tetrion.hold();

    expect(tetrion.heldTetromino).toBe(held);
    expect(tetrion.currentTetromino).toBe(next);
  });

  it("swaps the held and current pieces on a later hold", () => {
    const tetrion = plannedTetrion();
    const first = pieceNamed("T");
    place(tetrion, first, 0, { x: 4, y: 2 });
    tetrion.nextTetromino = pieceNamed("I");

    tetrion.hold();
    tetrion.spawnTetromino(); // a new piece clears the once-per-piece lock
    const second = tetrion.currentTetromino;

    tetrion.hold();

    expect(tetrion.heldTetromino).toBe(second);
    expect(tetrion.currentTetromino).toBe(first);
  });

  it("refuses a second hold for the same piece", () => {
    const tetrion = plannedTetrion();
    const held = pieceNamed("T");
    const next = pieceNamed("I");
    place(tetrion, held, 0, { x: 4, y: 2 });
    tetrion.nextTetromino = next;

    tetrion.hold();
    tetrion.hold();

    expect(tetrion.heldTetromino).toBe(held);
    expect(tetrion.currentTetromino).toBe(next);
  });

  it("returns a held piece at its spawn rotation", () => {
    const tetrion = plannedTetrion();
    const held = pieceNamed("T");
    place(tetrion, held, 1, { x: 4, y: 5 });
    tetrion.nextTetromino = pieceNamed("I");

    tetrion.hold();
    tetrion.spawnTetromino();
    tetrion.hold();

    expect(tetrion.currentTetromino).toBe(held);
    expect(tetrion.currentTetrominoRotation).toBe(0);
  });
});

describe("ghost piece", () => {
  it("sits at the row the piece would land on", () => {
    const tetrion = plannedTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    expect(tetrion.ghostPosition).toEqual({ x: 4, y: 18 });
  });

  it("follows the piece sideways", () => {
    const tetrion = plannedTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.moveTetrominoLeft();

    expect(tetrion.ghostPosition).toEqual({ x: 3, y: 18 });
  });

  it("agrees with where a hard drop lands", () => {
    const tetrion = plannedTetrion();
    block(tetrion, [
      [19, 4],
      [19, 5],
      [19, 6],
    ]);
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    expect(tetrion.ghostPosition).toEqual({ x: 4, y: 17 });

    tetrion.hardDrop();

    expect(filledColumns(tetrion, 17)).toEqual([5]);
    expect(filledColumns(tetrion, 18)).toEqual([4, 5, 6]);
  });
});

/**
 * Spawn placement — https://tetris.wiki/Super_Rotation_System
 */
describe("spawn placement", () => {
  /** Spawns one named piece and reports the columns it covers. */
  function spawnColumns(name: string): number[] {
    const tetrion = freshTetrion();
    const piece = pieceNamed(name);
    tetrion.nextTetromino = piece;
    tetrion.spawnTetromino();

    const { x } = tetrion.currentTetrominoPosition!;
    const shape = piece.rotations[tetrion.currentTetrominoRotation];
    const columns = new Set<number>();
    shape.forEach((row) =>
      row.forEach((filled, column) => {
        if (filled) {
          columns.add(x + column);
        }
      }),
    );
    return [...columns].sort((a, b) => a - b);
  }

  it("spawns the three-wide pieces over the middle columns", () => {
    for (const name of ["J", "L", "S", "T", "Z"]) {
      expect(spawnColumns(name)).toEqual([3, 4, 5]);
    }
  });

  it("spawns I across the four middle columns", () => {
    expect(spawnColumns("I")).toEqual([3, 4, 5, 6]);
  });

  it("spawns O over the two middle columns", () => {
    expect(spawnColumns("O")).toEqual([4, 5]);
  });

  it("spawns pieces above the visible field", () => {
    const tetrion = freshTetrion();
    const piece = pieceNamed("T");
    tetrion.nextTetromino = piece;
    tetrion.spawnTetromino();

    const { y } = tetrion.currentTetrominoPosition!;
    const shape = piece.rotations[tetrion.currentTetrominoRotation];
    const lowestFilledRow = Math.max(
      ...shape.flatMap((row, index) => (row.some((cell) => cell) ? [index] : [])),
    );

    expect(y + lowestFilledRow).toBeLessThan(1);
  });
});
