import { ArtPalette } from "./palette";

/* ═══════════════════════════════════════════════
   ITEM ILLUSTRATIONS
   Cada arte é desenhada no próprio sistema de
   coordenadas; `ITEM_ART` define como encaixar
   cada uma na área de arte da carta.
   ═══════════════════════════════════════════════ */

type ArtProps = { p: ArtPalette };

/** Arredonda coordenadas calculadas para o SSR bater com o cliente. */
const r2 = (n: number) => Math.round(n * 100) / 100;

const Rim = ({
  d,
  p,
  w = 2.5,
  o = 1,
}: {
  d: string;
  p: ArtPalette;
  w?: number;
  o?: number;
}) => (
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

/* ───────────── RIFLES ───────────── */

const AK47 = ({ p }: ArtProps) => (
  <g>
    {/* Coronha */}
    <path d="M2,44 L72,32 L80,50 L72,64 L8,76 Q2,74 2,68 Z" fill={p.wood} />
    <path d="M4,62 L76,55 L72,64 L8,76 Q2,74 2,68 Z" fill={p.woodDark} />
    <path d="M0,42 L8,41 L10,76 L0,74 Z" fill={p.metalDark} />
    <path d="M18,50 L64,42" stroke={p.rim} strokeWidth={1} opacity={0.25} />
    <path d="M20,58 L60,52" stroke={p.rim} strokeWidth={1} opacity={0.15} />

    {/* Receptor */}
    <path d="M72,30 L154,28 L154,54 L80,56 L76,48 Z" fill={p.metal} />
    <path d="M72,30 L154,28 L154,34 L74,36 Z" fill={p.metalLight} />
    <path d="M84,44 L148,43" stroke={p.metalDark} strokeWidth={2} />
    <path d="M136,22 L150,22 L152,28 L134,28 Z" fill={p.metalDark} />
    <circle cx="146" cy="40" r="3" fill={p.metalDark} />

    {/* Empunhadura e gatilho */}
    <path d="M96,54 L114,54 L108,86 Q100,90 90,84 Z" fill={p.woodDark} />
    <path
      d="M114,55 Q116,72 130,70 L131,56"
      fill="none"
      stroke={p.metalDark}
      strokeWidth={3.5}
    />
    <path d="M119,56 Q123,61 120,66" stroke={p.metalLight} strokeWidth={2} fill="none" />

    {/* Carregador curvo */}
    <path d="M124,54 L144,54 Q148,74 162,94 L144,100 Q130,80 124,54 Z" fill={p.metalDark} />
    <path d="M131,62 L146,60 M135,74 L151,71 M141,85 L156,82" stroke={p.metal} strokeWidth={2} />

    {/* Guarda-mão */}
    <path d="M154,36 L200,38 L200,54 L154,54 Z" fill={p.wood} />
    <path d="M154,48 L200,48 L200,54 L154,54 Z" fill={p.woodDark} />
    <path d="M154,25 L204,28 L204,36 L154,35 Z" fill={p.wood} />
    <path d="M154,32 L204,33 L204,36 L154,35 Z" fill={p.woodDark} />

    {/* Cano */}
    <path d="M200,40 L250,40 L250,46 L200,46 Z" fill={p.metalDark} />
    <path d="M204,27 L215,27 L215,41 L204,41 Z" fill={p.metal} />
    <path d="M232,30 L239,30 L241,40 L231,40 Z" fill={p.metal} />
    <path d="M248,36 L262,36 L262,49 L248,49 Z" fill={p.metal} />

    <Rim p={p} d="M4,44 L72,32" />
    <Rim p={p} d="M74,30 L154,28" />
    <Rim p={p} d="M155,25 L204,28" />
    <Rim p={p} d="M206,27 L215,27" w={2} />
    <Rim p={p} d="M217,40 L248,40" w={1.6} />
    <Rim p={p} d="M249,36 L262,36 L262,48" w={2} />
    <Rim p={p} d="M144,54 Q148,74 162,94" w={1.8} o={0.8} />
  </g>
);

const M4A1 = ({ p }: ArtProps) => (
  <g>
    {/* Coronha retrátil */}
    <path d="M52,40 L82,40 L82,51 L52,51 Z" fill={p.metalDark} />
    <path d="M0,37 L50,35 L56,43 L56,60 L50,62 L6,70 L0,68 Z" fill={p.metal} />
    <path d="M2,57 L56,53 L56,60 L50,62 L6,70 L0,68 Z" fill={p.metalDark} />
    <path d="M14,46 L42,44 L42,52 L14,55 Z" fill={p.metalDark} />

    {/* Receptor inferior */}
    <path d="M78,40 L152,40 L152,58 L86,60 Z" fill={p.metal} />
    <path d="M90,48 L116,48 L116,54 L90,55 Z" fill={p.metalDark} />

    {/* Receptor superior + trilho */}
    <path d="M78,28 L158,28 L158,42 L78,42 Z" fill={p.metalLight} />
    <path d="M78,36 L158,36 L158,42 L78,42 Z" fill={p.metal} />
    <rect x="82" y="22" width="74" height="6" fill={p.metalDark} />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={84 + i * 6} y="22" width="3" height="3" fill={p.metal} />
    ))}
    <path d="M86,13 L100,13 L103,22 L84,22 Z" fill={p.metalDark} />
    <rect x="126" y="31" width="22" height="5" rx="1" fill={p.metalDark} />

    {/* Empunhadura */}
    <path d="M96,58 L112,58 L106,90 Q98,94 88,88 Z" fill={p.metalDark} />
    <path
      d="M112,59 Q114,74 128,72 L130,59"
      fill="none"
      stroke={p.metalDark}
      strokeWidth={3.5}
    />

    {/* Carregador */}
    <path d="M124,58 L142,58 Q146,78 154,96 L136,100 Q128,80 124,58 Z" fill={p.metalDark} />
    <path d="M128,66 L143,65 M131,78 L147,76 M134,89 L151,87" stroke={p.metal} strokeWidth={2} />

    {/* Guarda-mão com trilho */}
    <path d="M158,26 L216,26 L216,48 L158,48 Z" fill={p.metal} />
    <path d="M158,42 L216,42 L216,48 L158,48 Z" fill={p.metalDark} />
    <rect x="158" y="21" width="58" height="5" fill={p.metalDark} />
    {Array.from({ length: 5 }).map((_, i) => (
      <rect
        key={i}
        x={163 + i * 10}
        y="31"
        width="6"
        height="7"
        rx="1.5"
        fill={p.metalDark}
      />
    ))}
    <path d="M204,9 L212,9 L216,21 L200,21 Z" fill={p.metalDark} />

    {/* Cano e quebra-chamas */}
    <path d="M216,34 L254,34 L254,40 L216,40 Z" fill={p.metalDark} />
    <path d="M252,30 L270,30 L270,44 L252,44 Z" fill={p.metal} />
    <path d="M257,33 L257,41 M262,33 L262,41" stroke={p.metalDark} strokeWidth={1.5} />

    <Rim p={p} d="M1,37 L50,35" />
    <Rim p={p} d="M79,28 L158,28" />
    <Rim p={p} d="M159,21 L216,21" />
    <Rim p={p} d="M87,13 L100,13" w={2} />
    <Rim p={p} d="M205,9 L212,9" w={2} />
    <Rim p={p} d="M217,34 L252,34" w={1.5} />
    <Rim p={p} d="M253,30 L270,30 L270,43" w={2} />
    <Rim p={p} d="M142,58 Q146,78 154,96" w={1.6} o={0.7} />
  </g>
);

