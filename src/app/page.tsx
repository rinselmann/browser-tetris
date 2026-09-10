import GameCanvas from "@/components/GameCanvas";
import Hud from "@/components/Hud";

export default function Home() {
  return (
    <main className="relative h-full w-full">
      <GameCanvas />
      <Hud />
    </main>
  );
}
