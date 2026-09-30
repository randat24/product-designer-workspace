// Awards drawn as line icons: one colour (currentColor), outline, translucent fills,
// dashed rings — the notebook's placeholder style. Each keeps the award's key details.

/** Tile colour: medals in front "cut" the ones behind with it. */
export const AWARD_TILE = "#1d2447";

export const AWARD_ICONS = [
  "defence-of-ukraine",
  "defence-of-mykolaiv",
  "marine-brigade-36",
  "veteran-of-war",
  "military-service-veteran",
] as const;
export type AwardIcon = (typeof AWARD_ICONS)[number];

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const tint = (opacity: number) => ({ fill: "currentColor", opacity });

/** Sword along the x axis from (0,0) to (len,0): pommel, grip, guard, tapering blade. */
function Sword({ x, y, len, angle }: { x: number; y: number; len: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M-2.5 0l2.5-2.5 2.5 2.5-2.5 2.5z" {...tint(0.6)} />
      <path d="M2.5 0H6M6-4.5v9" {...line} strokeWidth={1.8} />
      <path d={`M6-1.8L${len} 0 6 1.8z`} {...tint(0.35)} />
      <path d={`M6-1.8L${len} 0 6 1.8z`} {...line} strokeWidth={1.3} />
    </g>
  );
}

function DefenceOfUkraine() {
  return (
    <>
      {/* ribbon: dark with a central stripe */}
      <rect x="25" y="4" width="30" height="36" {...tint(0.18)} />
      <rect x="36" y="4" width="8" height="36" {...tint(0.5)} />
      <rect x="25" y="4" width="30" height="36" {...line} />
      <rect x="20" y="40" width="40" height="5" rx="1" {...line} />
      <path d="M37 45l3 6 3-6" {...line} />
      {/* medal: four swords around a trident shield */}
      <circle cx="40" cy="78" r="26" {...line} strokeWidth={2.5} />
      <path d="M40 54v48M16 78h48" {...line} opacity={0.35} />
      <Sword x={29} y={57} len={24} angle={90} />
      <Sword x={51} y={99} len={24} angle={-90} />
      <Sword x={61} y={67} len={24} angle={180} />
      <Sword x={19} y={89} len={24} angle={0} />
      <path d="M33 70h14v9c0 6-4 9-7 10-3-1-7-4-7-10z" fill={AWARD_TILE} />
      <path d="M33 70h14v9c0 6-4 9-7 10-3-1-7-4-7-10z" {...tint(0.3)} />
      <path d="M33 70h14v9c0 6-4 9-7 10-3-1-7-4-7-10z" {...line} />
      <path d="M36.5 74v5l3.5 3.5 3.5-3.5v-5M40 73v11" {...line} strokeWidth={1.5} />
    </>
  );
}

function DefenceOfMykolaiv() {
  const cross = "M33 54h14l-3 17 17-3v14l-17-3 3 17H33l3-17-17 3V68l17 3z";
  return (
    <>
      {/* folded white ribbon with a blue wave */}
      <path d="M24 4h32v32l-16 9-16-9z" {...tint(0.15)} />
      <path d="M41 4c-9 7 8 13-1 21-6 5 3 9-1 16" {...line} strokeWidth={5} opacity={0.5} />
      <path d="M24 4h32v32l-16 9-16-9z" {...line} />
      <circle cx="40" cy="49" r="3" {...line} />
      {/* cross pattée with the saint in the centre and 20 · 22 on the arms */}
      <path d={cross} {...tint(0.2)} />
      <path d={cross} {...line} />
      <circle cx="40" cy="75" r="8" fill={AWARD_TILE} />
      <circle cx="40" cy="75" r="8" {...line} strokeWidth={1.5} strokeDasharray="1.6 2" />
      <circle cx="40" cy="75" r="5.5" {...line} strokeWidth={1.5} />
      <path d="M40 71.5v7M37.5 74h5" {...line} strokeWidth={1.4} />
      <text x="20.5" y="77.5" fill="currentColor" fontSize="6.5" fontWeight="700" fontFamily="var(--font-display)">20</text>
      <text x="52" y="77.5" fill="currentColor" fontSize="6.5" fontWeight="700" fontFamily="var(--font-display)">22</text>
    </>
  );
}

function MarineBrigade36() {
  return (
    <>
      {/* ribbon with stripes, bar, two medals on one ribbon */}
      <rect x="10" y="4" width="36" height="34" {...tint(0.15)} />
      <rect x="21" y="4" width="5" height="34" {...tint(0.45)} />
      <rect x="30" y="4" width="3" height="34" {...tint(0.3)} />
      <rect x="10" y="4" width="36" height="34" {...line} />
      <rect x="8" y="38" width="40" height="5" rx="1" {...line} />
      <path d="M44 43l6 5M26 43v14" {...line} />
      {/* back medal: “for honour and loyalty” — wings */}
      <circle cx="56" cy="62" r="17" fill={AWARD_TILE} />
      <circle cx="56" cy="62" r="17" {...line} />
      <circle cx="56" cy="62" r="12.5" {...line} strokeWidth={1.2} strokeDasharray="2 2.5" />
      <path d="M56 54v14M50 57c2 5 4 6 6 6s4-1 6-6M47 61c3 5 6 6 9 6s6-1 9-6" {...line} strokeWidth={1.5} />
      {/* front medal: brigade shield */}
      <circle cx="30" cy="80" r="21" fill={AWARD_TILE} />
      <circle cx="30" cy="80" r="21" {...tint(0.12)} />
      <circle cx="30" cy="80" r="21" {...line} strokeWidth={2.5} />
      <circle cx="30" cy="80" r="16" {...line} strokeWidth={1.2} strokeDasharray="2 2.5" />
      <path d="M22 71h16v10c0 6-5 9-8 10-3-1-8-4-8-10z" {...tint(0.35)} />
      <path d="M22 71h16v10c0 6-5 9-8 10-3-1-8-4-8-10z" {...line} />
      <path d="M25 85c2-5 6-8 10-9-1 3-3 6-6 8" {...line} strokeWidth={1.5} />
    </>
  );
}

