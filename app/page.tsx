"use client";

import { useState } from "react";
import SciFiInterface from "@/components/game/sci-fi-interface";
import { GameMenu } from "@/components/game/game-menu";
import { SetupSettings } from "@/game/game-types";

export default function Page() {
  const [playerSetup, setPlayerSetup] = useState<SetupSettings | null>(null);

  if (!playerSetup) {
    return <GameMenu onStart={setPlayerSetup} />;
  }

  return (
    <div className="w-full h-full ">
      <SciFiInterface playerSetup={playerSetup} />;
    </div>
  );
}