const AWP = ({ p }: ArtProps) => (
  <g>
    {/* Coronha com furo */}
    <path
      d="M0,50 L20,44 L92,44 L106,52 L106,70 L88,72 Q78,60 64,64 Q54,76 60,88 L10,92 L0,90 Z"
      fill={p.clothLight}
    />
    <path d="M2,76 L60,74 Q58,82 60,88 L10,92 L0,90 Z" fill={p.cloth} />
    <ellipse cx="74" cy="74" rx="11" ry="7" fill={p.bg1} />
    <path d="M0,48 L8,46 L8,92 L0,90 Z" fill={p.metalDark} />

    {/* Ação */}
    <path d="M102,44 L184,44 L184,64 L106,66 Z" fill={p.clothLight} />
    <path d="M104,58 L184,57 L184,64 L106,66 Z" fill={p.cloth} />
    <path d="M114,66 Q118,84 134,82 L136,66" fill="none" stroke={p.metalDark} strokeWidth={3.5} />
    <path d="M142,64 L160,64 L158,80 L144,80 Z" fill={p.metalDark} />
    <path d="M152,44 L164,32" stroke={p.metal} strokeWidth={4} strokeLinecap="round" />
    <circle cx="166" cy="30" r="5.5" fill={p.metal} />

    {/* Luneta */}
    <rect x="118" y="34" width="8" height="10" fill={p.metalDark} />
    <rect x="160" y="34" width="8" height="10" fill={p.metalDark} />
    <path d="M86,20 L104,22 L104,38 L86,40 Z" fill={p.metal} />
    <path d="M102,24 L200,24 L200,37 L102,37 Z" fill={p.metalDark} />
    <path d="M102,24 L200,24 L200,28 L102,28 Z" fill={p.metal} />
    <rect x="140" y="14" width="11" height="10" fill={p.metal} />
    <path d="M196,18 L224,15 L224,46 L196,42 Z" fill={p.metal} />
    <ellipse cx="224" cy="30.5" rx="3.5" ry="14" fill={p.accent} />
    <ellipse cx="225" cy="26" rx="1.5" ry="6" fill="#ffffff" opacity={0.7} />

    {/* Guarda-mão e cano */}
    <path d="M184,46 L234,48 L234,60 L184,62 Z" fill={p.clothLight} />
    <path d="M184,56 L234,56 L234,60 L184,62 Z" fill={p.cloth} />
    <path d="M232,49 L288,49 L288,55 L232,55 Z" fill={p.metalDark} />
    <path d="M284,44 L300,44 L300,60 L284,60 Z" fill={p.metal} />
    <path d="M289,47 L289,57 M294,47 L294,57" stroke={p.metalDark} strokeWidth={1.8} />

    <Rim p={p} d="M1,49 L20,44 L92,44" />
    <Rim p={p} d="M103,44 L184,44" />
    <Rim p={p} d="M87,20 L104,22 L200,24" />
    <Rim p={p} d="M197,18 L224,15" />
    <Rim p={p} d="M141,14 L151,14" w={2} />
    <Rim p={p} d="M185,46 L234,48" />
    <Rim p={p} d="M235,49 L284,49" w={1.5} />
    <Rim p={p} d="M285,44 L300,44 L300,59" w={2} />
  </g>
);

