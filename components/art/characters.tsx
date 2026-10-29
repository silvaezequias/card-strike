import { TeamName } from "@/game/game-types";
import { ArtPalette } from "./palette";

/* ═══════════════════════════════════════════════
   CHARACTER PORTRAITS — viewBox 0 0 400 500
   Bustos em 3/4 voltados para a esquerda. A luz de
   recorte (rim) vem de trás, pela direita.
   ═══════════════════════════════════════════════ */

type ArtProps = { p: ArtPalette };

const Rim = ({ d, p, w = 3, o = 1 }: { d: string; p: ArtPalette; w?: number; o?: number }) => (
  <path
    d={d}
    fill="none"
    stroke={p.rim}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity={o}
  />
);

type CharacterProps = ArtProps & { flip?: boolean };

/* ───────────── PARTES COMPARTILHADAS ───────────── */

const MaleFace = ({ p }: ArtProps) => (
  <g>
    {/* Pescoço */}
    <path d="M168,272 L166,352 Q200,374 238,352 L232,262 Z" fill={p.skin} />
    <path d="M204,290 L232,262 L238,352 Q220,362 204,364 Z" fill={p.skinShade} opacity={0.75} />
    <path d="M168,286 Q200,312 234,276 L235,302 Q200,330 168,308 Z" fill={p.skinShade} />

    {/* Rosto (sem traços: coberto por óculos/máscara) */}
    <path
      d="M150,168 L148,204 L137,232 L150,240 L152,262 Q160,292 196,307 Q224,300 241,272 L253,230 L259,190 L251,148 Z"
      fill={p.skin}
    />
    <path
      d="M222,158 L251,148 L259,190 L253,230 L241,272 Q224,300 196,307 Q214,282 220,244 Q226,206 222,158 Z"
      fill={p.skinShade}
      opacity={0.85}
    />
    <path d="M152,170 L196,164 L192,176 L154,184 Z" fill={p.skinLight} opacity={0.35} />

    <Rim p={p} d="M259,192 L253,230 L241,272 Q224,300 198,307" />
    <Rim p={p} d="M234,276 L238,352" w={2.5} />
  </g>
);

const FemaleFace = ({ p }: ArtProps) => (
  <g>
    {/* Pescoço */}
    <path d="M172,270 L170,350 Q202,370 236,350 L230,258 Z" fill={p.skin} />
    <path d="M206,286 L230,258 L236,350 Q220,360 206,362 Z" fill={p.skinShade} opacity={0.75} />
    <path d="M172,282 Q202,304 232,272 L233,296 Q202,320 172,302 Z" fill={p.skinShade} />

    {/* Rosto (sem traços: coberto por óculos/máscara) */}
    <path
      d="M156,176 L152,210 L143,232 L154,238 L156,256 Q166,284 196,296 Q221,290 237,266 L249,226 L253,190 L245,158 Z"
      fill={p.skin}
    />
    <path
      d="M222,164 L245,158 L253,190 L249,226 L237,266 Q221,290 196,296 Q212,272 218,240 Q224,204 222,164 Z"
      fill={p.skinShade}
      opacity={0.8}
    />

    <Rim p={p} d="M253,192 L249,226 L237,266 Q221,290 198,296" />
    <Rim p={p} d="M232,272 L236,350" w={2.5} />
  </g>
);

/* ───────────── ÓCULOS E MÁSCARAS ───────────── */

/** Reflexos da lente: faixa clara + faixa da cor da luz de recorte. */
const LensGlare = ({ p, clip }: ArtProps & { clip: string }) => (
  <g clipPath={`url(#${clip})`}>
    <path d="M120,240 L190,160 L206,160 L136,240 Z" fill="#ffffff" opacity={0.28} />
    <path d="M146,240 L216,160 L222,160 L152,240 Z" fill="#ffffff" opacity={0.18} />
    <path d="M200,240 L270,160 L290,160 L220,240 Z" fill={p.rim} opacity={0.45} />
  </g>
);

