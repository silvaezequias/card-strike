/* ═══════════════════════════════════════════════
   REGRAS DO JOGO
   Exibidas na página /cartas. Cada seção vira um
   bloco com título; cada string de `body` vira um
   parágrafo e cada item de `list` vira um tópico.
   ═══════════════════════════════════════════════ */

export type RuleSection = {
  title: string;
  body?: string[];
  list?: string[];
};

export const GAME_RULES: RuleSection[] = [];
