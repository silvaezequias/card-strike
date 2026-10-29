"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Footprints, Repeat, ScanLine } from "lucide-react";
import { BoardStage, CameraShot } from "@/components/game/board-stage";
import { MapSpot } from "@/components/art/tactical-board";
import { getPalette } from "@/components/art/palette";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { TeamName } from "@/game/game-types";
import { Card } from "@/lib/types";

/* Página de aprovação do novo tabuleiro — ainda não usada no jogo. */

const card = (name: string): Card => {
  const entry = CARD_CATALOG.find((c) => c.name === name)!;
  return { ...entry, id: name };
};

const DEMO_SLOTS: Record<TeamName, (Card | null)[]> = {
  police: [card("M4A1"), null, card("Smoke"), null, card("Colete"), null],
  faction: [null, card("AK-47"), null, card("Molotov"), null, card("BOMBA")],
};

const TEAM_LABEL: Record<TeamName, string> = { police: "POLÍCIA", faction: "FACÇÃO" };

const other = (team: TeamName): TeamName => (team === "police" ? "faction" : "police");

export default function BoardPreviewPage() {
  const [turn, setTurn] = useState<TeamName>("police");
  const [shot, setShot] = useState<CameraShot>("focus");
  const [positions, setPositions] = useState<Record<TeamName, MapSpot>>({
    police: "BASE",
    faction: "BASE",
  });
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Passar a vez: afasta, gira em volta da mesa e aproxima no outro time.
  const passTurn = () => {
    if (busy) return;
    setBusy(true);
    setShot("overview");
    schedule(() => setTurn((t) => other(t)), 900);
    schedule(() => {
      setShot("focus");
      setBusy(false);
    }, 2200);
  };

  // Mover o peão: a câmera mostra o mapa e volta para os slots ao chegar.
  const move = (spot: MapSpot) => {
    if (busy || positions[turn] === spot) return;
    setBusy(true);
    setShot("overview");
    schedule(() => setPositions((prev) => ({ ...prev, [turn]: spot })), 700);
  };

  const handleArrive = useCallback(() => {
    schedule(() => {
      setShot("focus");
      setBusy(false);
    }, 600);
  }, []);

  const p = getPalette(turn);

  const button =
    "flex items-center gap-2 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] font-bold tracking-widest text-zinc-200 transition-colors hover:border-white/40 disabled:opacity-40";

  return (
    <div className="relative h-screen overflow-hidden bg-[radial-gradient(ellipse_at_center,#15121f_0%,#050408_70%)] font-mono text-white select-none">
      <BoardStage
        turn={turn}
        shot={shot}
        positions={positions}
        slots={DEMO_SLOTS}
        combatCard={{ card: card("Granada"), team: "police" }}
        onPawnArrive={handleArrive}
      />

      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[10px] font-bold tracking-[0.25em] text-zinc-400">
        ARRASTE PARA GIRAR 360° · ARRASTE PARA CIMA/BAIXO PARA INCLINAR · ROLE PARA ZOOM
      </p>

      {/* Controles da demonstração */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> VOLTAR AO JOGO
          </Link>
          <div
            className="rounded-lg border px-4 py-2 text-sm font-black tracking-[0.3em] transition-colors duration-700"
            style={{ borderColor: `${p.accent}88`, background: `${p.bg1}cc`, color: p.rim }}
          >
            VEZ DA {TEAM_LABEL[turn]}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2 rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur">
          <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-500">PROPOSTA DE TABULEIRO</span>
          <div className="flex gap-2">
            <button className={button} disabled={busy} onClick={() => setShot("overview")}>
              <Eye size={13} /> VISÃO GERAL
            </button>
            <button className={button} disabled={busy} onClick={() => setShot("focus")}>
              <ScanLine size={13} /> SLOTS
            </button>
            <button className={button} disabled={busy} onClick={passTurn}>
              <Repeat size={13} /> PASSAR A VEZ
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Footprints size={13} className="text-zinc-500" />
            {(["BASE", "A", "B", "C"] as MapSpot[]).map((spot) => (
              <button
                key={spot}
                className={button}
                disabled={busy || positions[turn] === spot}
                onClick={() => move(spot)}
                style={positions[turn] === spot ? { borderColor: p.accent, color: p.rim } : undefined}
              >
                {spot === "BASE" ? "BASE" : `SITE ${spot}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
