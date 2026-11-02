"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Crosshair, Filter, Info, Shield } from "lucide-react";
import { Portrait } from "@/components/art/noir";
import { NoirCard } from "@/components/art/noir-card";
import { ITEM_ART } from "@/components/art/items";
import { getPalette } from "@/components/art/palette";
import { TeamName } from "@/game/game-types";
import { CARD_CATALOG, CatalogEntry } from "@/lib/card-catalog";
import { Card } from "@/lib/types";
import { Arena } from "@/components/game/menu-arena";

/* ═══════════════════════════════════════════════
   INVENTÁRIO
   No estilo do "loadout" dos jogos de tiro tático:
   o operador do time à esquerda e as cartas em
   colunas por categoria. Clicar numa carta abre a
   inspeção dela, com o item grande e as informações.
   ═══════════════════════════════════════════════ */

type Column = { title: string; names: Record<TeamName, string[]> };

const COLUMNS: Column[] = [
  { title: "Pistolas", names: { police: ["USP", "DESERT EAGLE"], faction: ["GLOCK", "DESERT EAGLE"] } },
  { title: "Rifles", names: { police: ["M4A1", "AWP"], faction: ["AK-47", "AWP"] } },
  {
    title: "Utilitários",
    names: { police: ["Granada", "Smoke", "Molotov", "Flashbang"], faction: ["Granada", "Smoke", "Molotov", "Flashbang"] },
  },
  { title: "Equipamento", names: { police: ["Capacete", "Colete", "KIT DEFUSE"], faction: ["Capacete", "Colete", "BOMBA"] } },
];

const TEAM_LABEL: Record<TeamName, string> = { police: "Polícia", faction: "Facção" };

/** Raridade pelo impacto da carta, nas cores clássicas dos jogos de tiro. */
const rarityOf = (entry: CatalogEntry) => {
  if (entry.cardCategory === "BOMBA") return { label: "Objetivo", color: "#e4ae39" };
  const power = entry.damage + entry.healing + entry.duration;
  if (power >= 8) return { label: "Secreta", color: "#eb4b4b" };
  if (power >= 5) return { label: "Confidencial", color: "#d32ce6" };
  if (power >= 4) return { label: "Restrita", color: "#8847ff" };
  if (power >= 3) return { label: "Militar", color: "#4b69ff" };
  return { label: "Industrial", color: "#5e98d9" };
};

const CATEGORY_LABEL: Record<CatalogEntry["cardCategory"], string> = {
  ARMA: "Arma",
  BOMBA: "Objetivo",
  DIVERSOS: "Utilitário",
};

const findEntry = (name: string) => CARD_CATALOG.find((entry) => entry.name === name);

/** Arte da carta deitada e centrada, sem a moldura (miniatura do inventário). */
const ItemSprite = ({ name, team, className }: { name: string; team: TeamName; className?: string }) => {
  const art = ITEM_ART[name];
  if (!art) return null;
  return (
    <svg viewBox="-50 62 400 220" className={className} aria-hidden="true">
      <g transform={`rotate(${-art.tilt} 150 172)`}>
        <g transform={art.transform}>
          <art.Art p={getPalette(team)} />
        </g>
      </g>
    </svg>
  );
};

const ItemTile = ({
  entry,
  team,
  selected,
  onSelect,
}: {
  entry: CatalogEntry;
  team: TeamName;
  selected: boolean;
  onSelect: () => void;
}) => {
  const rarity = rarityOf(entry);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex aspect-[16/9] w-full flex-col overflow-hidden rounded-sm bg-gradient-to-b from-white/[0.07] to-white/[0.02] text-left transition-all hover:from-white/[0.14] hover:to-white/[0.05]"
      style={{ outline: selected ? `2px solid ${rarity.color}` : undefined }}
    >
      <ItemSprite
        name={entry.name}
        team={team}
        className="absolute inset-0 m-auto h-[88%] w-[88%] drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-110"
      />
      <span className="relative mt-auto truncate px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-200">
        {entry.name}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: rarity.color }} />
    </button>
  );
};

const StatChip = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <span className="flex items-center gap-2 rounded-md border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-sm">
    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
    <span className="font-mono text-sm font-black" style={{ color }}>
      {value}
    </span>
  </span>
);

/**
 * Inspeção do item, como nos jogos de tiro tático: a arma grande no meio da
 * arena, o nome no topo, a descrição embaixo e o botão de fechar. O item
 * acompanha o mouse em 3D; o "i" mostra as regras completas.
 */
