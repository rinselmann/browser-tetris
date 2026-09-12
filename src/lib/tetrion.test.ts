import {
  DefaultTetrion,
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
function freshTetrion(): DefaultTetrion {
  const tetrion = new DefaultTetrion();
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

/** Marks cells as occupied by locked blocks. */
function block(tetrion: DefaultTetrion, cells: [number, number][]) {
  const filler = pieceNamed("O");
  for (const [row, col] of cells) {
    tetrion._collisionPlayfield[row][col] = filler;
  }
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

  it("locks the piece into the field when it cannot fall further", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 18 });

    tetrion.moveTetrominoDown();

    expect(tetrion.currentTetromino).toBeNull();
    expect(tetrion.currentTetrominoPosition).toBeNull();
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
    expect(tetrion.currentTetromino).toBeNull();
    expect(tetrion._collisionPlayfield[18][4]).not.toBeNull();
  });
});

describe("gravity and tick", () => {
  it("holds the piece until a full gravity interval has elapsed", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(0.1);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 2 });

    tetrion.tick(0.1);
    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 3 });
  });

  it("applies several rows when a single tick spans several intervals", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.tick(0.65);

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 5 });
  });

  it("falls faster while soft drop is held", () => {
    const tetrion = freshTetrion();
    place(tetrion, pieceNamed("T"), 0, { x: 4, y: 2 });

    tetrion.activateSoftDrop();
    tetrion.tick(0.05);

    expect(tetrion.currentTetrominoPosition).toEqual({ x: 4, y: 3 });
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

    tetrion.tick(0.2);
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
