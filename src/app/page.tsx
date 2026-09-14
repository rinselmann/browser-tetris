import GameCanvas from "@/components/GameCanvas";
import { GameUIProvider } from "@/components/GameUIContext";
import Hud from "@/components/Hud";
import InputControls from "@/components/InputControls";

export default function Home() {
  return (
    <main className="relative h-full w-full">
      <InputControls>
        <GameUIProvider>
          <GameCanvas />
          <Hud />
        </GameUIProvider>
      </InputControls>
    </main>
  );
}