function VeteranOfWar() {
  return (
    <>
      {/* bar in national colours */}
      <rect x="16" y="6" width="48" height="26" rx="2" {...line} />
      <rect x="21" y="11" width="38" height="7" {...tint(0.5)} />
      <rect x="21" y="20" width="38" height="7" {...tint(0.22)} />
      <circle cx="40" cy="37" r="3" {...line} />
      {/* medal: the Motherland monument, stars, laurel */}
      <circle cx="40" cy="70" r="28" {...line} strokeWidth={2.5} />
      <circle cx="40" cy="70" r="22" {...line} strokeWidth={1.2} strokeDasharray="2 2.5" />
      <path d="M37 91l1.5-24h3L43 91z" {...tint(0.4)} />
      <path d="M37 91l1.5-24h3L43 91z" {...line} strokeWidth={1.5} />
      <circle cx="40" cy="63.5" r="2.2" {...line} strokeWidth={1.5} />
      <path d="M39 68l-6-8M33 60l-2.5-12M31.5 56.5l3 1" {...line} strokeWidth={1.5} />
      <path d="M41 68l5-5" {...line} strokeWidth={1.5} />
      <path d="M45 57h6v4c0 3-2 4.5-3 5-1-.5-3-2-3-5z" {...tint(0.4)} />
      <path d="M45 57h6v4c0 3-2 4.5-3 5-1-.5-3-2-3-5z" {...line} strokeWidth={1.3} />
      <path d="M34 92h12" {...line} />
      <path d="M22 76c2 8 7 13 13 15M58 76c-2 8-7 13-13 15" {...line} strokeDasharray="3 2" />
      {(
        [
          [28, 60],
          [31, 72],
          [52, 70],
          [54, 58],
        ] as const
      ).map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - 2.5}v5M${x - 2.5} ${y}h5`} {...line} strokeWidth={1.3} />
      ))}
    </>
  );
}

function MilitaryServiceVeteran() {
  return (
    <>
      {/* ribbon: wide centre stripe, thin side stripes; ornamental bar */}
      <rect x="24" y="4" width="32" height="34" {...tint(0.15)} />
      <rect x="32" y="4" width="16" height="34" {...tint(0.45)} />
      <path d="M28.5 4v34M51.5 4v34" {...line} strokeWidth={1.5} opacity={0.7} />
      <rect x="24" y="4" width="32" height="34" {...line} />
      <path d="M16 38h48c-4 0-5 3-7 6H23c-2-3-3-6-7-6z" {...line} />
      <path d="M40 44v5" {...line} />
      {/* oak wreath with anchor, wings and crossed barrels */}
      <circle cx="40" cy="76" r="23" {...line} strokeWidth={7} strokeDasharray="3 2.5" opacity={0.4} />
      <circle cx="40" cy="76" r="27" {...line} strokeWidth={1.2} />
      <path d="M27 63l26 26M53 63L27 89" {...line} opacity={0.5} />
      <path d="M39 76c-7-5-15-6-22-3 5 5 13 6 22 5M41 76c7-5 15-6 22-3-5 5-13 6-22 5" {...tint(0.3)} />
      <path d="M39 76c-7-5-15-6-22-3 5 5 13 6 22 5M41 76c7-5 15-6 22-3-5 5-13 6-22 5" {...line} strokeWidth={1.5} />
      <path d="M22 74.5l3 2.5M27 73.5l3 3M32 73.5l2.5 3M58 74.5l-3 2.5M53 73.5l-3 3M48 73.5l-2.5 3" {...line} strokeWidth={1} />
      <circle cx="40" cy="61" r="2.5" {...line} />
      <path d="M40 63.5V92M34 68h12M31 85c3 6 6 7 9 7s6-1 9-7" {...line} />
    </>
  );
}

const ICONS: Record<AwardIcon, () => React.ReactElement> = {
  "defence-of-ukraine": DefenceOfUkraine,
  "defence-of-mykolaiv": DefenceOfMykolaiv,
  "marine-brigade-36": MarineBrigade36,
  "veteran-of-war": VeteranOfWar,
  "military-service-veteran": MilitaryServiceVeteran,
};

export function AwardSvg({ icon, className }: { icon: AwardIcon; className?: string }) {
  const Icon = ICONS[icon];
  return (
    <svg viewBox="0 0 80 106" className={className} aria-hidden="true">
      <Icon />
    </svg>
  );
}