/* ───────────── PISTOLAS ───────────── */

const DesertEagle = ({ p }: ArtProps) => (
  <g>
    <path d="M8,22 L2,13 L11,11 L17,20 Z" fill={p.metal} />
    {/* Ferrolho */}
    <path d="M10,20 L160,20 L165,26 L165,47 L14,47 L10,41 Z" fill={p.metal} />
    <path d="M10,20 L160,20 L163,25 L12,25 Z" fill={p.metalLight} />
    <path d="M14,40 L165,40 L165,47 L14,47 Z" fill={p.metalDark} />
    {Array.from({ length: 6 }).map((_, i) => (
      <path
        key={i}
        d={`M${20 + i * 5},27 L${20 + i * 5},39`}
        stroke={p.metalDark}
        strokeWidth={2}
      />
    ))}
    <path d="M70,28 L104,28 L104,36 L70,36 Z" fill={p.metalDark} />
    <path d="M150,13 L158,13 L159,20 L149,20 Z" fill={p.metalDark} />
    <rect x="160" y="28" width="8" height="10" fill={p.metalDark} />

    {/* Armação */}
    <path d="M28,47 L142,47 L142,57 L56,59 Z" fill={p.metalDark} />
    <path
      d="M64,57 Q66,84 92,82 L97,57"
      fill="none"
      stroke={p.metal}
      strokeWidth={5}
    />
    <path d="M74,59 Q81,67 76,74" stroke={p.metalLight} strokeWidth={3} fill="none" />

    {/* Empunhadura */}
    <path d="M26,50 L64,52 L58,113 Q44,119 20,111 L17,104 Z" fill={p.metalDark} />
    <path d="M30,60 L56,61 L52,104 Q42,108 26,103 Z" fill={p.clothDark} />
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d={`M${31 - i * 0.6},${68 + i * 8} L${54 - i * 0.6},${69 + i * 8}`}
        stroke={p.metal}
        strokeWidth={1.4}
        opacity={0.7}
      />
    ))}

    <Rim p={p} d="M11,20 L160,20 L165,26" />
    <Rim p={p} d="M165,27 L165,46" w={2} o={0.8} />
    <Rim p={p} d="M151,13 L158,13" w={1.6} />
    <Rim p={p} d="M64,53 L58,112" w={1.6} o={0.7} />
  </g>
);

