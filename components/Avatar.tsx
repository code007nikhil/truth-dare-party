import type { ReactNode } from "react";
import { AVATAR_BG, AVATAR_COUNT, AVATAR_NAMES } from "@/lib/avatars";

const INK = "#1F1535";
const OUTLINE = "rgba(31,21,53,0.28)";

/* ---------- shared pieces (all drawn on a 100x100 canvas) ---------- */

const Head = ({ fill, rx = 31, ry = 28, cy = 56 }: { fill: string; rx?: number; ry?: number; cy?: number }) => (
  <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill={fill} stroke={OUTLINE} strokeWidth="1.5" />
);

const Line = ({ d, w = 3, c = INK }: { d: string; w?: number; c?: string }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

const Dots = () => (
  <g fill={INK}>
    <circle cx="39" cy="54" r="3.6" />
    <circle cx="61" cy="54" r="3.6" />
  </g>
);
const BigEyes = () => (
  <g>
    <circle cx="38" cy="54" r="7.5" fill="#fff" />
    <circle cx="62" cy="54" r="7.5" fill="#fff" />
    <circle cx="39.5" cy="55" r="4" fill={INK} />
    <circle cx="60.5" cy="55" r="4" fill={INK} />
    <circle cx="41" cy="53" r="1.4" fill="#fff" />
    <circle cx="62" cy="53" r="1.4" fill="#fff" />
  </g>
);
const HappyEyes = () => (
  <g>
    <Line d="M32 56 Q38 47 44 56" w={3.4} />
    <Line d="M56 56 Q62 47 68 56" w={3.4} />
  </g>
);
const SlitEyes = () => (
  <g>
    <ellipse cx="38" cy="54" rx="6.5" ry="7" fill="#86EFAC" />
    <ellipse cx="62" cy="54" rx="6.5" ry="7" fill="#86EFAC" />
    <ellipse cx="38" cy="54" rx="1.8" ry="6" fill={INK} />
    <ellipse cx="62" cy="54" rx="1.8" ry="6" fill={INK} />
  </g>
);

const Nose = ({ y = 63 }: { y?: number }) => <ellipse cx="50" cy={y} rx="4.5" ry="3.4" fill={INK} />;
const Smile = ({ y = 68 }: { y?: number }) => <Line d={`M41 ${y} Q50 ${y + 9} 59 ${y}`} />;
const Cheeks = () => (
  <g fill="#FB7185" opacity="0.45">
    <circle cx="29" cy="64" r="5" />
    <circle cx="71" cy="64" r="5" />
  </g>
);

const Pointy = ({ fur, inner }: { fur: string; inner: string }) => (
  <g stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round">
    <polygon points="22,44 27,12 46,30" fill={fur} />
    <polygon points="78,44 73,12 54,30" fill={fur} />
    <polygon points="29,38 31,21 40,31" fill={inner} stroke="none" />
    <polygon points="71,38 69,21 60,31" fill={inner} stroke="none" />
  </g>
);
const RoundEars = ({ fur, inner, r = 10, x = 26, y = 32 }: { fur: string; inner?: string; r?: number; x?: number; y?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={fur} stroke={OUTLINE} strokeWidth="1.5" />
    <circle cx={100 - x} cy={y} r={r} fill={fur} stroke={OUTLINE} strokeWidth="1.5" />
    {inner && <circle cx={x} cy={y} r={r * 0.55} fill={inner} />}
    {inner && <circle cx={100 - x} cy={y} r={r * 0.55} fill={inner} />}
  </g>
);

/* ---------- accessories ---------- */

const PartyHat = ({ a, b }: { a: string; b: string }) => (
  <g>
    <polygon points="39,31 50,3 61,31" fill={a} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M43.5 21 L56.5 21 M41 27 L59 27" stroke={b} strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="4" r="4" fill="#FDE047" />
  </g>
);
const Crown = () => (
  <g>
    <polygon points="37,25 36,9 43,16 50,5 57,16 64,9 63,25" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="50" cy="17" r="2.4" fill="#EF4444" />
  </g>
);
const Bow = () => (
  <g stroke="#9D174D" strokeWidth="1" strokeLinejoin="round">
    <polygon points="69,32 57,24 57,40" fill="#EC4899" />
    <polygon points="69,32 81,24 81,40" fill="#EC4899" />
    <circle cx="69" cy="32" r="4" fill="#BE185D" />
  </g>
);
const Scarf = () => (
  <g>
    <path d="M23 76 Q50 92 77 76 L79 85 Q50 100 21 85 Z" fill="#EF4444" />
    <path d="M60 90 L66 99 L74 96 L68 87 Z" fill="#DC2626" />
  </g>
);
const Flower = () => (
  <g>
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={69 + 5.5 * Math.cos((a * Math.PI) / 180)} cy={38 + 5.5 * Math.sin((a * Math.PI) / 180)} r="4" fill="#F472B6" />
    ))}
    <circle cx="69" cy="38" r="3" fill="#FDE047" />
  </g>
);
const Headphones = () => (
  <g>
    <path d="M20 42 Q20 13 50 13 Q80 13 80 42" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
    <rect x="13" y="37" width="12" height="21" rx="5" fill="#F43F5E" />
    <rect x="75" y="37" width="12" height="21" rx="5" fill="#F43F5E" />
  </g>
);
const Sunglasses = () => (
  <g>
    <rect x="26" y="47" width="21" height="14" rx="6" fill={INK} />
    <rect x="53" y="47" width="21" height="14" rx="6" fill={INK} />
    <path d="M47 52 H53" stroke={INK} strokeWidth="3" />
    <path d="M31 52 L36 52 M58 52 L63 52" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
  </g>
);

