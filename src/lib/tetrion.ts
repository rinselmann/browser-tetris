import { shuffle } from "lodash";

interface TetrominoDefinition {
  name: string;
  color: string;
  rotations: boolean[][][];
}

export interface ITetrion {
  playfield: (TetrominoDefinition | null)[][];
  spawnTetromino(): void;
  rotateTetrominoLeft(): void;
  rotateTetrominoRight(): void;
  moveTetrominoDown(): void;
  moveTetrominoLeft(): void;
  moveTetrominoRight(): void;
  activateSoftDrop(): void;
  deactivateSoftDrop(): void;
  tick(dt: number): void;
}

export function createEmptyPlayfield(rows: number, cols: number): (TetrominoDefinition | null)[][] {
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
    },
    {
      name: "L",
      color: "orange",
      rotations: createRotations([
        [true, false, false],
        [true, true, true],
        [false, false, false],
      ]),
    },
    {
      name: "J",
      color: "blue",
      rotations: createRotations([
        [false, false, true],
        [true, true, true],
        [false, false, false],
      ]),
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
    },
    {
      name: "S",
      color: "green",
      rotations: createRotations([
        [false, true, true],
        [true, true, false],
        [false, false, false],
      ]),
    },
    {
      name: "T",
      color: "purple",
      rotations: createRotations([
        [false, true, false],
        [true, true, true],
        [false, false, false],
      ]),
    },
    {
      name: "Z",
      color: "red",
      rotations: createRotations([
        [true, true, false],
        [false, true, true],
        [false, false, false],
      ]),
    },
  ];
}

export function createDefaultBag(tetrominoes: TetrominoDefinition[]): TetrominoDefinition[] {
  return shuffle(tetrominoes);
}

export class DefaultTetrion implements ITetrion {
  playfield: (TetrominoDefinition | null)[][];

  _tetrominoes: TetrominoDefinition[];
  _bag: TetrominoDefinition[];
  _frameCounter: number;
  _frameTime: number;
  _nextFrameTime: number;
  _totalTime: number;
  _collisionPlayfield: (TetrominoDefinition | null)[][];
  _gravityMultiplier: number;

  currentTetromino: TetrominoDefinition | null;
  currentTetrominoPosition: { x: number; y: number } | null;
  currentTetrominoRotation: number;
  nextTetromino: TetrominoDefinition | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;

  constructor() {
    this._tetrominoes = createDefaultTetrominoes();
    this._bag = createDefaultBag(this._tetrominoes);
    this._frameCounter = 0;
    this._frameTime = 0;
    this._nextFrameTime = 0.2; // 1 second per frame
    this._totalTime = 0;
    this._gravityMultiplier = 1.0;

    this.playfield = createEmptyPlayfield(20, 10);
    this._collisionPlayfield = createEmptyPlayfield(20, 10);
    this.currentTetromino = null;
    this.currentTetrominoPosition = null;
    this.currentTetrominoRotation = 0;
    this.nextTetromino = null;
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isGameOver = false;

    this.spawnTetromino();
  }

  tick(dt: number) {
    this._totalTime += dt;
    this._frameTime += dt;
    while (this._frameTime >= this._nextFrameTime * this._gravityMultiplier) {
      this._advanceFrame();
    }
  }

  rotateTetrominoLeft() {
    this._updateCurrentTetronimo(
      this.currentTetromino,
      (this.currentTetrominoRotation + 3) % 4,
      this.currentTetrominoPosition,
    );
  }

  rotateTetrominoRight() {
    this._updateCurrentTetronimo(
      this.currentTetromino,
      (this.currentTetrominoRotation + 1) % 4,
      this.currentTetrominoPosition,
    );
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

      if (!moved) {
        this._lockCurrentTetronimo();
      }
    }
  }

  activateSoftDrop() {
    this._gravityMultiplier = 0.25;
  }

  deactivateSoftDrop() {
    this._gravityMultiplier = 1.0;
  }

  _lockCurrentTetronimo() {
    this.currentTetromino = null;
    this.currentTetrominoPosition = null;
    this.currentTetrominoRotation = 0;
    for (let row = 0; row < this.playfield.length; row++) {
      for (let col = 0; col < this.playfield[row].length; col++) {
        this._collisionPlayfield[row][col] = this.playfield[row][col];
      }
    }
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
            playfieldCol >= playfield[playfieldRow].length;
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
    this._frameTime -= this._nextFrameTime * this._gravityMultiplier;

    // Move the current tetromino down by one row
    if (this.currentTetromino && this.currentTetrominoPosition) {
      this.moveTetrominoDown();

      // Here you would typically check for collisions and lock the tetromino if it can't move down
    } else {
      // If there's no current tetromino, spawn a new one
      this.spawnTetromino();
    }
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

  spawnTetromino() {
    if (this._bag.length === 0) {
      this._resetBag();
    }

    if (!this.nextTetromino) {
      this.nextTetromino = this._bag.pop()!;
    }

    const tetronimo = this.nextTetromino;
    const rotation = 0;
    const position = { x: 4, y: 0 };
    if (!this._testTetronimoUpdate(tetronimo, rotation, position)) {
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