const Glock = ({ p }: ArtProps) => (
  <g>
    {/* Ferrolho */}
    <path d="M8,18 L142,18 L146,23 L146,43 L8,43 Z" fill={p.metal} />
    <path d="M8,18 L142,18 L145,22 L8,22 Z" fill={p.metalLight} />
    <path d="M8,37 L146,37 L146,43 L8,43 Z" fill={p.metalDark} />
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d={`M${16 + i * 5},24 L${16 + i * 5},36`}
        stroke={p.metalDark}
        strokeWidth={2}
      />
    ))}
    <path d="M70,24 L100,24 L100,32 L70,32 Z" fill={p.metalDark} />
    <path d="M12,12 L22,12 L22,18 L12,18 Z" fill={p.metalDark} />
    <path d="M134,13 L140,13 L140,18 L134,18 Z" fill={p.metalDark} />

    {/* Armação */}
    <path d="M20,43 L140,43 L140,53 L52,55 Z" fill={p.metalDark} />
    <path d="M100,46 L136,46" stroke={p.metal} strokeWidth={2} />
    <path
      d="M58,53 L60,72 Q62,77 70,77 L88,77 L93,53"
      fill="none"
      stroke={p.metalDark}
      strokeWidth={5}
    />
    <path d="M68,55 Q74,62 70,68" stroke={p.metalLight} strokeWidth={3} fill="none" />

    {/* Empunhadura texturizada */}
    <path d="M18,46 L58,48 L50,105 Q36,111 13,103 Z" fill={p.metalDark} />
    <path d="M24,58 L52,59 L47,98 Q36,101 21,97 Z" fill={p.metal} opacity={0.55} />
    {Array.from({ length: 4 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) => (
        <rect
          key={`${row}-${col}`}
          x={26 + col * 5 - row * 0.8}
          y={64 + row * 8}
          width="2.2"
          height="2.2"
          fill={p.metalDark}
        />
      )),
    )}

    <Rim p={p} d="M9,18 L142,18 L146,23" />
    <Rim p={p} d="M146,24 L146,42" w={2} o={0.8} />
    <Rim p={p} d="M57,50 L50,104" w={1.6} o={0.7} />
  </g>
);

const USP = ({ p }: ArtProps) => (
  <g>
    {/* Silenciador */}
    <path
      d="M134,23 L234,23 Q240,23 240,30 L240,41 Q240,48 234,48 L134,48 Z"
      fill={p.metalDark}
    />
    <path d="M134,23 L234,23 Q240,23 240,30 L134,30 Z" fill={p.metal} />
    <path d="M160,23 L160,48 M210,23 L210,48" stroke={p.metal} strokeWidth={1.5} />

    {/* Ferrolho */}
    <path d="M8,20 L132,20 Q138,20 138,26 L138,44 L8,44 Z" fill={p.metal} />
    <path d="M8,20 L132,20 Q136,20 137,24 L8,24 Z" fill={p.metalLight} />
    <path d="M8,38 L138,38 L138,44 L8,44 Z" fill={p.metalDark} />
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d={`M${16 + i * 5},26 L${16 + i * 5},37`}
        stroke={p.metalDark}
        strokeWidth={2}
      />
    ))}
    <path d="M64,26 L94,26 L94,33 L64,33 Z" fill={p.metalDark} />
    <path d="M6,22 L0,14 L8,12 L14,20 Z" fill={p.metal} />

    {/* Armação e empunhadura */}
    <path d="M20,44 L132,44 L132,54 L52,56 Z" fill={p.metalDark} />
    <path
      d="M58,54 Q58,78 76,78 L88,78 L92,54"
      fill="none"
      stroke={p.metalDark}
      strokeWidth={5}
    />
    <path d="M68,56 Q74,63 70,69" stroke={p.metalLight} strokeWidth={3} fill="none" />
    <path d="M18,47 L58,49 Q54,80 50,106 Q36,112 13,104 Z" fill={p.metalDark} />
    <path d="M25,59 L51,60 L47,98 Q36,101 22,97 Z" fill={p.clothDark} />

    <Rim p={p} d="M9,20 L132,20 Q138,20 138,26" />
    <Rim p={p} d="M135,23 L234,23 Q240,23 240,30 L240,40" />
    <Rim p={p} d="M57,52 L50,104" w={1.6} o={0.7} />
  </g>
);

/* ───────────── GRANADAS ───────────── */