/** Óculos balísticos com tira elástica (operador e combatente). */
const TacticalGoggles = ({ p, lens }: ArtProps & { lens: string }) => {
  const lensPath =
    "M148,196 Q152,190 196,189 L236,189 Q242,190 242,198 L240,212 Q237,218 228,218 L208,218 Q200,208 190,218 L162,219 Q149,219 147,210 Z";
  const clip = `goggle-lens-${p.team}`;

  return (
    <g>
      {/* Tira */}
      <path d="M236,190 L266,186 L268,212 L240,216 Z" fill={p.clothDark} />
      <path d="M246,192 L262,190 M247,206 L264,204" stroke={p.cloth} strokeWidth={1.5} />
      {/* Armação */}
      <path
        d="M140,192 Q146,182 196,182 L238,182 Q250,184 250,198 L247,216 Q243,226 228,226 L208,226 Q200,216 190,226 L160,227 Q141,227 139,212 Z"
        fill={p.metalDark}
      />
      <clipPath id={clip}>
        <path d={lensPath} />
      </clipPath>
      <path d={lensPath} fill={lens} />
      <path d={lensPath} fill={p.bg0} opacity={0.35} />
      <LensGlare p={p} clip={clip} />
      <Rim p={p} d="M238,183 Q250,184 250,198 L247,216" w={2.5} />
      <path d="M142,191 Q150,183 196,183" stroke={p.metalLight} strokeWidth={1.5} fill="none" />
    </g>
  );
};

/** Óculos de tiro envolventes (atiradora). */
const ShootingGlasses = ({ p }: ArtProps) => {
  const lensPath =
    "M150,198 Q190,189 242,193 L241,208 Q234,217 216,215 Q202,206 193,216 Q170,221 156,214 Z";
  const clip = `shooting-lens-${p.team}`;

  return (
    <g>
      <path d="M238,195 L262,197" stroke={p.metalDark} strokeWidth={4} strokeLinecap="round" />
      <clipPath id={clip}>
        <path d={lensPath} />
      </clipPath>
      <path d={lensPath} fill={p.bg2} />
      <path d={lensPath} fill={p.accent} opacity={0.35} />
      <LensGlare p={p} clip={clip} />
      <path d={lensPath} fill="none" stroke={p.metalDark} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M151,197 Q190,188 242,192" stroke={p.rim} strokeWidth={1.8} fill="none" opacity={0.8} />
    </g>
  );
};

/** Óculos escuros redondos (batedora). */
const RoundShades = ({ p }: ArtProps) => {
  const clip = `shades-lens-${p.team}`;

  return (
    <g>
      <path d="M232,203 L262,200" stroke={p.metalLight} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M186,205 Q196,198 208,204" stroke={p.metalLight} strokeWidth={2.5} fill="none" />
      <clipPath id={clip}>
        <ellipse cx="168" cy="208" rx="20" ry="15" />
        <ellipse cx="221" cy="205" rx="13" ry="14" />
      </clipPath>
      <ellipse cx="168" cy="208" rx="20" ry="15" fill={p.eye} />
      <ellipse cx="221" cy="205" rx="13" ry="14" fill={p.eye} />
      <g clipPath={`url(#${clip})`}>
        <rect x="140" y="190" width="120" height="34" fill={p.streak} opacity={0.3} />
      </g>
      <LensGlare p={p} clip={clip} />
      <ellipse cx="168" cy="208" rx="20" ry="15" fill="none" stroke={p.metalLight} strokeWidth={2.5} />
      <ellipse cx="221" cy="205" rx="13" ry="14" fill="none" stroke={p.metalLight} strokeWidth={2.5} />
      <path d="M221,191 A13,14 0 0 1 234,205" stroke={p.rim} strokeWidth={2} fill="none" />
    </g>
  );
};

/** Balaclava: cobre do nariz ao pescoço (operador). */
const Balaclava = ({ p }: ArtProps) => (
  <g>
    <path
      d="M136,222 L252,214 L258,226 L253,262 L243,282 L240,356 Q202,380 162,354 L164,302 Q151,282 149,258 L134,236 Z"
      fill={p.cloth}
    />
    <path
      d="M214,218 L252,214 L258,226 L253,262 L243,282 L240,356 Q222,368 204,370 Q216,300 214,218 Z"
      fill={p.clothDark}
      opacity={0.75}
    />
    <path d="M150,226 L196,222 L190,250 L156,254 Z" fill={p.clothLight} opacity={0.45} />
    <path d="M140,236 Q196,228 252,232" stroke={p.clothDark} strokeWidth={2} fill="none" opacity={0.7} />
    <path d="M152,262 Q170,272 190,266" stroke={p.clothDark} strokeWidth={2} fill="none" opacity={0.6} />
    <path d="M166,302 Q200,318 240,300" stroke={p.clothDark} strokeWidth={2} fill="none" opacity={0.6} />
    <Rim p={p} d="M258,226 L253,262 L243,282 L240,354" />
  </g>
);

