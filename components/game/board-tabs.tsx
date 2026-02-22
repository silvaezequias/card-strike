import { Ban } from "lucide-react";
import { Battlefield } from "./battlefield";
import { Action } from "./action";
import { GameEngine } from "@/game/useGameEngine";

export type TabItem = {
  id: "battlefieldTab" | "actionTab";
  label: string;
  component: React.ReactNode;
};

type BoardTabsProps = {
  game: GameEngine;
};

export default function BoardTabs({ game }: BoardTabsProps) {
  const tabs: TabItem[] = [
    {
      id: "battlefieldTab",
      label: "Campo de Batalha",
      component: <Battlefield game={game} />,
    },
    {
      id: "actionTab",
      label: "Ação",
      component: <Action game={game} />,
    },
  ];

  return (
    <div className="relative">
      {/* TABS */}
      <div className="flex justify-center">
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              disabled={!game.state.board.enabledTabs[tab.id]}
              onClick={() =>
                game.dispatch({ type: "SWITCH_TAB", payload: tab.id })
              }
              className={`
                px-4 py-1 transition w-full uppercase font-bold flex justify-center items-center gap-1
                ${game.state.board.activeTab === tab.id ? `text-white border-white border-b-2` : "text-white/40 border-white/40 border-b-2"}
                ${!game.state.board.enabledTabs[tab.id] && "opacity-40 cursor-not-allowed text-slate-400"}
              `}
            >
              {!game.state.board.enabledTabs[tab.id] && (
                <Ban size={16} className="inline-block mr-1" />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* CONTEÚDO */}
      <div className="mt-6 aspect-[4/3] max-w-[500px]">
        {tabs.find((tab) => tab.id === game.state.board.activeTab)?.component}
      </div>
    </div>
  );
}