const GrenadeTop = ({ p, x = 70 }: ArtProps & { x?: number }) => (
  <g>
    <rect x={x - 14} y="36" width="28" height="20" rx="2" fill={p.metalLight} />
    <rect x={x - 18} y="29" width="36" height="9" rx="2" fill={p.metal} />
    <path
      d={`M${x + 14},34 L${x + 27},38 Q${x + 42},70 ${x + 43},112 L${x + 34},113 Q${x + 31},76 ${x + 18},46 Z`}
      fill={p.metalLight}
    />
    <path
      d={`M${x + 27},38 Q${x + 42},70 ${x + 43},112`}
      fill="none"
      stroke={p.rim}
      strokeWidth={2}
    />
    <circle cx={x - 26} cy="34" r="13" fill="none" stroke={p.metalLight} strokeWidth={4} />
    <path
      d={`M${x - 26},21 A13,13 0 0 1 ${x - 13},34`}
      fill="none"
      stroke={p.rim}
      strokeWidth={2}
    />
    <path d={`M${x - 14},34 L${x - 4},34`} stroke={p.metalLight} strokeWidth={3} />
    <Rim p={p} d={`M${x - 17},29 L${x + 17},29`} w={2} />
  </g>
);

const Grenade = ({ p }: ArtProps) => (
  <g>
    <ellipse cx="70" cy="104" rx="48" ry="56" fill={p.clothLight} />
    <path d="M70,48 A48,56 0 0 1 70,160 Q96,104 70,48 Z" fill={p.cloth} />
    <path d="M70,48 A48,56 0 0 0 70,160 Q56,104 70,48 Z" fill={p.clothLight} />
    {/* Gomos */}
    {[-30, -10, 10, 30].map((dy) => (
      <path
        key={dy}
        d={`M${r2(70 - Math.sqrt(1 - (dy / 56) ** 2) * 48)},${104 + dy} Q70,${110 + dy} ${r2(70 + Math.sqrt(1 - (dy / 56) ** 2) * 48)},${104 + dy}`}
        fill="none"
        stroke={p.clothDark}
        strokeWidth={3}
      />
    ))}
    <path d="M50,52 Q38,104 50,157" fill="none" stroke={p.clothDark} strokeWidth={3} />
    <path d="M90,52 Q102,104 90,157" fill="none" stroke={p.clothDark} strokeWidth={3} />
    <path d="M70,48 L70,160" stroke={p.clothDark} strokeWidth={3} />
    <ellipse cx="44" cy="84" rx="8" ry="14" fill="#ffffff" opacity={0.12} />
    <Rim p={p} d="M100,62 A48,56 0 0 1 112,128" w={3} />
    <GrenadeTop p={p} />
  </g>
);

const Flashbang = ({ p }: ArtProps) => (
  <g>
    {/* Clarão */}
    {[70, 54, 38].map((r, i) => (
      <circle key={r} cx="70" cy="100" r={r} fill="#fff6d8" opacity={0.06 + i * 0.05} />
    ))}
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <path
          key={i}
          d={`M${r2(70 + Math.cos(a) * 58)},${r2(100 + Math.sin(a) * 58)} L${r2(70 + Math.cos(a) * 84)},${r2(100 + Math.sin(a) * 84)}`}
          stroke="#fff6d8"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.35}
        />
      );
    })}
    <rect x="42" y="54" width="56" height="104" rx="7" fill="#cfcbe0" />
    <path d="M74,54 L91,54 Q98,54 98,61 L98,151 Q98,158 91,158 L74,158 Z" fill="#8f8aa8" />
    <rect x="42" y="72" width="56" height="10" fill={p.accent} />
    <rect x="42" y="134" width="56" height="10" fill={p.accent} />
    {[92, 106, 120].map((y) =>
      [52, 64, 76, 88].map((x) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.5" ry="4.5" fill={p.metalDark} />
      )),
    )}
    <Rim p={p} d="M98,62 L98,150" w={3} />
    <GrenadeTop p={p} />
  </g>
);

const Smoke = ({ p }: ArtProps) => (
  <g>
    {/* Nuvem */}
    {[
      [30, 50, 30],
      [62, 28, 26],
      [96, 40, 28],
      [12, 86, 22],
      [118, 76, 20],
    ].map(([cx, cy, r], i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r={r} fill={p.metalLight} opacity={0.55} />
        <circle cx={cx + r * 0.25} cy={cy - r * 0.25} r={r * 0.6} fill="#d9d5ea" opacity={0.18} />
      </g>
    ))}
    <rect x="40" y="70" width="60" height="92" rx="8" fill={p.metal} />
    <path d="M76,70 L92,70 Q100,70 100,78 L100,154 Q100,162 92,162 L76,162 Z" fill={p.metalDark} />
    <rect x="40" y="104" width="60" height="22" fill="#b9b4cc" />
    <path d="M76,104 L100,104 L100,126 L76,126 Z" fill="#8a85a0" />
    <text
      x="56"
      y="120"
      fontSize="11"
      fontWeight={900}
      fill={p.metalDark}
      fontFamily="ui-monospace, monospace"
    >
      SMK
    </text>
    <rect x="54" y="56" width="32" height="16" rx="2" fill={p.metalLight} />
    <rect x="50" y="50" width="40" height="8" rx="2" fill={p.metal} />
    <Rim p={p} d="M100,78 L100,154" w={3} />
    <Rim p={p} d="M51,50 L89,50" w={2} />
  </g>
);