/** Gola tática puxada sobre o nariz (atiradora). */
const NeckGaiter = ({ p }: ArtProps) => (
  <g>
    <path
      d="M140,226 Q198,214 252,224 L250,266 L238,354 Q204,376 168,352 L170,302 Q151,284 146,252 Z"
      fill={p.cloth}
    />
    <path
      d="M210,218 Q234,219 252,224 L250,266 L238,354 Q222,366 206,368 Q220,300 210,218 Z"
      fill={p.clothDark}
      opacity={0.7}
    />
    <path d="M146,250 Q198,240 250,248" stroke={p.clothDark} strokeWidth={2.5} fill="none" opacity={0.7} />
    <path d="M156,282 Q200,276 246,284" stroke={p.clothDark} strokeWidth={2.5} fill="none" opacity={0.6} />
    <path d="M170,320 Q204,330 240,318" stroke={p.clothDark} strokeWidth={2.5} fill="none" opacity={0.6} />
    <Rim p={p} d="M252,226 L250,266 L238,352" />
  </g>
);

const Headset = ({ p, cx = 270, cy = 222 }: ArtProps & { cx?: number; cy?: number }) => (
  <g>
    <path
      d={`M${cx - 14},${cy + 20} Q${cx - 40},${cy + 62} ${cx - 92},${cy + 60}`}
      fill="none"
      stroke={p.metalDark}
      strokeWidth={5}
      strokeLinecap="round"
    />
    <ellipse cx={cx - 96} cy={cy + 60} rx="8" ry="6" fill={p.metal} />
    <ellipse cx={cx} cy={cy} rx="23" ry="29" fill={p.metalDark} />
    <ellipse cx={cx - 3} cy={cy} rx="14" ry="20" fill={p.metal} />
    <rect x={cx - 6} y={cy - 6} width="6" height="12" rx="2" fill={p.accent} />
    <Rim p={p} d={`M${cx + 6},${cy - 28} A23,29 0 0 1 ${cx + 12},${cy + 24}`} w={2.5} />
  </g>
);

/* ───────────── POLÍCIA ───────────── */

