import { every, fill, isNil, shuffle, some } from "lodash";

interface TetrominoDefinition {
  name: string;
  color: string;
  rotations: boolean[][][];
  wallkicks: { x: number; y: number }[][];
}

export type Playfield = (TetrominoDefinition | null)[][];

export interface ITetrion {
  playfield: Playfield;
  spawnTetromino(): void;
  rotateTetrominoLeft(): void;
  rotateTetrominoRight(): void;
  moveTetrominoDown(): void;
  moveTetrominoLeft(): void;
  moveTetrominoRight(): void;
  activateSoftDrop(): void;
  deactivateSoftDrop(): void;
  tick(dt: number): void;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
}

export function createEmptyPlayfield(rows: number, cols: number): Playfield {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

export function createDefaultTetrominoes(): TetrominoDefinition[] {
  function rotate(matrix: boolean[][]): boolean[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(false));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j];
      }
    }
    return rotated;
  }

  function createRotations(shape: boolean[][]): boolean[][][] {
    const rotations = [shape];
    for (let i = 1; i < 4; i++) {
      rotations.push(rotate(rotations[i - 1]));
    }
    return rotations;
  }

  function createWallkicks(name: string) {
    switch (name) {
      default:
        return [
          [
            // O->R
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: -1, y: -1 },
            { x: 0, y: +2 },
            { x: -1, y: +2 },
          ],
          [
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: +1, y: +1 },
            { x: 0, y: -2 },
            { x: +1, y: -2 },
          ],
          [
            // R->2
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: +1, y: +1 },
            { x: 0, y: -2 },
            { x: +1, y: -2 },
          ],
          [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: -1, y: -1 },
            { x: 0, y: +2 },
            { x: -1, y: +2 },
          ],
          [
            // 2->L
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: +1, y: -1 },
            { x: 0, y: +2 },
            { x: +1, y: +2 },
          ],
          [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: -1, y: +1 },
            { x: 0, y: -2 },
            { x: -1, y: -2 },
          ],
          [
            // L->0
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: -1, y: +1 },
            { x: 0, y: -2 },
            { x: -1, y: -2 },
          ],
          [
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: +1, y: -1 },
            { x: 0, y: +2 },
            { x: +1, y: +2 },
          ],
        ];
      case "I":
        return [
          [
            // 0->R
            { x: 0, y: 0 },
            { x: -2, y: 0 },
            { x: +1, y: 0 },
            { x: -2, y: +1 },
            { x: +1, y: -2 },
          ],
          [
            { x: 0, y: 0 },
            { x: +2, y: 0 },
            { x: -1, y: 0 },
            { x: +2, y: -1 },
            { x: -1, y: +2 },
          ],
          [
            // R->2
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: +2, y: 0 },
            { x: -1, y: -2 },
            { x: +2, y: +1 },
          ],
          [
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: -2, y: 0 },
            { x: +1, y: +2 },
            { x: -2, y: -1 },
          ],
          [
            // 2->L
            { x: 0, y: 0 },
            { x: +2, y: 0 },
            { x: -1, y: 0 },
            { x: +2, y: -1 },
            { x: -1, y: +2 },
          ],
          [
            { x: 0, y: 0 },
            { x: -2, y: 0 },
            { x: +1, y: 0 },
            { x: -2, y: +1 },
            { x: +1, y: -2 },
          ],
          [
            // L->0
            { x: 0, y: 0 },
            { x: +1, y: 0 },
            { x: -2, y: 0 },
            { x: +1, y: +2 },
            { x: -2, y: -1 },
          ],
          [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: +2, y: 0 },
            { x: -1, y: -2 },
            { x: +2, y: +1 },
          ],
        ];
      case "O":
        return Array(8).fill([{ x: 0, y: 0 }]);
    }
  }

  return [
    {
      name: "I",
      color: "cyan",
      rotations: createRotations([
        [false, false, false, false],
        [true, true, true, true],
        [false, false, false, false],
        [false, false, false, false],
      ]),
      wallkicks: createWallkicks("I"),
    },
    {
      name: "J",
      color: "blue",
      rotations: createRotations([
        [true, false, false],
        [true, true, true],
        [false, false, false],
      ]),
      wallkicks: createWallkicks("L"),
    },
    {
      name: "L",
      color: "orange",
      rotations: createRotations([
        [false, false, true],
        [true, true, true],
        [false, false, false],
      ]),
      wallkicks: createWallkicks("J"),
    },
    {
      name: "O",
      color: "yellow",
      rotations: Array(4).fill([
        // O tetromino has the same shape in all rotations
        [false, true, true, false],
        [false, true, true, false],
        [false, false, false, false],
      ]),
      wallkicks: createWallkicks("O"),
    },
    {
      name: "S",
      color: "green",
      rotations: createRotations([
        [false, true, true],
        [true, true, false],
        [false, false, false],
      ]),
      wallkicks: createWallkicks("S"),
    },
    {
      name: "T",
      color: "purple",
      rotations: createRotations([
        [false, true, false],
        [true, true, true],
        [false, false, false],
      ]),
      wallkicks: createWallkicks("T"),
    },
    {
      name: "Z",
      color: "red",
      rotations: createRotations([
        [true, true, false],
        [false, true, true],
        [false, false, false],
      ]),
      wallkicks: createWallkicks("Z"),
    },
  ];
}