const Molotov = ({ p }: ArtProps) => (
  <g>
    {/* Chama */}
    <path
      d="M58,52 Q30,26 52,-6 Q54,18 70,20 Q64,-4 82,-22 Q84,10 100,22 Q108,4 104,-6 Q130,24 98,56 Z"
      fill="#ff4a1c"
    />
    <path d="M64,52 Q48,30 62,10 Q66,28 78,30 Q76,10 88,-2 Q90,22 102,30 Q106,44 94,56 Z" fill="#ff9c2e" />
    <path d="M72,54 Q64,40 72,28 Q76,38 84,38 Q84,26 90,20 Q98,38 90,54 Z" fill="#ffe7a0" />

    {/* Pano */}
    <path d="M66,46 L90,46 L94,64 L62,64 Z" fill={p.clothLight} />
    <path d="M78,46 L90,46 L94,64 L80,64 Z" fill={p.cloth} />
    <path d="M70,64 L64,84 L74,80 Z" fill={p.clothLight} />

    {/* Garrafa */}
    <path
      d="M66,62 L90,62 L90,86 Q114,96 114,124 L114,176 Q114,184 106,184 L50,184 Q42,184 42,176 L42,124 Q42,96 66,86 Z"
      fill={p.accent}
      opacity={0.3}
    />
    <path
      d="M44,126 Q78,118 112,126 L112,176 Q112,182 106,182 L50,182 Q44,182 44,176 Z"
      fill="#ff8a2a"
      opacity={0.75}
    />
    <path d="M44,126 Q78,118 112,126" fill="none" stroke="#ffd18a" strokeWidth={2} opacity={0.8} />
    <path d="M52,110 Q50,140 54,172" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.25} />
    <path
      d="M66,62 L90,62 L90,86 Q114,96 114,124 L114,176 Q114,184 106,184 L50,184 Q42,184 42,176 L42,124 Q42,96 66,86 Z"
      fill="none"
      stroke={p.metalLight}
      strokeWidth={2}
    />
    <Rim p={p} d="M90,86 Q114,96 114,124 L114,174" w={3} />
  </g>
);

/* ───────────── BOMBA / KIT ───────────── */

const C4 = ({ p }: ArtProps) => (
  <g>
    {/* Blocos */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={i * 64} y="54" width="62" height="74" rx="4" fill={p.clothLight} />
        <rect x={i * 64 + 40} y="54" width="22" height="74" rx="4" fill={p.cloth} />
        <Rim p={p} d={`M${i * 64 + 4},54 L${i * 64 + 58},54`} w={2} />
      </g>
    ))}
    <rect x="-4" y="70" width="198" height="10" fill={p.metalDark} />
    <rect x="-4" y="104" width="198" height="10" fill={p.metalDark} />

    {/* Fios */}
    <path d="M70,36 Q30,30 20,70" fill="none" stroke="#e33a3a" strokeWidth={4} />
    <path d="M120,36 Q168,28 172,72" fill="none" stroke="#3a7de3" strokeWidth={4} />
    <path d="M96,26 Q120,4 150,12" fill="none" stroke="#e3c53a" strokeWidth={4} />

    {/* Detonador */}
    <rect x="56" y="18" width="80" height="58" rx="5" fill={p.metalDark} />
    <rect x="56" y="18" width="80" height="6" rx="3" fill={p.metal} />
    <rect x="64" y="28" width="64" height="22" rx="2" fill="#1a0004" />
    <rect x="64" y="28" width="64" height="22" rx="2" fill="#ff2b2b" opacity={0.12} />
    <text
      x="96"
      y="45"
      fontSize="17"
      fontWeight={900}
      textAnchor="middle"
      fill="#ff3d3d"
      fontFamily="ui-monospace, monospace"
    >
      0:05
    </text>
    {[0, 1, 2, 3].map((c) =>
      [0, 1].map((r) => (
        <rect
          key={`${c}-${r}`}
          x={66 + c * 16}
          y={55 + r * 9}
          width="12"
          height="6"
          rx="1"
          fill={p.metal}
        />
      )),
    )}
    <circle cx="130" cy="58" r="3.5" fill="#ff3d3d" />
    <circle cx="130" cy="58" r="7" fill="#ff3d3d" opacity={0.25} />
    <path d="M128,18 L136,-8" stroke={p.metal} strokeWidth={3} strokeLinecap="round" />
    <Rim p={p} d="M58,18 L134,18" w={2} />
  </g>
);