export const PoliceOperator = ({ p, flip }: CharacterProps) => (
  <g>
    {/* Uniforme */}
    <path
      d="M16,500 L28,420 Q44,372 110,352 L162,338 L240,338 L292,352 Q358,372 374,420 L388,500 Z"
      fill={p.clothDark}
    />
    <path d="M150,350 L176,334 L200,374 L224,334 L252,350 L238,374 L200,394 L162,374 Z" fill={p.cloth} />

    {/* Colete */}
    <path
      d="M66,500 L80,404 Q94,372 140,360 L162,354 Q200,392 240,354 L262,360 Q308,372 322,404 L336,500 Z"
      fill={p.cloth}
    />
    <path
      d="M200,384 Q224,378 240,354 L262,360 Q308,372 322,404 L336,500 L200,500 Z"
      fill={p.clothDark}
      opacity={0.6}
    />
    <rect x="104" y="408" width="84" height="22" rx="2" fill={p.accent} />
    <text
      x="146"
      y="424.5"
      fontSize="14"
      fontWeight={900}
      textAnchor="middle"
      fill={p.bg0}
      fontFamily="ui-monospace, monospace"
      letterSpacing="2"
      transform={flip ? "translate(292 0) scale(-1 1)" : undefined}
    >
      POLÍCIA
    </text>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={96 + i * 46} y="446" width="40" height="54" rx="4" fill={i === 2 ? p.clothDark : p.clothLight} />
        <rect x={96 + i * 46} y="446" width="40" height="14" rx="3" fill={p.clothDark} />
        <rect x={110 + i * 46} y="450" width="12" height="5" rx="1" fill={p.metal} />
      </g>
    ))}
    <rect x="244" y="400" width="44" height="30" rx="3" fill={p.clothLight} opacity={0.6} />
    <path d="M250,410 L282,410 M250,418 L276,418" stroke={p.clothDark} strokeWidth={2} />

    {/* Rádio */}
    <rect x="94" y="338" width="16" height="46" rx="3" fill={p.metalDark} />
    <path d="M102,338 L98,272" stroke={p.metalDark} strokeWidth={3.5} strokeLinecap="round" />
    <circle cx="98" cy="270" r="3.5" fill={p.accent} />

    <MaleFace p={p} />
    <Balaclava p={p} />
    <TacticalGoggles p={p} lens={p.bg2} />
    <Headset p={p} cx={268} cy={224} />

    {/* Capacete */}
    <path
      d="M138,180 Q126,98 206,86 Q288,86 288,176 L284,222 L262,224 L258,184 Q206,164 146,182 Z"
      fill={p.clothLight}
    />
    <path
      d="M206,86 Q288,86 288,176 L284,222 L262,224 L258,184 Q242,176 228,172 Q262,120 206,86 Z"
      fill={p.cloth}
    />
    <path d="M140,178 Q206,160 262,182 L262,190 Q206,170 142,188 Z" fill={p.clothDark} />
    <path d="M226,168 L286,162 L286,178 L228,184 Z" fill={p.clothDark} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={234 + i * 12} y={169 - i * 1.2} width="6" height="6" fill={p.metal} />
    ))}
    <path d="M160,118 L194,108 L200,146 L166,152 Z" fill={p.metalDark} />
    <path d="M166,122 L190,115 L194,140 L170,145 Z" fill={p.metal} />
    <path d="M170,104 Q190,96 214,98" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.12} fill="none" />

    {/* Jugular */}
    <path d="M262,224 Q258,272 220,300" fill="none" stroke={p.clothDark} strokeWidth={7} strokeLinecap="round" />

    <Rim p={p} d="M208,86 Q288,86 288,176 L284,220" w={3.5} />
    <Rim p={p} d="M262,360 Q308,372 322,404 L334,498" />
    <Rim p={p} d="M292,352 Q358,372 374,420 L386,498" w={2} o={0.6} />
  </g>
);

export const PoliceSniper = ({ p }: ArtProps) => (
  <g>
    {/* Rifle nas costas */}
    <path d="M318,500 L342,500 L394,292 L380,288 Z" fill={p.metalDark} />
    <path d="M366,330 L384,334 L376,368 L358,364 Z" fill={p.metal} />
    <path d="M380,288 L394,292 L398,276 L384,272 Z" fill={p.metal} />
    <Rim p={p} d="M342,498 L394,292" w={2} />

    {/* Cabelo atrás + rabo de cavalo */}
    <path d="M150,162 Q150,110 206,104 Q262,106 262,170 L268,250 Q276,296 296,328 Q264,320 250,290 L248,226 Z" fill={p.hair} />
    <path d="M254,166 Q300,166 314,218 Q322,272 298,316 Q302,262 284,226 Q272,202 252,198 Z" fill={p.hair} />
    <Rim p={p} d="M262,170 Q302,170 314,220 Q320,270 300,312" w={2.5} />

    {/* Jaqueta tática */}
    <path
      d="M36,500 L50,430 Q70,384 130,366 L170,350 L236,350 L276,366 Q338,384 352,430 L366,500 Z"
      fill={p.clothDark}
    />
    <path
      d="M200,370 L236,350 L276,366 Q338,384 352,430 L366,500 L200,500 Z"
      fill={p.cloth}
      opacity={0.45}
    />
    <path d="M200,372 L200,500" stroke={p.metal} strokeWidth={3} />
    <path d="M164,342 L170,374 Q204,394 240,374 L240,338 Q204,356 164,342 Z" fill={p.cloth} />
    {/* Bandoleira */}
    <path d="M112,382 L322,500 L296,500 L104,398 Z" fill={p.metalDark} />
    <rect x="186" y="430" width="22" height="14" rx="2" fill={p.metal} transform="rotate(29 197 437)" />
    {/* Distintivo */}
    <path d="M110,420 L132,414 L136,440 L122,452 L108,442 Z" fill={p.accent} />
    <path d="M114,424 L128,420 L130,438 L122,445 L113,439 Z" fill={p.bg1} opacity={0.5} />

    <FemaleFace p={p} />
    <NeckGaiter p={p} />
    <ShootingGlasses p={p} />

    {/* Mecha solta */}
    <path d="M154,190 Q146,214 150,236" stroke={p.hair} strokeWidth={4} fill="none" strokeLinecap="round" />

    {/* Boné */}
    <path d="M146,172 Q142,104 208,100 Q266,102 266,166 Q210,152 146,172 Z" fill={p.clothLight} />
    <path d="M208,100 Q266,102 266,166 Q246,160 228,158 Q252,124 208,100 Z" fill={p.cloth} />
    <path d="M148,168 Q110,170 90,186 Q122,194 162,186 Q194,178 224,170 L212,158 Z" fill={p.clothDark} />
    <path d="M92,186 Q122,194 162,186 Q194,178 224,170" stroke={p.rim} strokeWidth={1.5} fill="none" opacity={0.5} />
    <rect x="170" y="128" width="40" height="16" rx="2" fill={p.accent} transform="rotate(-6 190 136)" />
    <circle cx="208" cy="104" r="4" fill={p.clothDark} />

    <Headset p={p} cx={262} cy={220} />

    <Rim p={p} d="M210,100 Q266,102 266,164" w={3} />
    <Rim p={p} d="M276,366 Q338,384 352,430 L364,498" />
  </g>
);