export function createDefaultBag(tetrominoes: TetrominoDefinition[]): TetrominoDefinition[] {
  return shuffle(tetrominoes);
}

export function copyPlayfield(src: Playfield, dst: Playfield) {
  for (let row = 0; row < src.length; row++) {
    for (let col = 0; col < src[row].length; col++) {
      dst[row][col] = src[row][col];
    }
  }
}

export interface TetrionConfig {
  level?: number;
}

export class DefaultTetrion implements ITetrion {
  playfield: Playfield;

  _tetrominoes: TetrominoDefinition[];
  _bag: TetrominoDefinition[];
  _frameCounter: number;
  _frameTime: number;
  _nextFrameTime: number;
  _totalTime: number;
  _collisionPlayfield: Playfield;
  _gravityMultiplier: number;
  _lockTime: number;

  currentTetromino: TetrominoDefinition | null;
  currentTetrominoPosition: { x: number; y: number } | null;
  currentTetrominoRotation: number;
  nextTetromino: TetrominoDefinition | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;

  constructor(config?: TetrionConfig) {
    this._tetrominoes = createDefaultTetrominoes();
    this._bag = createDefaultBag(this._tetrominoes);
    this._frameCounter = 0;
    this._frameTime = 0;
    this._nextFrameTime = 0;
    this._totalTime = 0;
    this._gravityMultiplier = 1.0;
    this._lockTime = 0;

    this.playfield = createEmptyPlayfield(20, 10);
    this._collisionPlayfield = createEmptyPlayfield(20, 10);
    this.currentTetromino = null;
    this.currentTetrominoPosition = null;
    this.currentTetrominoRotation = 0;
    this.nextTetromino = null;
    this.score = 0;
    this.level = Math.max(config?.level || 1, 1);
    this.linesCleared = 0;
    this.isGameOver = false;

    this._updateLevelAndGravity();
    this.spawnTetromino();
  }

  tick(dt: number) {
    this._updateLevelAndGravity();

    this._totalTime += dt * this._gravityMultiplier;
    this._frameTime += dt * this._gravityMultiplier;
    while (this._frameTime >= this._nextFrameTime) {
      this._advanceFrame();
    }

    if (this.currentTetromino && this._lockTime && this._totalTime >= this._lockTime) {
      this._lockCurrentTetronimo();
    }
  }

  rotateTetrominoLeft() {
    if (!this.currentTetromino || !this.currentTetrominoPosition) {
      return;
    }

    const wallkicks = this.currentTetromino?.wallkicks[
      (this.currentTetrominoRotation * 2 + 7) % 8
    ] || [{ x: 0, y: 0 }];
    for (const wallkick of wallkicks) {
      const position = {
        x: this.currentTetrominoPosition.x + wallkick.x,
        y: this.currentTetrominoPosition.y + wallkick.y,
      };
      const updated = this._updateCurrentTetronimo(
        this.currentTetromino,
        (this.currentTetrominoRotation + 3) % 4,
        position,
      );
      if (updated) {
        break;
      }
    }
  }