const DefuseKit = ({ p }: ArtProps) => (
  <g>
    {/* Estojo */}
    <rect x="16" y="78" width="168" height="78" rx="12" fill={p.cloth} />
    <path d="M130,78 L172,78 Q184,78 184,90 L184,144 Q184,156 172,156 L130,156 Z" fill={p.clothDark} />
    <path d="M16,98 L184,98" stroke={p.metalLight} strokeWidth={3} strokeDasharray="4 3" />
    <rect x="86" y="92" width="18" height="12" rx="2" fill={p.metalLight} />
    <rect x="34" y="114" width="64" height="26" rx="3" fill={p.accent} opacity={0.85} />
    <text
      x="66"
      y="132"
      fontSize="13"
      fontWeight={900}
      textAnchor="middle"
      fill={p.bg0}
      fontFamily="ui-monospace, monospace"
    >
      DEFUSE
    </text>
    <Rim p={p} d="M28,78 L172,78 Q184,78 184,90 L184,140" w={2.5} />

    {/* Alicate */}
    <g transform="translate(100 60) rotate(-24)">
      <path d="M-8,-4 L-70,-14 Q-82,-12 -80,-2 L-12,8 Z" fill={p.accent} />
      <path d="M-8,4 L-66,22 Q-78,26 -78,16 L-12,-4 Z" fill={p.accent} />
      <path d="M-70,-14 Q-82,-12 -80,-2" fill="none" stroke={p.rim} strokeWidth={2} />
      <circle cx="0" cy="0" r="8" fill={p.metalLight} />
      <circle cx="0" cy="0" r="3" fill={p.metalDark} />
      <path d="M4,-6 L42,-12 L44,-6 L6,2 Z" fill={p.metalLight} />
      <path d="M4,6 L42,8 L42,2 L6,-2 Z" fill={p.metal} />
      <Rim p={p} d="M6,-6 L42,-12" w={2} />
    </g>
    <path d="M150,44 Q170,30 186,46" fill="none" stroke="#e33a3a" strokeWidth={4} strokeLinecap="round" />
    <path d="M148,58 Q160,72 182,62" fill="none" stroke="#3a7de3" strokeWidth={4} strokeLinecap="round" />
  </g>
);

/* ───────────── PROTEÇÃO ───────────── */

const Helmet = ({ p }: ArtProps) => (
  <g>
    <path
      d="M18,116 Q14,30 100,24 Q182,22 188,104 L190,124 L156,126 Q146,108 126,108 L44,112 Q34,124 18,116 Z"
      fill={p.clothLight}
    />
    <path
      d="M100,24 Q182,22 188,104 L190,124 L156,126 Q146,108 126,108 L120,108 Q160,70 100,24 Z"
      fill={p.cloth}
    />
    {/* Trilhos laterais */}
    <path d="M58,92 L160,86 L162,98 L60,104 Z" fill={p.clothDark} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={66 + i * 15} y={92 - i * 0.6} width="7" height="6" fill={p.metal} />
    ))}
    {/* Montagem NVG */}
    <path d="M20,64 L42,54 L50,80 L26,88 Z" fill={p.metalDark} />
    <path d="M24,68 L40,61 L44,76 L28,82 Z" fill={p.metal} />
    {/* Jugular */}
    <path d="M150,112 Q148,150 120,170" fill="none" stroke={p.clothDark} strokeWidth={8} strokeLinecap="round" />
    <path d="M58,110 Q64,148 96,170" fill="none" stroke={p.clothDark} strokeWidth={8} strokeLinecap="round" />
    <rect x="98" y="160" width="20" height="14" rx="3" fill={p.metalLight} />
    {/* Brilho */}
    <path d="M60,42 Q90,30 120,34" fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.12} />
    <Rim p={p} d="M100,24 Q182,22 188,104 L190,122" w={3} />
    <circle cx="140" cy="60" r="10" fill={p.accent} opacity={0.9} />
  </g>
);