/* ───────────── FACÇÃO ───────────── */

const Keffiyeh = ({ p, d }: ArtProps & { d: string }) => (
  <g>
    <path d={d} fill={p.clothLight} />
    <clipPath id={`kef-${p.team}`}>
      <path d={d} />
    </clipPath>
    <g clipPath={`url(#kef-${p.team})`} opacity={0.35}>
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={`a${i}`} d={`M${100 + i * 12},180 L${40 + i * 12},420`} stroke={p.clothDark} strokeWidth={2} />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={`b${i}`} d={`M${40 + i * 12},180 L${100 + i * 12},420`} stroke={p.clothDark} strokeWidth={2} />
      ))}
    </g>
  </g>
);

export const FactionRaider = ({ p }: ArtProps) => {
  const wrap =
    "M134,226 Q150,212 200,216 Q252,212 264,230 L268,292 Q252,334 200,340 Q148,332 136,298 Z";

  return (
    <g>
      {/* Jaqueta */}
      <path
        d="M14,500 L26,420 Q42,372 108,352 L160,338 L242,338 L294,352 Q360,372 376,420 L390,500 Z"
        fill={p.cloth}
      />
      <path
        d="M200,360 L242,338 L294,352 Q360,372 376,420 L390,500 L200,500 Z"
        fill={p.clothDark}
        opacity={0.7}
      />
      <path d="M136,346 L170,402 L150,500 M266,346 L232,402 L252,500" stroke={p.clothDark} strokeWidth={4} fill="none" />

      {/* Bandoleira de munição */}
      <path d="M88,362 L132,352 L330,500 L270,500 Z" fill={p.woodDark} />
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i} transform={`translate(${118 + i * 22} ${372 + i * 15}) rotate(37)`}>
          <rect x="-5" y="-14" width="10" height="24" rx="2" fill={p.metalLight} />
          <rect x="-5" y="-14" width="10" height="8" rx="4" fill="#d9a35a" />
        </g>
      ))}

      <MaleFace p={p} />

      {/* Shemagh */}
      <Keffiyeh p={p} d={wrap} />
      <path d="M200,216 Q252,212 264,230 L268,292 Q252,334 200,340 Q236,300 232,248 Z" fill={p.cloth} opacity={0.6} />
      <path d="M144,248 Q200,236 258,250 M142,276 Q200,266 262,280 M152,306 Q200,300 254,310" stroke={p.cloth} strokeWidth={3} fill="none" />
      <path d="M140,296 Q118,344 126,404 L160,398 Q150,346 172,322 Z" fill={p.clothLight} />
      <path d="M126,404 L160,398" stroke={p.clothDark} strokeWidth={3} strokeDasharray="3 3" />

      <TacticalGoggles p={p} lens={p.accent} />

      {/* Gorro */}
      <path d="M140,184 Q132,102 206,94 Q282,96 278,188 Q208,166 140,184 Z" fill={p.clothDark} />
      <path d="M206,94 Q282,96 278,188 Q256,180 236,176 Q262,126 206,94 Z" fill={p.hair} opacity={0.6} />
      <path d="M138,186 Q206,164 280,188 L278,166 Q206,146 140,164 Z" fill={p.cloth} />
      {Array.from({ length: 14 }).map((_, i) => (
        <path
          key={i}
          d={`M${146 + i * 9.5},${Math.round(168 - Math.sin((i / 13) * Math.PI) * 14)} l0,16`}
          stroke={p.clothDark}
          strokeWidth={2}
        />
      ))}

      <Rim p={p} d="M208,94 Q282,96 278,186" w={3.5} />
      <Rim p={p} d="M264,232 L268,292 Q252,334 204,340" w={2.5} />
      <Rim p={p} d="M294,352 Q360,372 376,420 L388,498" />
    </g>
  );
};