  rotateTetrominoRight() {
    if (!this.currentTetromino || !this.currentTetrominoPosition) {
      return;
    }

    const wallkicks = this.currentTetromino?.wallkicks[this.currentTetrominoRotation * 2] || [
      { x: 0, y: 0 },
    ];
    for (const wallkick of wallkicks) {
      const position = {
        x: this.currentTetrominoPosition.x + wallkick.x,
        y: this.currentTetrominoPosition.y + wallkick.y,
      };
      const updated = this._updateCurrentTetronimo(
        this.currentTetromino,
        (this.currentTetrominoRotation + 1) % 4,
        position,
      );

      if (updated) {
        break;
      }
    }
  }

  moveTetrominoLeft() {
    if (this.currentTetrominoPosition) {
      this._updateCurrentTetronimo(this.currentTetromino, this.currentTetrominoRotation, {
        ...this.currentTetrominoPosition,
        x: this.currentTetrominoPosition.x - 1,
      });
    }
  }

  moveTetrominoRight() {
    if (this.currentTetrominoPosition) {
      this._updateCurrentTetronimo(this.currentTetromino, this.currentTetrominoRotation, {
        ...this.currentTetrominoPosition,
        x: this.currentTetrominoPosition.x + 1,
      });
    }
  }

  moveTetrominoDown(): void {
    if (this.currentTetrominoPosition) {
      const moved = this._updateCurrentTetronimo(
        this.currentTetromino,
        this.currentTetrominoRotation,
        {
          ...this.currentTetrominoPosition,
          y: this.currentTetrominoPosition.y + 1,
        },
      );

      if (moved) {
        this._lockTime = 0;
      } else if (!this._lockTime) {
        this._lockTime = this._totalTime + 0.5;
      }
    }
  }

  activateSoftDrop() {
    this._gravityMultiplier = 20.0;
  }

  deactivateSoftDrop() {
    this._gravityMultiplier = 1.0;
  }

  _lockCurrentTetronimo() {
    this._lockTime = 0;
    this.currentTetromino = null;
    this.currentTetrominoPosition = null;
    this.currentTetrominoRotation = 0;
    copyPlayfield(this.playfield, this._collisionPlayfield);
    this._clearFullRows();
    this._removeEmptyRows();
    this._updateLevelAndGravity();
  }

