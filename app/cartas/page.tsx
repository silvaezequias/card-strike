"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Heart, Link2, Map, ScrollText } from "lucide-react";
import { NoirCard } from "@/components/art/noir-card";
import { Portrait } from "@/components/art/noir";
import { getPalette } from "@/components/art/palette";
import { CARD_CATALOG, type CatalogEntry } from "@/lib/card-catalog";
import { GAME_RULES } from "@/lib/game-rules";
import { TeamName } from "@/game/game-types";
import type { Card } from "@/lib/types";

const CATEGORIES: { id: Card["cardCategory"]; label: string }[] = [
  { id: "ARMA", label: "Armas" },
  { id: "BOMBA", label: "Bomba e desarme" },
  { id: "DIVERSOS", label: "Utilitários" },
];

const TEAM_LABEL: Record<TeamName, string> = {
  police: "Polícia",
  faction: "Facção",
};

const lifeEffect = (card: CatalogEntry) => {
  if (card.damage > 0 && card.duration > 0 && card.cardCategory === "DIVERSOS")
    return `Tira ${card.damage} de vida por round durante ${card.duration} rounds`;
  if (card.damage > 0 && card.duration > 0)
    return `Tira ${card.damage} de vida ao final de ${card.duration} rounds`;
  if (card.damage > 0) return `Tira ${card.damage} de vida do oponente`;
  if (card.healing > 0) return `Dá +${card.healing} de vida a quem jogou`;
  return "Não altera a vida";
};

const durationLabel = (card: CatalogEntry) =>
  card.duration > 0
    ? `${card.duration} ${card.duration === 1 ? "rodada" : "rounds"}`
    : "Imediato";

const CardEntry = ({ card, team }: { card: CatalogEntry; team: TeamName }) => {
  const viewTeam = card.teams.includes(team) ? team : card.teams[0];
  const p = getPalette(viewTeam);
  const lifeColor =
    card.damage > 0 ? "#ff5c70" : card.healing > 0 ? "#5cffa8" : "#a1a1aa";

  return (
    <article
      className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20"
      style={{ boxShadow: `inset 3px 0 0 ${p.accent}` }}
    >
      <NoirCard
        card={{ ...card, id: card.id }}
        team={viewTeam}
        className="w-32 xl:w-36 flex-shrink-0 self-start drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <h3 className="text-lg font-black tracking-wider text-white">
            {card.name.toUpperCase()}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {card.teams.map((t) => (
              <span
                key={t}
                className="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  color: getPalette(t).rim,
                  borderColor: `${getPalette(t).accent}55`,
                  background: `${getPalette(t).accent}1a`,
                }}
              >
                {TEAM_LABEL[t]}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-zinc-400">{card.description}</p>

        <dl className="grid gap-2 text-xs">
          <div className="flex items-start gap-2">
            <Heart size={14} className="mt-0.5 flex-shrink-0" style={{ color: lifeColor }} />
            <div>
              <dt className="sr-only">Vida</dt>
              <dd className="font-bold" style={{ color: lifeColor }}>
                {lifeEffect(card)}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 flex-shrink-0 text-yellow-300" />
            <div>
              <dt className="sr-only">Duração</dt>
              <dd className="text-zinc-300">{durationLabel(card)}</dd>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Map size={14} className="mt-0.5 flex-shrink-0 text-sky-300" />
            <div>
              <dt className="sr-only">Efeito no mapa</dt>
              <dd className={card.mapEffect ? "text-zinc-200" : "text-zinc-500"}>
                {card.mapEffect ?? "Não altera o mapa"}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Link2 size={14} className="mt-0.5 flex-shrink-0 text-fuchsia-300" />
            <div>
              <dt className="sr-only">Interações</dt>
              {card.interactions.length > 0 ? (
                <ul className="space-y-0.5 text-zinc-200">
                  {card.interactions.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : (
                <dd className="text-zinc-500">Não interage com outras cartas</dd>
              )}
            </div>
          </div>
        </dl>
      </div>
    </article>
  );
};

const RulesSection = () => (
  <section id="regras" className="scroll-mt-24">
    <div className="mb-6 flex items-center gap-3">
      <ScrollText size={18} className="text-zinc-400" />
      <h2 className="text-2xl font-black tracking-[0.25em] text-white">REGRAS</h2>
    </div>

    {GAME_RULES.length === 0 ? (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="text-sm font-bold tracking-widest text-zinc-400">EM BREVE</p>
        <p className="mt-2 text-xs text-zinc-500">
          As regras do jogo aparecerão aqui.
        </p>
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {GAME_RULES.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-white">
              {section.title}
            </h3>
            <div className="space-y-2 text-sm leading-relaxed text-zinc-300">
              {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default function CardsPage() {
  const [team, setTeam] = useState<TeamName>("police");
  const p = getPalette(team);

  return (
    <div className="h-screen overflow-y-auto bg-neutral-950 font-mono text-white">
      {/* Cabeçalho com personagens */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: `linear-gradient(110deg, ${p.bg0} 20%, ${p.bg1} 60%, ${p.bg2} 100%)`,
          }}
        />
        <div className="pointer-events-none absolute -right-6 bottom-0 flex h-full items-end">
          <Portrait team={team} variant={1} backdrop={false} className="h-[115%] w-auto opacity-90" />
          <Portrait team={team} variant={0} backdrop={false} className="-ml-24 h-[125%] w-auto" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> VOLTAR AO JOGO
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-[0.3em]">ARSENAL</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Todas as cartas do Card Strike: dano, cura, efeito no mapa e como elas
            interagem entre si.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-white/15 bg-black/40 p-1">
              {(["police", "faction"] as TeamName[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold tracking-widest transition-colors ${
                    team === t ? "text-black" : "text-zinc-400 hover:text-white"
                  }`}
                  style={team === t ? { background: getPalette(t).rim } : undefined}
                >
                  {TEAM_LABEL[t].toUpperCase()}
                </button>
              ))}
            </div>
            <nav className="flex gap-2 text-xs font-bold tracking-widest">
              {CATEGORIES.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-zinc-300 hover:border-white/30"
                >
                  {c.label.toUpperCase()}
                </a>
              ))}
              <a
                href="#regras"
                className="rounded-md border border-white/10 px-3 py-1.5 text-zinc-300 hover:border-white/30"
              >
                REGRAS
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        {CATEGORIES.map((category) => {
          const cards = CARD_CATALOG.filter((c) => c.cardCategory === category.id);
          return (
            <section key={category.id} id={category.id} className="scroll-mt-6">
              <h2 className="mb-5 flex items-center gap-3 text-2xl font-black tracking-[0.25em]">
                {category.label.toUpperCase()}
                <span className="text-sm font-bold text-zinc-500">{cards.length}</span>
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {cards.map((card) => (
                  <CardEntry key={card.id} card={card} team={team} />
                ))}
              </div>
            </section>
          );
        })}

        <RulesSection />
      </main>
    </div>
  );
}