export const FactionScout = ({ p }: ArtProps) => (
  <g>
    {/* Cabelo atrás (chanel) */}
    <path
      d="M136,196 Q128,100 206,96 Q286,98 284,200 L288,270 Q270,284 248,272 L246,210 Q206,160 152,212 L150,256 Q136,256 130,240 Z"
      fill={p.hair}
    />

    {/* Moletom */}
    <path
      d="M34,500 L48,430 Q68,384 128,366 L168,350 L238,350 L278,366 Q340,384 354,430 L368,500 Z"
      fill={p.cloth}
    />
    <path
      d="M200,372 L238,350 L278,366 Q340,384 354,430 L368,500 L200,500 Z"
      fill={p.clothDark}
      opacity={0.7}
    />
    <path d="M112,384 Q200,330 296,382 L304,410 Q200,364 104,412 Z" fill={p.clothLight} />
    <path d="M178,410 L182,470 M222,410 L218,470" stroke={p.metalLight} strokeWidth={3} strokeLinecap="round" />
    <circle cx="182" cy="474" r="4" fill={p.metalLight} />
    <circle cx="218" cy="474" r="4" fill={p.metalLight} />
    {/* Rádio no peito */}
    <rect x="266" y="414" width="22" height="40" rx="3" fill={p.metalDark} />
    <rect x="270" y="420" width="14" height="8" rx="1" fill={p.accent} opacity={0.8} />

    <FemaleFace p={p} />

    {/* Bandana */}
    <path
      d="M140,230 Q200,220 258,232 L258,280 Q234,320 196,322 Q158,314 144,284 Z"
      fill={p.wood}
    />
    <path d="M200,222 Q236,224 258,232 L258,280 Q234,320 196,322 Q228,290 226,240 Z" fill={p.woodDark} />
    {[
      [160, 254],
      [184, 246],
      [176, 280],
      [204, 268],
      [196, 300],
      [222, 292],
      [232, 256],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="3.4" fill={p.skinLight} opacity={0.35} />
    ))}
    <path d="M146,252 Q200,240 256,254" stroke={p.woodDark} strokeWidth={2.5} fill="none" />
    <path d="M256,236 L282,238 L300,262 L280,256 L290,282 L268,258 Z" fill={p.wood} />

    <RoundShades p={p} />

    {/* Franja */}
    <path d="M144,198 Q170,140 240,148 Q256,170 256,200 Q214,164 180,182 Q160,192 144,198 Z" fill={p.hair} />
    <path d="M188,152 Q222,146 240,150" stroke={p.rim} strokeWidth={2} fill="none" opacity={0.6} />
    <g stroke={p.rim} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.28}>
      <path d="M160,186 Q186,156 226,154" />
      <path d="M176,178 Q204,160 244,166" />
      <path d="M150,120 Q176,104 214,104" />
      <path d="M266,140 Q278,200 276,262" />
      <path d="M254,172 Q262,214 260,262" />
    </g>
    <path d="M144,198 L136,232 L148,214 L150,240 L156,206 Z" fill={p.hair} />

    {/* Brinco */}
    <circle cx="262" cy="244" r="5" fill="none" stroke={p.rim} strokeWidth={2} />

    <Rim p={p} d="M208,96 Q286,98 284,200 L288,268" w={3.5} />
    <Rim p={p} d="M258,234 L258,280 Q234,320 200,322" w={2.5} />
    <Rim p={p} d="M278,366 Q340,384 354,430 L366,498" />
  </g>
);

export const TEAM_CHARACTERS: Record<
  TeamName,
  [(props: CharacterProps) => React.ReactElement, (props: CharacterProps) => React.ReactElement]
> = {
  police: [PoliceOperator, PoliceSniper],
  faction: [FactionRaider, FactionScout],
};
