import { Bombsite, TeamName } from "@/game/game-types";

/** Partes do tabuleiro de cartas que a câmera pode focar. */
export type CardFocusArea = "overview" | "grid" | "slot" | "deck" | "combat" | "bomb";
/** Partes do mapa que a câmera pode focar. */
export type MapFocusArea = "full" | "A" | "B" | "C" | "base";

export type CameraFocus =
  | { board: "cards"; area: CardFocusArea; team?: TeamName; slot?: number }
  | { board: "map"; area: MapFocusArea; team?: TeamName };

/* ═══════════════════════════════════════════════
   ROTEIRO DO TUTORIAL
   Você joga de CT (Polícia) contra um bot (Facção).
   Cada passo tem uma fala e uma regra: o que acontece
   e qual resultado o dado/roleta/compra vai dar.
   ═══════════════════════════════════════════════ */

export type TutorialAction =
  /** Só fala; o jogador clica em "Continuar". */
  | { kind: "narration" }
  /** Bot gira a roleta e vai para o site. */
  | { kind: "opponent-move"; site: Bombsite }
  /** Bot rola o dado (= slot), compra a carta se não tiver e posiciona. */
  | { kind: "opponent-place"; slot: number; card: string }
  /** Bot rola o dado (= slot) e joga a carta que está nesse slot. */
  | { kind: "opponent-play"; slot: number }
  /** Jogador precisa se posicionar; a roleta cai no site definido. */
  | { kind: "player-move"; site: Bombsite }
  /** Jogador rola o dado (cai no slot), compra a carta e posiciona. */
  | { kind: "player-place"; slot: number; card: string }
  /** Jogador rola o dado (cai no slot) e joga a carta desse slot. */
  | { kind: "player-play"; slot: number }
  /** Só fala, mas a câmera foca uma parte de um dos tabuleiros. */
  | ({ kind: "camera" } & CameraFocus)
  /** Fim: oferece jogar a partida ou repetir. */
  | { kind: "finish" };

export type TutorialActionKind = TutorialAction["kind"];

export type TutorialStep = {
  id: string;
  /** Nome curto, só para o editor. */
  label: string;
  speaker: string;
  /** Fala exibida e narrada. */
  text: string;
  action: TutorialAction;
  /** "auto" avança sozinho quando a ação e a fala terminam. */
  advance: "auto" | "click";
  /** Áudio enviado no editor (arquivo em public/tutorial/audio). */
  audioUrl?: string | null;
};

export type TutorialScript = { version: 1; steps: TutorialStep[] };

export const ACTION_LABELS: Record<TutorialActionKind, string> = {
  narration: "Só fala",
  camera: "Câmera (só fala, com foco)",
  "opponent-move": "Bot se posiciona",
  "opponent-place": "Bot posiciona carta",
  "opponent-play": "Bot joga carta",
  "player-move": "Jogador se posiciona",
  "player-place": "Jogador posiciona carta",
  "player-play": "Jogador joga carta",
  finish: "Fim do tutorial",
};

/** Ação padrão ao trocar o tipo no editor. */
export const defaultAction = (kind: TutorialActionKind): TutorialAction => {
  switch (kind) {
    case "opponent-move":
    case "player-move":
      return { kind, site: "A" };
    case "opponent-place":
      return { kind, slot: 1, card: "AK-47" };
    case "player-place":
      return { kind, slot: 1, card: "M4A1" };
    case "opponent-play":
    case "player-play":
      return { kind, slot: 1 };
    case "camera":
      return { kind, board: "cards", area: "grid", team: "police" };
    default:
      return { kind };
  }
};

export const actionTeam = (action: TutorialAction) =>
  action.kind.startsWith("player-") ? "police" : action.kind.startsWith("opponent-") ? "faction" : null;
