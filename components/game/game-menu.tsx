"use client";

import { Shield, Crosshair, Shuffle, Play } from "lucide-react";
import { SetupSettings } from "@/game/game-types";
import { useGameSetup } from "@/game/useSetupGame";

export const GameMenu = ({
  onStart,
}: {
  onStart: (setup: SetupSettings) => void;
}) => {
  const { state, canStart, shuffleTeams, buildSetup, setPlayerName } =
    useGameSetup();

  const handleStart = () => {
    const setup = buildSetup();
    if (!setup) return;
    onStart(setup);
  };

  const [player1, player2] = state.players;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-mono select-none">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-[0.3em] mb-2">
            CARD STRIKE - OPERAÇÃO TÁTICA
          </h1>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto mb-3" />
          <p className="text-slate-500 text-sm tracking-widest uppercase">
            Configure a partida
          </p>
        </div>

        {/* Player Inputs */}
        <div className="space-y-4 mb-8">
          {/* Player 1 */}
          <div className="relative group">
            <label className="text-slate-500 text-[10px] tracking-[0.2em] uppercase mb-1.5 block">
              Jogador 1
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={player1.name}
                onChange={(e) => setPlayerName(0, e.target.value)}
                placeholder="Nome do jogador..."
                maxLength={16}
                className="flex-1 bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-600 px-4 py-3 rounded-lg text-sm tracking-wider focus:outline-none focus:border-slate-500 transition-colors"
              />
              {player1.team && (
                <div
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-bold tracking-wider transition-all duration-300 ${
                    player1.team === "police"
                      ? "bg-blue-950/60 border-blue-600/40 text-blue-400"
                      : "bg-red-950/60 border-red-600/40 text-red-400"
                  }`}
                >
                  {player1.team === "police" ? (
                    <Shield size={16} />
                  ) : (
                    <Crosshair size={16} />
                  )}
                  {player1.team === "police" ? "POL" : "FAC"}
                </div>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div className="relative group">
            <label className="text-slate-500 text-[10px] tracking-[0.2em] uppercase mb-1.5 block">
              Jogador 2
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={player2.name}
                onChange={(e) => setPlayerName(1, e.target.value)}
                placeholder="Nome do jogador..."
                maxLength={16}
                className="flex-1 bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-600 px-4 py-3 rounded-lg text-sm tracking-wider focus:outline-none focus:border-slate-500 transition-colors"
              />
              {player2.team && (
                <div
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-bold tracking-wider transition-all duration-300 ${
                    player2.team === "police"
                      ? "bg-blue-950/60 border-blue-600/40 text-blue-400"
                      : "bg-red-950/60 border-red-600/40 text-red-400"
                  }`}
                >
                  {player2.team === "police" ? (
                    <Shield size={16} />
                  ) : (
                    <Crosshair size={16} />
                  )}
                  {player2.team === "police" ? "POL" : "FAC"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shuffle Button */}
        <button
          onClick={shuffleTeams}
          disabled={
            !player1.name.trim() || !player2.name.trim() || state.isShuffling
          }
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg border text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 mb-4 ${
            !player1.name.trim() || !player2.name.trim()
              ? "bg-slate-900/40 border-slate-800 text-slate-700 cursor-not-allowed"
              : state.isShuffling
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-slate-900/80 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
          }`}
        >
          <Shuffle
            size={18}
            className={state.isShuffling ? "animate-spin" : ""}
          />
          {state.isShuffling
            ? "Sorteando..."
            : player1.team
              ? "Sortear novamente"
              : "Sortear times"}
        </button>

        {/* Team Preview */}
        {player1.team && !state.isShuffling && (
          <div className="grid grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Police Team */}
            <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-900/50 border border-blue-600/40 flex items-center justify-center">
                <Shield size={24} className="text-blue-400" />
              </div>
              <p className="text-blue-400 text-[10px] tracking-[0.2em] font-bold mb-1">
                POLICIA
              </p>
              <p className="text-white text-sm font-bold tracking-wider truncate">
                {player1.team === "police" ? player1.name : player2.name}
              </p>
            </div>

            {/* Faction Team */}
            <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-900/50 border border-red-600/40 flex items-center justify-center">
                <Crosshair size={24} className="text-red-400" />
              </div>
              <p className="text-red-400 text-[10px] tracking-[0.2em] font-bold mb-1">
                FACÇÃO
              </p>
              <p className="text-white text-sm font-bold tracking-wider truncate">
                {player1.team === "faction" ? player1.name : player2.name}
              </p>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || state.isShuffling}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
            canStart && !state.isShuffling
              ? "bg-white text-black hover:bg-slate-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              : "bg-slate-900/40 border border-slate-800 text-slate-700 cursor-not-allowed"
          }`}
        >
          <Play size={18} />
          Iniciar partida
        </button>
      </div>
    </div>
  );
};
