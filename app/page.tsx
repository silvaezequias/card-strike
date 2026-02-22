"use client";

import { useState } from "react";
import SciFiInterface from "@/components/game/sci-fi-interface";
import { GameMenu, type PlayerSetup } from "@/components/game/game-menu";

export default function Page() {
  const [playerSetup, setPlayerSetup] = useState<PlayerSetup | null>(null);

  if (!playerSetup) {
    return <GameMenu onStart={setPlayerSetup} />;
  }

  return (
    <div className="w-full h-full ">
      <SciFiInterface playerSetup={playerSetup} />;
    </div>
  );
}