/* ---------- the 20 characters ---------- */

const CHARS: (() => ReactNode)[] = [
  // 0 Fox
  () => (
    <>
      <Pointy fur="#F97316" inner="#FED7AA" />
      <Head fill="#F97316" />
      <ellipse cx="50" cy="69" rx="19" ry="12" fill="#FFF7ED" />
      <Dots />
      <Nose />
      <Smile />
    </>
  ),
  // 1 Cat
  () => (
    <>
      <Pointy fur="#94A3B8" inner="#FBCFE8" />
      <Head fill="#94A3B8" />
      <g stroke="#64748B" strokeWidth="3" strokeLinecap="round">
        <path d="M50 30 V38" />
        <path d="M42 31 L43 38" />
        <path d="M58 31 L57 38" />
      </g>
      <SlitEyes />
      <polygon points="46,61 54,61 50,66" fill="#F472B6" />
      <Line d="M50 66 V69 M43 69 Q46.5 74 50 69 Q53.5 74 57 69" w={2.4} />
      <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
        <path d="M20 62 L35 64 M20 70 L35 68 M80 62 L65 64 M80 70 L65 68" />
      </g>
      <Bow />
    </>
  ),
  // 2 Puppy
  () => (
    <>
      <ellipse cx="21" cy="52" rx="10" ry="19" transform="rotate(15 21 52)" fill="#8B5A2B" stroke={OUTLINE} strokeWidth="1.5" />
      <ellipse cx="79" cy="52" rx="10" ry="19" transform="rotate(-15 79 52)" fill="#8B5A2B" stroke={OUTLINE} strokeWidth="1.5" />
      <Head fill="#E5B887" />
      <circle cx="38" cy="53" r="10" fill="#8B5A2B" />
      <ellipse cx="50" cy="68" rx="15" ry="11" fill="#FFF7ED" />
      <Dots />
      <Nose y={62} />
      <ellipse cx="50" cy="76" rx="4" ry="5" fill="#FB7185" />
      <Smile y={68} />
    </>
  ),
  // 3 Bear
  () => (
    <>
      <RoundEars fur="#8B5E3C" inner="#D7B38A" />
      <Head fill="#8B5E3C" />
      <ellipse cx="50" cy="68" rx="15" ry="11" fill="#D7B38A" />
      <Dots />
      <Nose y={62} />
      <Smile y={68} />
      <PartyHat a="#F43F5E" b="#FDE047" />
    </>
  ),
  // 4 Panda
  () => (
    <>
      <RoundEars fur={INK} />
      <Head fill="#F8FAFC" />
      <ellipse cx="38" cy="54" rx="8.5" ry="11" transform="rotate(20 38 54)" fill={INK} />
      <ellipse cx="62" cy="54" rx="8.5" ry="11" transform="rotate(-20 62 54)" fill={INK} />
      <g fill="#fff">
        <circle cx="38" cy="53" r="3.6" />
        <circle cx="62" cy="53" r="3.6" />
      </g>
      <ellipse cx="50" cy="65" rx="5.5" ry="3.8" fill={INK} />
      <Smile y={70} />
    </>
  ),
  // 5 Bunny
  () => (
    <>
      <ellipse cx="37" cy="20" rx="8" ry="22" transform="rotate(-8 37 20)" fill="#F8FAFC" stroke={OUTLINE} strokeWidth="1.5" />
      <ellipse cx="63" cy="20" rx="8" ry="22" transform="rotate(8 63 20)" fill="#F8FAFC" stroke={OUTLINE} strokeWidth="1.5" />
      <ellipse cx="37" cy="22" rx="4" ry="15" transform="rotate(-8 37 22)" fill="#F9A8D4" />
      <ellipse cx="63" cy="22" rx="4" ry="15" transform="rotate(8 63 22)" fill="#F9A8D4" />
      <Head fill="#F8FAFC" />
      <Dots />
      <ellipse cx="50" cy="62" rx="3.8" ry="2.8" fill="#F472B6" />
      <Line d="M50 65 V69 M50 69 Q45 74 41 70 M50 69 Q55 74 59 70" w={2.4} />
      <rect x="47" y="70" width="6" height="7" rx="1.5" fill="#fff" stroke={OUTLINE} strokeWidth="1" />
      <Cheeks />
      <Flower />
    </>
  ),
  // 6 Frog
  () => (
    <>
      <circle cx="34" cy="32" r="12" fill="#4ADE80" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="66" cy="32" r="12" fill="#4ADE80" stroke={OUTLINE} strokeWidth="1.5" />
      <Head fill="#4ADE80" cy={58} ry={26} />
      <g>
        <circle cx="34" cy="31" r="7.5" fill="#fff" />
        <circle cx="66" cy="31" r="7.5" fill="#fff" />
        <circle cx="35" cy="32" r="4" fill={INK} />
        <circle cx="65" cy="32" r="4" fill={INK} />
      </g>
      <g fill={INK} opacity="0.6">
        <circle cx="46" cy="57" r="1.7" />
        <circle cx="54" cy="57" r="1.7" />
      </g>
      <Line d="M29 65 Q50 84 71 65" />
      <Cheeks />
    </>
  ),
  // 7 Owl
  () => (
    <>
      <polygon points="26,36 24,14 44,28" fill="#92400E" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="74,36 76,14 56,28" fill="#92400E" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <Head fill="#B45309" />
      <circle cx="38" cy="54" r="14" fill="#FDE68A" />
      <circle cx="62" cy="54" r="14" fill="#FDE68A" />
      <g>
        <circle cx="38" cy="54" r="8" fill="#fff" stroke={INK} strokeWidth="2" />
        <circle cx="62" cy="54" r="8" fill="#fff" stroke={INK} strokeWidth="2" />
        <circle cx="39" cy="55" r="4" fill={INK} />
        <circle cx="61" cy="55" r="4" fill={INK} />
      </g>
      <polygon points="44,61 56,61 50,73" fill="#F97316" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
    </>
  ),
  // 8 Penguin
  () => (
    <>
      <Head fill="#1E293B" />
      <ellipse cx="50" cy="64" rx="22" ry="17" fill="#F8FAFC" />
      <circle cx="38" cy="50" r="11" fill="#F8FAFC" />
      <circle cx="62" cy="50" r="11" fill="#F8FAFC" />
      <g fill={INK}>
        <circle cx="39" cy="52" r="3.4" />
        <circle cx="61" cy="52" r="3.4" />
      </g>
      <polygon points="43,60 57,60 50,70" fill="#F59E0B" stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
      <g fill="#FB7185" opacity="0.45">
        <circle cx="30" cy="63" r="4.5" />
        <circle cx="70" cy="63" r="4.5" />
      </g>
      <Scarf />
    </>
  ),
  // 9 Lion
  () => (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={50 + 34 * Math.cos(a)} cy={56 + 33 * Math.sin(a)} r="11" fill="#B45309" stroke={OUTLINE} strokeWidth="1.2" />;
      })}
      <circle cx="50" cy="56" r="34" fill="#B45309" />
      <RoundEars fur="#FBBF24" inner="#F59E0B" r={8} x={30} y={30} />
      <Head fill="#FBBF24" rx={27} ry={25} />
      <ellipse cx="50" cy="67" rx="14" ry="10" fill="#FEF3C7" />
      <Dots />
      <ellipse cx="50" cy="61" rx="4.5" ry="3.4" fill="#92400E" />
      <Smile y={67} />
      <Crown />
    </>
  ),
  // 10 Monkey
  () => (
    <>
      <circle cx="19" cy="52" r="13" fill="#92400E" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="81" cy="52" r="13" fill="#92400E" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="19" cy="52" r="7" fill="#FDBA74" />
      <circle cx="81" cy="52" r="7" fill="#FDBA74" />
      <Head fill="#92400E" />
      <g fill="#FDBA74">
        <ellipse cx="50" cy="66" rx="19" ry="15" />
        <circle cx="39" cy="52" r="10" />
        <circle cx="61" cy="52" r="10" />
      </g>
      <Dots />
      <g fill={INK} opacity="0.7">
        <circle cx="46" cy="63" r="1.5" />
        <circle cx="54" cy="63" r="1.5" />
      </g>
      <Smile y={70} />
    </>
  ),
  // 11 Koala
  () => (
    <>
      <circle cx="21" cy="38" r="15" fill="#A8B0BD" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="79" cy="38" r="15" fill="#A8B0BD" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="21" cy="38" r="9" fill="#F1F5F9" />
      <circle cx="79" cy="38" r="9" fill="#F1F5F9" />
      <Head fill="#A8B0BD" />
      <Dots />
      <ellipse cx="50" cy="62" rx="8" ry="11" fill={INK} />
      <ellipse cx="47" cy="57" rx="2.2" ry="3" fill="#fff" opacity="0.35" />
      <Line d="M44 77 Q50 81 56 77" w={2.4} />
    </>
  ),
  // 12 Piglet
  () => (
    <>
      <polygon points="26,40 21,19 42,31" fill="#F472B6" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="74,40 79,19 58,31" fill="#F472B6" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <Head fill="#F9A8D4" />
      <Dots />
      <ellipse cx="50" cy="66" rx="13" ry="10" fill="#F472B6" />
      <g fill={INK}>
        <ellipse cx="45" cy="66" rx="2" ry="3.2" />
        <ellipse cx="55" cy="66" rx="2" ry="3.2" />
      </g>
      <Line d="M44 79 Q50 82 56 79" w={2.4} />
      <Cheeks />
    </>
  ),
  // 13 Alien
  () => (
    <>
      <Line d="M40 27 L34 9 M60 27 L66 9" w={3} c="#15803D" />
      <circle cx="34" cy="8" r="4.5" fill="#FDE047" />
      <circle cx="66" cy="8" r="4.5" fill="#FDE047" />
      <Head fill="#86EFAC" rx={28} ry={32} cy={54} />
      <ellipse cx="37" cy="54" rx="9" ry="12" transform="rotate(-18 37 54)" fill={INK} />
      <ellipse cx="63" cy="54" rx="9" ry="12" transform="rotate(18 63 54)" fill={INK} />
      <g fill="#fff">
        <circle cx="34" cy="49" r="2.6" />
        <circle cx="60" cy="49" r="2.6" />
      </g>
      <Line d="M44 76 Q50 80 56 76" w={2.4} />
    </>
  ),
  // 14 Robot
  () => (
    <>
      <path d="M50 30 V16" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="13" r="5.5" fill="#EF4444" />
      <circle cx="18" cy="56" r="6" fill="#94A3B8" />
      <circle cx="82" cy="56" r="6" fill="#94A3B8" />
      <rect x="22" y="30" width="56" height="52" rx="12" fill="#CBD5E1" stroke={OUTLINE} strokeWidth="1.5" />
      <rect x="28" y="40" width="44" height="22" rx="8" fill="#1E293B" />
      <rect x="33" y="45" width="13" height="12" rx="4" fill="#22D3EE" />
      <rect x="54" y="45" width="13" height="12" rx="4" fill="#22D3EE" />
      <rect x="38" y="68" width="24" height="9" rx="3" fill="#1E293B" />
      <path d="M44 68 V77 M50 68 V77 M56 68 V77" stroke="#CBD5E1" strokeWidth="1.5" />
    </>
  ),
  // 15 Ghost
  () => (
    <>
      <path
        d="M22 80 V52 C22 30 34 22 50 22 C66 22 78 30 78 52 V80 L70 74 L62 82 L54 74 L46 82 L38 74 L30 82 Z"
        fill="#F8FAFC"
        stroke={OUTLINE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Dots />
      <ellipse cx="50" cy="67" rx="3.6" ry="4.8" fill={INK} />
      <Cheeks />
      <PartyHat a="#F59E0B" b="#EC4899" />
    </>
  ),
  // 16 Dino
  () => (
    <>
      <g fill="#F59E0B" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round">
        <polygon points="30,36 36,14 45,30" />
        <polygon points="42,30 50,9 58,30" />
        <polygon points="55,30 64,14 70,36" />
      </g>
      <Head fill="#2DD4BF" />
      <ellipse cx="50" cy="67" rx="20" ry="13" fill="#5EEAD4" />
      <g fill={INK} opacity="0.7">
        <circle cx="44" cy="62" r="1.8" />
        <circle cx="56" cy="62" r="1.8" />
      </g>
      <Smile y={70} />
      <Cheeks />
      <Sunglasses />
    </>
  ),
  // 17 Octopus
  () => (
    <>
      <g fill="#F472B6" stroke={OUTLINE} strokeWidth="1.5">
        <ellipse cx="25" cy="76" rx="8" ry="13" transform="rotate(20 25 76)" />
        <ellipse cx="40" cy="83" rx="8" ry="12" />
        <ellipse cx="60" cy="83" rx="8" ry="12" />
        <ellipse cx="75" cy="76" rx="8" ry="13" transform="rotate(-20 75 76)" />
      </g>
      <Head fill="#F472B6" cy={46} ry={29} />
      <g fill="#FBCFE8" opacity="0.9">
        <circle cx="40" cy="30" r="3.5" />
        <circle cx="58" cy="26" r="2.6" />
        <circle cx="67" cy="36" r="3" />
      </g>
      <g transform="translate(0 -6)">
        <HappyEyes />
        <Smile y={66} />
        <Cheeks />
      </g>
      <Headphones />
    </>
  ),
  // 18 Monster
  () => (
    <>
      <polygon points="32,34 27,11 45,27" fill="#FDE68A" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="68,34 73,11 55,27" fill="#FDE68A" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <Head fill="#8B5CF6" rx={32} />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="50" cy="51" r="7.5" fill="#34D399" />
      <circle cx="50" cy="51" r="3.8" fill={INK} />
      <circle cx="53" cy="48" r="1.8" fill="#fff" />
      <path d="M34 68 Q50 90 66 68 Z" fill="#4C1D95" />
      <g fill="#fff">
        <polygon points="38,68 44,68 41,74" />
        <polygon points="47,68 53,68 50,75" />
        <polygon points="56,68 62,68 59,74" />
      </g>
    </>
  ),
  // 19 Unicorn
  () => (
    <>
      <ellipse cx="26" cy="40" rx="10" ry="14" fill="#F472B6" />
      <ellipse cx="21" cy="55" rx="9" ry="14" fill="#A78BFA" />
      <ellipse cx="26" cy="69" rx="9" ry="12" fill="#60A5FA" />
      <polygon points="30,38 32,19 44,31" fill="#F8FAFC" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="70,38 68,19 56,31" fill="#F8FAFC" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <Head fill="#F8FAFC" />
      <path d="M36 32 Q50 20 64 32 Q56 38 44 38 Z" fill="#F472B6" />
      <polygon points="44,32 50,4 56,32" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M46 24 L54 20 M45 28 L55 25" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
      <HappyEyes />
      <ellipse cx="50" cy="68" rx="14" ry="9" fill="#FBCFE8" />
      <g fill={INK} opacity="0.7">
        <circle cx="45" cy="68" r="1.6" />
        <circle cx="55" cy="68" r="1.6" />
      </g>
      <Cheeks />
    </>
  ),
];

export default function Avatar({ index, className = "" }: { index: number; className?: string }) {
  const i = ((Math.trunc(index) % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`${AVATAR_NAMES[i]} avatar`} className={`block shrink-0 rounded-full ${className}`}>
      <rect width="100" height="100" fill={AVATAR_BG[i]} />
      {CHARS[i]()}
    </svg>
  );
}