const ItemInspect = ({ entry, team, onClose }: { entry: CatalogEntry; team: TeamName; onClose: () => void }) => {
  const rarity = rarityOf(entry);
  const p = getPalette(team);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showRules, setShowRules] = useState(false);
  const card: Card = { ...entry, id: entry.id, team };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stats = [
    entry.damage > 0 && { label: "Dano", value: `${entry.damage}`, color: "#ff5c70" },
    entry.healing > 0 && { label: "Cura", value: `+${entry.healing}`, color: "#5cffa8" },
    entry.duration > 0 && { label: "Duração", value: `${entry.duration} rounds`, color: "#ffd45c" },
    { label: "Tipo", value: entry.isOffensive ? "Ofensiva" : "Defensiva", color: "#e4e4e7" },
    { label: "Times", value: entry.teams.map((t) => TEAM_LABEL[t]).join(" e "), color: p.rim },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  return createPortal(
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-[#050409] font-mono text-white animate-in fade-in duration-300"
      onPointerMove={(e) =>
        setTilt({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        })
      }
    >
      <div className="absolute inset-0 scale-105 blur-[3px]">
        <Arena dim={false} />
      </div>
      <div className="absolute inset-0 bg-black/25" />

      {/* Nome no topo */}
      <header className="absolute inset-x-0 top-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <span style={{ color: p.rim }}>{team === "police" ? <Shield size={26} /> : <Crosshair size={26} />}</span>
          <h2 className="text-3xl font-light tracking-wide text-white drop-shadow-lg">
            <span className="font-black">{entry.name}</span> | {CATEGORY_LABEL[entry.cardCategory]}
          </h2>
        </div>
        <p className="mt-1 text-sm text-zinc-300">Coleção Card Strike · {rarity.label}</p>
        <span
          className="mt-2 h-[3px] w-[min(520px,70vw)]"
          style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)` }}
        />
      </header>

      {/* Item grande, girando com o mouse */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1200 }}>
        <div
          className="inspect-float w-[min(72vw,920px)]"
          style={{
            transform: `rotateY(${tilt.x * 22}deg) rotateX(${-tilt.y * 12}deg)`,
            transition: "transform 200ms ease-out",
          }}
        >
          <ItemSprite name={entry.name} team={team} className="h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.7)]" />
        </div>
      </div>

      {/* Descrição e números */}
      <div className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-3 px-6 text-center">
        <p className="max-w-xl text-sm text-zinc-200 drop-shadow">{entry.description}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {stats.map((stat) => (
            <StatChip key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Regras completas (botão "i") */}
      {showRules && (
        <div className="absolute bottom-36 right-6 flex w-80 gap-3 rounded-lg border border-white/10 bg-black/75 p-3 text-left backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <NoirCard card={card} team={team} className="w-24 shrink-0" />
          <div className="flex flex-col gap-2 text-xs text-zinc-200">
            {entry.mapEffect && (
              <p>
                <span className="block text-[10px] font-bold tracking-[0.3em] text-zinc-400">NO MAPA</span>
                {entry.mapEffect}
              </p>
            )}
            {entry.interactions.length > 0 && (
              <div>
                <span className="block text-[10px] font-bold tracking-[0.3em] text-zinc-400">INTERAÇÕES</span>
                <ul className="list-disc pl-4">
                  {entry.interactions.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            )}
            {!entry.mapEffect && entry.interactions.length === 0 && <p>Sem regras extras.</p>}
          </div>
        </div>
      )}

      {/* Barra de baixo */}
      <footer className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-between border-t border-white/10 bg-black/50 pl-16 pr-6 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowRules((v) => !v)}
          aria-pressed={showRules}
          title="Regras da carta"
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            showRules ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Info size={18} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-200 transition-colors hover:text-white"
        >
          Fechar
        </button>
      </footer>
    </div>,
    document.body,
  );
};

export const InventoryView = ({ initialTeam }: { initialTeam: TeamName }) => {
  const [team, setTeam] = useState<TeamName>(initialTeam);
  const [variant, setVariant] = useState<0 | 1>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const p = getPalette(team);
  const otherTeam: TeamName = team === "police" ? "faction" : "police";
  const selectedEntry = selected ? findEntry(selected) : null;

  return (
    <div className="relative flex h-full gap-4 overflow-hidden bg-[#0d1424]/60 p-4">
      {/* Operadores do time */}
      <div className="flex w-16 shrink-0 flex-col gap-2">
        {([0, 1] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            title={`Operador ${v + 1}`}
            className="relative aspect-square overflow-hidden rounded-sm bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
          >
            <Portrait team={team} variant={v} crop="head" flip={team === "police"} className="block h-full w-full" />
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: variant === v ? p.rim : "transparent" }} />
          </button>
        ))}
        <span className="my-1 h-px bg-white/15" />
        {COLUMNS.map(({ title }) => (
          <span key={title} className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            {title}
          </span>
        ))}
      </div>

      {/* Operador em destaque e troca de time */}
      <div className="relative flex w-[26%] min-w-[200px] shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={() => {
            setTeam(otherTeam);
            setSelected(null);
          }}
          className="z-10 flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-black uppercase italic tracking-wider text-[#07060c] shadow-lg transition-transform hover:scale-105"
          style={{ background: p.rim }}
          title={`Ver o inventário da ${TEAM_LABEL[otherTeam]}`}
        >
          {team === "police" ? <Shield size={15} /> : <Crosshair size={15} />}
          Equipe {TEAM_LABEL[team]}
        </button>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Clique para trocar de time</p>
        <Portrait
          key={`${team}-${variant}`}
          team={team}
          variant={variant}
          flip={team === "police"}
          backdrop={false}
          crop="full"
          className="mt-auto h-[92%] w-auto max-w-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] animate-in fade-in duration-500"
        />
      </div>

      {/* Colunas de cartas */}
      <div className="grid min-w-0 flex-1 grid-cols-4 gap-3 overflow-y-auto pr-1">
        {COLUMNS.map(({ title, names }) => (
          <section key={title} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-300">
              <Filter size={12} />
              {title}
            </h3>
            {names[team].map((name) => {
              const entry = findEntry(name);
              return entry ? (
                <ItemTile
                  key={name}
                  entry={entry}
                  team={team}
                  selected={selected === name}
                  onSelect={() => setSelected(name)}
                />
              ) : null;
            })}
          </section>
        ))}
      </div>

      {selectedEntry && <ItemInspect entry={selectedEntry} team={team} onClose={() => setSelected(null)} />}
    </div>
  );
};
