import { useEffect, useRef } from "react";
import { SoundName, playSound, setLoopVolume, startAudio } from "@/lib/game-audio";
import { Card } from "@/lib/types";
import { BULLET_GAP_MS, THROW_MS, fxKind } from "./card-fx";
import { GameState, MapEffect, TeamName } from "./game-types";
import { CombatFx } from "./useCombatFx";

const WEAPON_SOUND: Record<string, SoundName> = {
  "AK-47": "rifle",
  M4A1: "rifle",
  GLOCK: "pistol",
  USP: "pistol",
  "DESERT EAGLE": "deagle",
  AWP: "sniper",
};

/** Efeitos contínuos: alto na vez de quem jogou, baixo na vez do inimigo. */
const LOOP_VOLUME = { own: 0.6, enemy: 0.15 };
const FIRE_GAIN = 1.3;

/** Tempo entre bipes da bomba, pelas rodadas que faltam. */
const BEEP_MS: Record<number, number> = { 5: 1500, 4: 1100, 3: 750, 2: 450, 1: 200 };
const BEEP_VOLUME = 0.55;
const SHAKE_VOLUME = 0.7;

const loopVolume = (effects: MapEffect[], name: string, currentTeam: TeamName) => {
  const active = effects.filter((effect) => effect.name === name);
  if (active.length === 0) return 0;
  return active.some((effect) => effect.owner === currentTeam) ? LOOP_VOLUME.own : LOOP_VOLUME.enemy;
};

const playCardSound = (card: Card) => {
  switch (fxKind(card)) {
    case "shots":
      for (let i = 0; i < card.damage; i++) {
        playSound(WEAPON_SOUND[card.name] ?? "rifle", {
          delay: (i * BULLET_GAP_MS) / 1000,
          rate: 0.96 + Math.random() * 0.08,
        });
      }
      return;
    case "grenade":
      return playSound("grenade", { delay: THROW_MS / 1000 });
    case "flashbang":
      return playSound("flashbang", { delay: THROW_MS / 1000 });
    case "molotov":
      return playSound("glass", { delay: THROW_MS / 1000 });
    case "smoke":
      return playSound("smoke-burst");
  }
};

export const playDiceHit = () =>
  playSound("dice-hit", { rate: 0.85 + Math.random() * 0.4, volume: 0.7 + Math.random() * 0.3 });

/** Toca os sons da partida a partir do que está acontecendo no jogo. */
export const useGameSounds = (state: GameState, fx: CombatFx, shaking: boolean, over: boolean) => {
  const { bomb, currentTeam } = state;

  useEffect(() => {
    startAudio();
    window.addEventListener("pointerdown", startAudio);
    return () => {
      window.removeEventListener("pointerdown", startAudio);
      (["smoke-loop", "fire-loop", "dice-shake"] as SoundName[]).forEach((name) => setLoopVolume(name, 0));
    };
  }, []);

  // Som da carta quando a ação dela começa no mapa.
  const eventId = fx.event?.id;
  const acting = fx.stage === "action" && !!eventId;
  useEffect(() => {
    if (acting && fx.event) playCardSound(fx.event.card);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acting, eventId]);

  // Smoke e fogo enquanto estiverem no mapa.
  const visibleEffects = state.mapEffects.filter((effect) => !fx.hidesEffect(effect.id));
  const smokeVolume = over ? 0 : loopVolume(visibleEffects, "Smoke", currentTeam);
  const fireVolume = over ? 0 : loopVolume(visibleEffects, "Molotov", currentTeam) * FIRE_GAIN;
  useEffect(() => setLoopVolume("smoke-loop", smokeVolume), [smokeVolume]);
  useEffect(() => setLoopVolume("fire-loop", fireVolume), [fireVolume]);

  useEffect(() => setLoopVolume("dice-shake", shaking ? SHAKE_VOLUME : 0), [shaking]);

  // Bomba: plantar, desarmar, contagem e explosão.
  const wasPlanted = useRef(false);
  useEffect(() => {
    if (bomb.planted !== wasPlanted.current && !bomb.exploded) {
      playSound(bomb.planted ? "bomb-plant" : "bomb-defuse");
    }
    wasPlanted.current = bomb.planted;
  }, [bomb.planted, bomb.exploded]);

  useEffect(() => {
    if (!bomb.planted || bomb.exploded) return;
    const beep = () => playSound("bomb-beep", { volume: BEEP_VOLUME });
    const interval = window.setInterval(beep, BEEP_MS[bomb.timer] ?? BEEP_MS[1]);
    return () => window.clearInterval(interval);
  }, [bomb.planted, bomb.exploded, bomb.timer]);

  useEffect(() => {
    if (bomb.exploded) playSound("c4-explosion");
  }, [bomb.exploded]);
};