  _testTetronimoUpdate(
    tetromino: TetrominoDefinition,
    rotation: number,
    position: { x: number; y: number },
  ) {
    const shape = tetromino.rotations[rotation];
    const playfield = this._collisionPlayfield;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const playfieldRow = position.y + row;
          const playfieldCol = position.x + col;

          const isOutOfBounds =
            playfieldRow >= playfield.length ||
            playfieldCol < 0 ||
            playfieldCol >= playfield[playfieldRow]?.length;
          if (isOutOfBounds || (playfieldRow >= 0 && playfield[playfieldRow][playfieldCol])) {
            return false;
          }
        }
      }
    }

    return true;
  }

  _advanceFrame() {
    this._frameCounter++;
    this._frameTime -= this._nextFrameTime;

    // Move the current tetromino down by one row
    if (this.currentTetromino && this.currentTetrominoPosition) {
      this.moveTetrominoDown();

      // Here you would typically check for collisions and lock the tetromino if it can't move down
    } else {
      // If there's no current tetromino, spawn a new one
      this.spawnTetromino();
    }
  }

  _updateLevelAndGravity() {
    // Calculate level frame time based on a fixed-goal system from https://tetris.wiki/Marathon
    this.level = Math.min(Math.max(this.level, Math.floor(this.linesCleared / 10) + 1), 20);
    this._nextFrameTime = (0.8 - (this.level - 1) * 0.007) ** (this.level - 1); //
  }

  _resetBag() {
    this._bag = createDefaultBag(this._tetrominoes);
  }

  _updateCurrentTetronimo(
    tetronimo: TetrominoDefinition | null,
    rotation: number,
    position: { x: number; y: number } | null,
  ) {
    const isValid =
      !tetronimo || !position || this._testTetronimoUpdate(tetronimo, rotation, position);

    if (isValid) {
      this._clearCurrentTetrominoFromPlayfield();
      this.currentTetromino = tetronimo;
      this.currentTetrominoRotation = rotation;
      this.currentTetrominoPosition = position;
      this._placeCurrentTetronimoOnPlayfield();
    }

    return isValid;
  }

  _placeCurrentTetronimoOnPlayfield() {
    if (this.currentTetromino && this.currentTetrominoPosition) {
      this._placeTetrominoOnPlayfield(
        this.currentTetromino,
        this.currentTetrominoRotation,
        this.currentTetrominoPosition,
      );
    }
  }

  _placeTetrominoOnPlayfield(
    tetromino: TetrominoDefinition,
    rotation: number,
    position: { x: number; y: number },
  ) {
    const shape = tetromino.rotations[rotation];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const playfieldRow = position.y + row;
          const playfieldCol = position.x + col;
          if (
            playfieldRow >= 0 &&
            playfieldRow < this.playfield.length &&
            playfieldCol >= 0 &&
            playfieldCol < this.playfield[0].length
          ) {
            this.playfield[playfieldRow][playfieldCol] = tetromino;
          }
        }
      }
    }
  }

  _clearCurrentTetrominoFromPlayfield() {
    if (this.currentTetromino && this.currentTetrominoPosition) {
      this._clearTetrominoFromPlayfield(
        this.currentTetromino,
        this.currentTetrominoRotation,
        this.currentTetrominoPosition,
      );
    }
  }

  _clearTetrominoFromPlayfield(
    tetromino: TetrominoDefinition,
    rotation: number,
    position: { x: number; y: number },
  ) {
    const shape = tetromino.rotations[rotation];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const playfieldRow = position.y + row;
          const playfieldCol = position.x + col;
          if (
            playfieldRow >= 0 &&
            playfieldRow < this.playfield.length &&
            playfieldCol >= 0 &&
            playfieldCol < this.playfield[0].length
          ) {
            this.playfield[playfieldRow][playfieldCol] = null;
          }
        }
      }
    }
  }

  _clearFullRows() {
    const playfield = this._collisionPlayfield;
    for (let row = 0; row < playfield.length; row++) {
      if (every(playfield[row])) {
        this.linesCleared++;
        fill(playfield[row], null);
      }
    }

    copyPlayfield(playfield, this.playfield);
    this._placeCurrentTetronimoOnPlayfield();
  }

  _removeEmptyRows() {
    const playfield = this._collisionPlayfield;
    for (let row = playfield.length - 1; row >= 0; row--) {
      if (every(playfield[row], isNil)) {
        // Find the next non empty row and move it's contents to the current row
        for (let srcRow = row - 1; srcRow >= 0; srcRow--) {
          if (some(playfield[srcRow])) {
            for (let col = 0; col < playfield[srcRow].length; col++) {
              playfield[row][col] = playfield[srcRow][col];
              playfield[srcRow][col] = null;
            }
            break;
          }
        }
      }
    }

    copyPlayfield(playfield, this.playfield);
    this._placeCurrentTetronimoOnPlayfield();
  }

  spawnTetromino() {
    if (this._bag.length === 0) {
      this._resetBag();
    }

    if (!this.nextTetromino) {
      this.nextTetromino = this._bag.pop()!;
    }

    const tetronimo = this.nextTetromino;
    const rotation = 0;
    const position = { x: 3, y: -2 };
    if (!this._testTetronimoUpdate(tetronimo, rotation, position)) {
      this.isGameOver = true;
      console.log("Game Over");
      return;
    }

    this.currentTetromino = tetronimo;
    this.currentTetrominoPosition = position;
    this.currentTetrominoRotation = rotation;

    this._placeTetrominoOnPlayfield(
      this.currentTetromino,
      this.currentTetrominoRotation,
      this.currentTetrominoPosition,
    );

    // Refresh the bag if it's empty after spawning the current tetromino
    if (this._bag.length === 0) {
      this._resetBag();
    }

    // Grab the next tetromino from the bag
    this.nextTetromino = this._bag.pop()!;
  }
}
