import { Card } from "@/lib/types";
import { fxKind } from "./card-fx";
import { BombData, CombatEvent, GameState, Team, TeamName } from "./game-types";

/* ═══════════════════════════════════════════════
   EFEITOS DAS CARTAS
   Regras aplicadas quando uma carta chega à zona
   de combate e ao fim de cada turno. Os números
   vêm das próprias cartas (game-helpers).
   ═══════════════════════════════════════════════ */

export const MAX_HEALTH = 20;
const BOMB_EXPLOSION_DAMAGE = 10;

const hasEffect = (team: Team, name: string) =>
  team.effects.some((effect) => effect.name === name);

const withoutEffect = (team: Team, name: string): Team => ({
  ...team,
  effects: team.effects.filter((effect) => effect.name !== name),
});

const addEffect = (team: Team, card: Card, duration: number): Team => ({
  ...team,
  effects: [...team.effects, { ...card, duration }],
});

const hurt = (team: Team, damage: number): Team => ({
  ...team,
  health: Math.max(0, team.health - damage),
});

const heal = (team: Team, healing: number): Team => ({
  ...team,
  health: Math.min(MAX_HEALTH, team.health + healing),
});

export const opponentOf = (team: TeamName): TeamName =>
  team === "faction" ? "police" : "faction";

export const isFlashed = (team: Team) => hasEffect(team, "Flashbang");

/** Cartas que só atingem o oponente no mesmo bombsite. */
export const isAttackCard = (card: Card) =>
  !!card.isOffensive && card.name !== "BOMBA";

export const inConfrontation = ({ teams }: GameState) =>
  !!teams.police.position && teams.police.position === teams.faction.position;

export const isGameOver = ({ bomb, teams }: GameState) =>
  bomb.exploded || teams.police.health <= 0 || teams.faction.health <= 0;

/** Aplica a carta jogada pelo time da vez e diz o que aconteceu. */
export const resolveCard = (state: GameState, card: Card) => {
  const self = state.currentTeam;
  const foe = opponentOf(self);
  const me = state.teams[self];
  const enemy = state.teams[foe];

  const outcome = (
    result: string,
    changes: { me?: Team; enemy?: Team; bomb?: BombData } = {},
  ) => ({
    result,
    bomb: changes.bomb ?? state.bomb,
    teams: {
      ...state.teams,
      [self]: changes.me ?? me,
      [foe]: changes.enemy ?? enemy,
    } as GameState["teams"],
  });

  if (card.name === "BOMBA") {
    if (!me.position || state.bomb.planted)
      return outcome("NÃO FOI POSSÍVEL PLANTAR");

    return outcome(`BOMBA PLANTADA NO SITE ${me.position}`, {
      bomb: {
        ...state.bomb,
        planted: true,
        position: me.position,
        timer: state.bomb.maxTime,
      },
    });
  }

  if (card.name === "KIT DEFUSE") {
    if (!state.bomb.planted) return outcome("SEM BOMBA PARA DESARMAR");

    return outcome("BOMBA DESARMADA", {
      bomb: {
        ...state.bomb,
        planted: false,
        position: null,
        timer: state.bomb.maxTime,
      },
    });
  }

  // Ataques só alcançam quem está no mesmo bombsite.
  if (isAttackCard(card) && !inConfrontation(state))
    return outcome("ALVO FORA DE ALCANCE");

  const enemyHasSmoke = hasEffect(enemy, "Smoke");

  if (card.cardCategory === "ARMA") {
    if (enemyHasSmoke) return outcome("BLOQUEADO POR SMOKE");
    return outcome(`${card.damage} DE DANO`, { enemy: hurt(enemy, card.damage) });
  }

  switch (card.name) {
    case "Granada": {
      if (!enemyHasSmoke)
        return outcome(`${card.damage} DE DANO`, { enemy: hurt(enemy, card.damage) });

      const damage = Math.floor(card.damage / 2);
      return outcome(`${damage} DE DANO + SMOKE DESTRUÍDA`, {
        enemy: hurt(withoutEffect(enemy, "Smoke"), damage),
      });
    }

    case "Molotov":
      if (enemyHasSmoke) return outcome("BLOQUEADO POR SMOKE");
      return outcome("ALVO EM CHAMAS", { enemy: addEffect(enemy, card, card.duration) });

    case "Flashbang":
      // +1: o fim do turno de quem jogou também desconta da duração.
      return outcome("OPONENTE CEGO: PERDE A PRÓXIMA VEZ", {
        enemy: addEffect(enemy, card, card.duration + 1),
      });

    case "Smoke":
      if (hasEffect(me, "Molotov"))
        return outcome("MOLOTOV APAGADA", { me: withoutEffect(me, "Molotov") });
      return outcome("SMOKE ATIVA", { me: addEffect(me, card, card.duration) });

    case "Capacete":
    case "Colete":
      return outcome(`+${card.healing} DE VIDA`, { me: heal(me, card.healing) });

    default:
      return outcome("");
  }
};

/** O que animar depois da carta resolvida, se ela chegou a alguém. */
export const createCombatEvent = (
  state: GameState,
  card: Card,
  teams: GameState["teams"],
): CombatEvent | null => {
  const kind = fxKind(card);
  if (!kind) return null;
  if (kind !== "smoke" && !inConfrontation(state)) return null;

  const team = state.currentTeam;
  const target = kind === "smoke" ? team : opponentOf(team);

  return {
    id: state.playedCards.length + 1,
    card,
    team,
    target,
    blocked:
      (kind === "shots" || kind === "molotov") &&
      hasEffect(state.teams[target], "Smoke"),
    damage: state.teams[target].health - teams[target].health,
  };
};

/** Efeitos ativos perdem 1 round; quem está em chamas leva o dano do fogo. */
const tickEffects = (team: Team): Team => {
  const burning = hasEffect(team, "Smoke")
    ? []
    : team.effects.filter((effect) => effect.name === "Molotov");

  return hurt(
    {
      ...team,
      effects: team.effects
        .map((effect) => ({ ...effect, duration: effect.duration - 1 }))
        .filter((effect) => effect.duration > 0),
    },
    burning.reduce((total, effect) => total + effect.damage, 0),
  );
};

/** Fim de turno: desconta os efeitos e, a cada volta completa, o tempo da bomba. */
export const resolveEndOfTurn = (state: GameState) => {
  const police = tickEffects(state.teams.police);
  const faction = tickEffects(state.teams.faction);

  const bombTicks =
    state.currentTeam === "police" && state.bomb.planted && state.bomb.timer > 0;
  if (!bombTicks) return { bomb: state.bomb, teams: { police, faction } };

  const timer = state.bomb.timer - 1;
  const exploded = timer === 0;

  return {
    bomb: { ...state.bomb, timer, exploded },
    teams: {
      police: exploded ? hurt(police, BOMB_EXPLOSION_DAMAGE) : police,
      faction,
    },
  };
};
