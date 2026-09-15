export function TetrominoBlock({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function ITetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1.5, 0, 0]} color="cyan" />
      <TetrominoBlock position={[-0.5, 0, 0]} color="cyan" />
      <TetrominoBlock position={[0.5, 0, 0]} color="cyan" />
      <TetrominoBlock position={[1.5, 0, 0]} color="cyan" />
    </group>
  );
}

export function OTetromino() {
  return (
    <group>
      <TetrominoBlock position={[-0.5, 0.5, 0]} color="yellow" />
      <TetrominoBlock position={[0.5, 0.5, 0]} color="yellow" />
      <TetrominoBlock position={[-0.5, -0.5, 0]} color="yellow" />
      <TetrominoBlock position={[0.5, -0.5, 0]} color="yellow" />
    </group>
  );
}

export function JTetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1, 0, 0]} color="blue" />
      <TetrominoBlock position={[0, 0, 0]} color="blue" />
      <TetrominoBlock position={[1, 0, 0]} color="blue" />
      <TetrominoBlock position={[-1, -1, 0]} color="blue" />
    </group>
  );
}

export function LTetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1, 0, 0]} color="purple" />
      <TetrominoBlock position={[0, 0, 0]} color="purple" />
      <TetrominoBlock position={[1, 0, 0]} color="purple" />
      <TetrominoBlock position={[1, -1, 0]} color="purple" />
    </group>
  );
}

export function STetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1, -1, 0]} color="green" />
      <TetrominoBlock position={[0, -1, 0]} color="green" />
      <TetrominoBlock position={[0, 0, 0]} color="green" />
      <TetrominoBlock position={[1, 0, 0]} color="green" />
    </group>
  );
}

export function ZTetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1, 0, 0]} color="red" />
      <TetrominoBlock position={[0, 0, 0]} color="red" />
      <TetrominoBlock position={[0, -1, 0]} color="red" />
      <TetrominoBlock position={[1, -1, 0]} color="red" />
    </group>
  );
}

export function TTetromino() {
  return (
    <group>
      <TetrominoBlock position={[-1, 0, 0]} color="magenta" />
      <TetrominoBlock position={[0, 0, 0]} color="magenta" />
      <TetrominoBlock position={[1, 0, 0]} color="magenta" />
      <TetrominoBlock position={[0, -1, 0]} color="magenta" />
    </group>
  );
}