const Vest = ({ p }: ArtProps) => (
  <g>
    <path
      d="M40,20 L76,20 Q86,46 100,46 Q114,46 124,20 L160,20 L166,66 Q150,80 152,104 L160,180 Q100,194 40,180 L48,104 Q50,80 34,66 Z"
      fill={p.clothLight}
    />
    <path
      d="M124,20 L160,20 L166,66 Q150,80 152,104 L160,180 Q130,187 100,188 L100,46 Q114,46 124,20 Z"
      fill={p.cloth}
    />
    {/* Placas */}
    <path d="M56,62 Q100,52 144,62 L140,108 Q100,116 60,108 Z" fill={p.clothDark} opacity={0.55} />
    <rect x="70" y="70" width="60" height="18" rx="2" fill={p.accent} />
    <text
      x="100"
      y="84"
      fontSize="11"
      fontWeight={900}
      textAnchor="middle"
      fill={p.bg0}
      fontFamily="ui-monospace, monospace"
      letterSpacing="1"
    >
      {p.team === "police" ? "POLICIA" : "FACCAO"}
    </text>
    {/* Porta-carregadores */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={56 + i * 30} y="122" width="26" height="40" rx="3" fill={i === 2 ? p.clothDark : p.cloth} />
        <rect x={56 + i * 30} y="122" width="26" height="10" rx="2" fill={p.clothDark} />
      </g>
    ))}
    <path d="M44,150 L156,150" stroke={p.clothDark} strokeWidth={3} />
    {/* Alças */}
    <path d="M44,20 L74,20 L72,40 L48,44 Z" fill={p.clothDark} />
    <path d="M126,20 L156,20 L152,44 L128,40 Z" fill={p.clothDark} />
    <Rim p={p} d="M124,21 L160,20 L166,66 Q150,80 152,104 L160,178" w={3} />
    <Rim p={p} d="M76,21 Q86,46 100,46 Q114,46 124,21" w={1.5} o={0.5} />
  </g>
);

/* ═══════════════════════════════════════════════
   REGISTRO
   transform: encaixe na área de arte (300x400)
   ═══════════════════════════════════════════════ */

type ItemArt = {
  Art: (props: ArtProps) => React.ReactElement;
  transform: string;
  /** Giro usado em `transform`: os efeitos do jogo desenham o item reto. */
  tilt: number;
};

export const ITEM_ART: Record<string, ItemArt> = {
  "AK-47": {
    Art: AK47,
    transform: "translate(150 172) rotate(-30) scale(1.14) translate(-131 -60)",
    tilt: -30,
  },
  M4A1: {
    Art: M4A1,
    transform: "translate(150 172) rotate(-30) scale(1.1) translate(-135 -55)",
    tilt: -30,
  },
  AWP: {
    Art: AWP,
    transform: "translate(150 172) rotate(-32) scale(1.0) translate(-150 -55)",
    tilt: -32,
  },
  "DESERT EAGLE": {
    Art: DesertEagle,
    transform: "translate(150 172) rotate(-14) scale(1.42) translate(-84 -64)",
    tilt: -14,
  },
  GLOCK: {
    Art: Glock,
    transform: "translate(150 172) rotate(-14) scale(1.5) translate(-78 -62)",
    tilt: -14,
  },
  USP: {
    Art: USP,
    transform: "translate(150 172) rotate(-22) scale(1.16) translate(-120 -62)",
    tilt: -22,
  },
  Granada: {
    Art: Grenade,
    transform: "translate(150 172) rotate(-10) scale(1.2) translate(-74 -100)",
    tilt: -10,
  },
  Flashbang: {
    Art: Flashbang,
    transform: "translate(150 172) rotate(-10) scale(1.15) translate(-74 -104)",
    tilt: -10,
  },
  Smoke: {
    Art: Smoke,
    transform: "translate(150 172) rotate(-6) scale(1.2) translate(-68 -100)",
    tilt: -6,
  },
  Molotov: {
    Art: Molotov,
    transform: "translate(150 178) rotate(-10) scale(1.08) translate(-78 -82)",
    tilt: -10,
  },
  BOMBA: {
    Art: C4,
    transform: "translate(150 178) rotate(-8) scale(1.12) translate(-95 -70)",
    tilt: -8,
  },
  "KIT DEFUSE": {
    Art: DefuseKit,
    transform: "translate(150 176) rotate(-6) scale(1.12) translate(-100 -100)",
    tilt: -6,
  },
  Capacete: {
    Art: Helmet,
    transform: "translate(150 172) rotate(-6) scale(1.1) translate(-104 -100)",
    tilt: -6,
  },
  Colete: {
    Art: Vest,
    transform: "translate(150 170) rotate(-4) scale(1.05) translate(-100 -104)",
    tilt: -4,
  },
};
