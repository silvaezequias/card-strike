import { Card } from "@/lib/types";
import { fxKind } from "./card-fx";
import {
  BombData,
  Bombsite,
  CombatEvent,
  GameState,
  MapEffect,
  Team,
  TeamName,
} from "./game-types";

/* ═══════════════════════════════════════════════
   EFEITOS DAS CARTAS
   Regras aplicadas quando uma carta chega à zona
   de combate e ao fim de cada turno. Os números
   vêm das próprias cartas (game-helpers).
   ═══════════════════════════════════════════════ */

export const MAX_HEALTH = 20;
/** A facção abre a rodada; ela fecha quando a polícia termina de jogar. */
const ROUND_CLOSER: TeamName = "police";
const BOMB_EXPLOSION_DAMAGE = 10;

const hasEffect = (team: Team, name: string) =>
  team.effects.some((effect) => effect.name === name);

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

export const siteHasSmoke = ({ mapEffects }: GameState, spot: Bombsite | null) =>
  mapEffects.some((effect) => effect.name === "Smoke" && effect.spot === spot);

/** A Smoke protege quem a jogou enquanto estiver no lugar dela. */
export const isShielded = (state: GameState, team: TeamName) =>
  state.mapEffects.some(
    (effect) =>
      effect.name === "Smoke" &&
      effect.owner === team &&
      effect.spot === state.teams[team].position,
  );

/** Tudo o que age no time agora, para mostrar no painel do jogador. */
export const activeEffectsOn = (state: GameState, team: TeamName): Card[] => [
  ...state.teams[team].effects,
  ...state.mapEffects.filter(
    (effect) =>
      effect.spot === state.teams[team].position &&
      (effect.name === "Smoke" ? effect.owner === team : effect.owner !== team),
  ),
];

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
    changes: { me?: Team; enemy?: Team; bomb?: BombData; mapEffects?: MapEffect[] } = {},
  ) => ({
    result,
    bomb: changes.bomb ?? state.bomb,
    mapEffects: changes.mapEffects ?? state.mapEffects,
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

  const site = me.position;
  const placed = (owner: TeamName, spot: Bombsite | null): MapEffect[] => [
    ...state.mapEffects.filter(
      (effect) => !(effect.name === card.name && effect.owner === owner && effect.spot === spot),
    ),
    { ...card, owner, spot },
  ];

  if (card.name === "Smoke") {
    const fire = (effect: MapEffect) => effect.name === "Molotov" && effect.spot === site;
    if (state.mapEffects.some(fire))
      return outcome("MOLOTOV APAGADA", {
        mapEffects: state.mapEffects.filter((effect) => !fire(effect)),
      });
    return outcome("SMOKE ATIVA", { mapEffects: placed(self, site) });
  }

  // O fogo fica no bombsite e queima quem estiver lá, mesmo chegando depois.
  if (card.name === "Molotov") {
    if (!site) return outcome("ALVO FORA DE ALCANCE");
    if (siteHasSmoke(state, site)) return outcome("BLOQUEADO POR SMOKE");
    return outcome(inConfrontation(state) ? "ALVO EM CHAMAS" : `FOGO NO BOMBSITE ${site}`, {
      mapEffects: placed(self, site),
    });
  }

  if (card.healing)
    return outcome(`+${card.healing} DE VIDA`, { me: heal(me, card.healing) });

  const enemySmoke = (effect: MapEffect) =>
    effect.name === "Smoke" && effect.owner === foe && effect.spot === site;
  const withoutEnemySmoke = state.mapEffects.filter((effect) => !enemySmoke(effect));
  const smokeHere = withoutEnemySmoke.length < state.mapEffects.length;

  // Ataques só alcançam quem está no mesmo bombsite.
  if (!inConfrontation(state)) {
    if (card.name === "Granada" && smokeHere)
      return outcome("SMOKE DESTRUÍDA", { mapEffects: withoutEnemySmoke });
    return outcome("ALVO FORA DE ALCANCE");
  }

  if (card.cardCategory === "ARMA") {
    if (smokeHere) return outcome("BLOQUEADO POR SMOKE");
    return outcome(`${card.damage} DE DANO`, { enemy: hurt(enemy, card.damage) });
  }

  switch (card.name) {
    case "Granada": {
      if (!smokeHere)
        return outcome(`${card.damage} DE DANO`, { enemy: hurt(enemy, card.damage) });

      const damage = Math.floor(card.damage / 2);
      return outcome(`${damage} DE DANO + SMOKE DESTRUÍDA`, {
        enemy: hurt(enemy, damage),
        mapEffects: withoutEnemySmoke,
      });
    }

    case "Flashbang":
      return outcome("OPONENTE CEGO: PERDE A PRÓXIMA VEZ", {
        enemy: addEffect(enemy, card, card.duration),
      });

    default:
      return outcome("");
  }
};

/** O que animar depois da carta resolvida: toda carta de combate aparece no mapa. */
export const createCombatEvent = (
  state: GameState,
  card: Card,
  teams: GameState["teams"],
): CombatEvent | null => {
  const kind = fxKind(card);
  if (!kind) return null;

  const team = state.currentTeam;
  const target = kind === "smoke" ? team : opponentOf(team);
  const hit = kind === "smoke" || inConfrontation(state);

  return {
    id: state.playedCards.length + 1,
    card,
    team,
    target,
    hit,
    blocked:
      hit &&
      ((kind === "shots" && isShielded(state, target)) ||
        (kind === "molotov" && siteHasSmoke(state, state.teams[team].position))),
    damage: state.teams[target].health - teams[target].health,
  };
};

/** Efeitos presos ao time perdem 1 round. */
const tickEffects = (team: Team): Team => ({
  ...team,
  effects: team.effects
    .map((effect) => ({ ...effect, duration: effect.duration - 1 }))
    .filter((effect) => effect.duration > 0),
});

/** Quem está no fogo do oponente leva o dano; o fogo não queima quem o jogou. */
const burnDamage = ({ mapEffects, teams }: GameState, team: TeamName) =>
  mapEffects
    .filter(
      (effect) =>
        effect.name === "Molotov" &&
        effect.owner !== team &&
        effect.spot === teams[team].position,
    )
    .reduce((total, effect) => total + effect.damage, 0);

export const closesRound = (team: TeamName) => team === ROUND_CLOSER;

/**
 * Fim de turno. Uma rodada é os dois jogarem, então cada efeito só perde 1
 * quando quem está sob ele termina a própria vez: a carta do oponente fecha
 * uma volta ali. O fogo queima nesse momento, uma vez por rodada.
 */
export const resolveEndOfTurn = (state: GameState) => {
  const team = state.currentTeam;
  const teams = {
    ...state.teams,
    [team]: hurt(tickEffects(state.teams[team]), burnDamage(state, team)),
  } as GameState["teams"];
  const mapEffects = state.mapEffects
    .map((effect) =>
      effect.owner === team ? effect : { ...effect, duration: effect.duration - 1 },
    )
    .filter((effect) => effect.duration > 0);

  const bombTicks = closesRound(team) && state.bomb.planted && state.bomb.timer > 0;
  if (!bombTicks) return { bomb: state.bomb, teams, mapEffects };

  const timer = state.bomb.timer - 1;
  const exploded = timer === 0;

  return {
    mapEffects,
    bomb: { ...state.bomb, timer, exploded },
    teams: {
      ...teams,
      police: exploded ? hurt(teams.police, BOMB_EXPLOSION_DAMAGE) : teams.police,
    },
  };
};
