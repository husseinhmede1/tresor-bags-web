// Small decorations for an occasion, hanging under the header on the home page: gold line
// drawings on the shop's black, no words. They take no room, sit where the hero is empty and
// let clicks through. Loaded only when the shop has picked an occasion.

const GOLD = "#D9B26F";
const BODY = "rgba(217, 178, 111, 0.10)";   // a faint fill, so a drawing reads as an object
const line = { fill: "none", stroke: GOLD, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const body = { ...line, fill: BODY };
const dot = { fill: GOLD, stroke: "none" };

// Every drawing hangs from the middle of its top edge.
const Art = ({ box = "0 0 48 64", children }) => (
    <svg viewBox={box} width="100%" aria-hidden="true" focusable="false" style={{ display: "block", overflow: "visible" }}>{children}</svg>
);
const Cap = () => (
    <>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <rect x="19.5" y="6" width="9" height="5" rx="1.5" {...body} />
    </>
);

/* ── Christmas: what hangs on the tree ─────────────────────────────────── */

const Bauble = () => (
    <Art>
        <Cap />
        <circle cx="24" cy="31" r="19" {...body} />
        <path d="M6 26.5 Q24 33 42 26.5 M6 35.5 Q24 42 42 35.5" {...line} />
        <circle cx="15" cy="34" r="1.4" {...dot} /><circle cx="24" cy="35.8" r="1.4" {...dot} /><circle cx="33" cy="34" r="1.4" {...dot} />
        <path d="M11.5 22 A14 14 0 0 1 18 15.5" {...line} opacity="0.7" />
    </Art>
);
const Drop = () => (
    <Art>
        <Cap />
        <path d="M24 11 C35 15 40 25 40 33 C40 45 31 53 24 61 C17 53 8 45 8 33 C8 25 13 15 24 11 Z" {...body} />
        <path d="M9.5 27 Q24 20 38.5 27 M8.3 36 Q24 29 39.7 36 M12 45 Q24 39 36 45" {...line} />
    </Art>
);
const Star = () => (
    <Art box="0 6 48 40">
        <circle cx="24" cy="9.5" r="2.5" {...line} />
        <path d="M24.0 13.0 L28.2 24.2 L40.2 24.7 L30.8 32.2 L34.0 43.8 L24.0 37.2 L14.0 43.8 L17.2 32.2 L7.8 24.7 L19.8 24.2 Z" {...body} />
    </Art>
);
const Bell = () => (
    <Art>
        <circle cx="24" cy="5" r="3" {...line} />
        <path d="M24 8 C14 8 11.5 18 11.5 28 C11.5 36 8.5 40 6 43.5 H42 C39.5 40 36.5 36 36.5 28 C36.5 18 34 8 24 8 Z" {...body} />
        <path d="M13 34 H35" {...line} opacity="0.7" />
        <circle cx="24" cy="48.5" r="3.6" {...body} />
    </Art>
);
const Snowflake = () => (
    <Art box="5 11 38 34">
        <path d="M24 28 L24.0 12.0 M24.0 18.0 l-3.8 -3.2 M24.0 18.0 l3.8 -3.2 M24 28 L37.9 20.0 M32.7 23.0 l0.9 -4.9 M32.7 23.0 l4.7 1.7 M24 28 L37.9 36.0 M32.7 33.0 l4.7 -1.7 M32.7 33.0 l0.9 4.9 M24 28 L24.0 44.0 M24.0 38.0 l3.8 3.2 M24.0 38.0 l-3.8 3.2 M24 28 L10.1 36.0 M15.3 33.0 l-0.9 4.9 M15.3 33.0 l-4.7 -1.7 M24 28 L10.1 20.0 M15.3 23.0 l-4.7 1.7 M15.3 23.0 l-0.9 -4.9" {...line} />
        <circle cx="24" cy="28" r="1.8" {...dot} />
    </Art>
);
const CandyCane = () => (
    <Art box="9 8 34 56">
        <path d="M17 60 V22 A9.5 9.5 0 0 1 36 22 V27" {...line} strokeWidth="7" opacity="0.16" />
        <path d="M13.5 60 V22 A13 13 0 0 1 39.5 22 V27 A3.5 3.5 0 0 1 32.5 27 V22 A6 6 0 0 0 20.5 22 V60 A3.5 3.5 0 0 1 13.5 60 Z" {...line} />
        <path d="M13.5 52 L20.5 47 M13.5 42 L20.5 37 M13.5 32 L20.5 27 M15.5 15.5 L21.5 18.5 M26.5 9 V15.8 M37 14.5 L31.5 18.5" {...line} />
    </Art>
);
const Tree = () => (
    <Art>
        <path d="M24.0 2.0 L25.2 5.4 L28.8 5.5 L26.0 7.7 L27.0 11.2 L24.0 9.2 L21.0 11.2 L22.0 7.7 L19.2 5.5 L22.8 5.4 Z" {...dot} />
        <path d="M24 12 L33 25 H29 L37 37 H32.5 L41 50 H7 L15.5 37 H11 L19 25 H15 Z" {...body} />
        <rect x="20.5" y="50" width="7" height="8" rx="1.2" {...body} />
        <circle cx="21" cy="31" r="1.4" {...dot} /><circle cx="28" cy="42" r="1.4" {...dot} /><circle cx="18" cy="44" r="1.4" {...dot} />
    </Art>
);

/* ── Ramadan: lanterns, the crescent, stars ────────────────────────────── */

const Lantern = () => (
    <Art>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M13.5 18 Q24 3 34.5 18 Z" {...body} />
        <rect x="11.5" y="18" width="25" height="4" rx="2" {...body} />
        <path d="M14 22 L9.5 44 L15.5 54 H32.5 L38.5 44 L34 22 Z" {...body} />
        <path d="M19 47 V35 Q24 27 29 35 V47 Z" {...line} />
        <path d="M24 37.5 C26 40 26.2 42.6 24 43.6 C21.8 42.6 22 40 24 37.5 Z" {...dot} />
        <rect x="13.5" y="54" width="21" height="4" rx="2" {...body} />
        <circle cx="24" cy="61.5" r="1.8" {...dot} />
    </Art>
);
const RoundLantern = () => (
    <Art>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M18 8 H30 L33 14 H15 Z" {...body} />
        <path d="M15 14 C5 24 5 40 15 50 H33 C43 40 43 24 33 14 Z" {...body} />
        <path d="M24 14 V50 M19 14 C13.5 24 13.5 40 19 50 M29 14 C34.5 24 34.5 40 29 50" {...line} />
        <path d="M17 50 H31 L29 55 H19 Z" {...body} />
        <path d="M24 55 V60" {...line} /><circle cx="24" cy="61.5" r="1.8" {...dot} />
    </Art>
);
const Crescent = () => (
    <Art box="0 6 48 44">
        <circle cx="24" cy="9.5" r="2.5" {...line} />
        <path d="M25.6 13.1 A17 17 0 1 0 39.4 37.2 A14 14 0 1 1 25.6 13.1 Z" {...body} />
        <path d="M34.0 16.5 L35.3 20.7 L39.5 22.0 L35.3 23.3 L34.0 27.5 L32.7 23.3 L28.5 22.0 L32.7 20.7 Z" {...dot} />
    </Art>
);
const EightStar = () => (
    <Art box="0 0 40 44">
        <circle cx="20" cy="4.5" r="2.5" {...line} />
        <path d="M20.0 8.0 L24.4 13.4 L31.3 12.7 L30.6 19.6 L36.0 24.0 L30.6 28.4 L31.3 35.3 L24.4 34.6 L20.0 40.0 L15.6 34.6 L8.7 35.3 L9.4 28.4 L4.0 24.0 L9.4 19.6 L8.7 12.7 L15.6 13.4 Z" {...body} />
        <circle cx="20" cy="24" r="4.5" {...line} />
    </Art>
);
const Sparkle = () => (
    <Art box="0 4 24 21">
        <path d="M12.0 4.0 L14.3 11.7 L22.0 14.0 L14.3 16.3 L12.0 24.0 L9.7 16.3 L2.0 14.0 L9.7 11.7 Z" {...dot} />
    </Art>
);

/* ── Easter: eggs, a bunny, a chick, a flower ──────────────────────────── */

const EGG = "M24 9 C34 9 41 25 41 37 C41 49 33 57 24 57 C15 57 7 49 7 37 C7 25 14 9 24 9 Z";
const Egg = () => (
    <Art>
        <circle cx="24" cy="5.5" r="2.5" {...line} />
        <path d={EGG} {...body} />
        <path d="M8 31 L13.3 26 L18.7 31 L24 26 L29.3 31 L34.7 26 L40 31 M7.3 41 Q24 47 40.7 41" {...line} />
        <circle cx="16" cy="38" r="1.4" {...dot} /><circle cx="24" cy="39.5" r="1.4" {...dot} /><circle cx="32" cy="38" r="1.4" {...dot} />
    </Art>
);
const DottedEgg = () => (
    <Art>
        <circle cx="24" cy="5.5" r="2.5" {...line} />
        <path d={EGG} {...body} />
        <path d="M9.5 26 Q16.8 21 24 26 T38.5 26 M7.2 36 Q15.6 31 24 36 T40.8 36 M9 46 Q16.5 41 24 46 T39 46" {...line} />
    </Art>
);
const Bunny = () => (
    <Art box="0 3 48 58">
        <path d="M18.5 30 C12.5 21 13.5 4 19 4 C24.5 4 23 20 21.5 28.5 Z M29.5 30 C35.5 21 34.5 4 29 4 C23.5 4 25 20 26.5 28.5 Z" {...body} />
        <circle cx="24" cy="42" r="15" {...body} />
        <circle cx="18.5" cy="39.5" r="1.7" {...dot} /><circle cx="29.5" cy="39.5" r="1.7" {...dot} />
        <path d="M22.4 44.5 H25.6 L24 46.6 Z" {...dot} />
        <path d="M24 46.6 V48.5 M24 48.5 Q21.5 51 19.5 49 M24 48.5 Q26.5 51 28.5 49" {...line} />
    </Art>
);
const Chick = () => (
    <Art>
        <circle cx="24" cy="5.5" r="2.5" {...line} />
        <path d="M24 13 V8 M20.5 14 L18.5 10 M27.5 14 L29.5 10" {...line} />
        <circle cx="24" cy="32" r="18" {...body} />
        <circle cx="17.5" cy="28" r="1.8" {...dot} /><circle cx="30.5" cy="28" r="1.8" {...dot} />
        <path d="M20.5 32.5 H27.5 L24 37.5 Z" {...dot} />
        <path d="M8.5 31 Q4 36 9.5 39 M39.5 31 Q44 36 38.5 39" {...line} />
        <path d="M19 49.5 V55 M19 55 L16 57.5 M19 55 L22 57.5 M29 49.5 V55 M29 55 L26 57.5 M29 55 L32 57.5" {...line} />
    </Art>
);
const Flower = () => (
    <Art box="5 0 38 48">
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(0 24 30)" {...body} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(60 24 30)" {...body} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(120 24 30)" {...body} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(180 24 30)" {...body} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(240 24 30)" {...body} />
        <ellipse cx="24" cy="17.5" rx="5" ry="8" transform="rotate(300 24 30)" {...body} />
        <circle cx="24" cy="30" r="4.5" {...dot} />
    </Art>
);

/* ── Independence Day: the cedar, the flag, fireworks ──────────────────── */

const Cedar = () => (
    <Art>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M24 7.5 L27.5 13 H20.5 Z" {...body} />
        <path d="M15.5 20 Q24 12.5 32.5 20 Q24 18 15.5 20 Z M10.5 28 Q24 18.5 37.5 28 Q24 25.5 10.5 28 Z M6 36.5 Q24 25.5 42 36.5 Q24 33.5 6 36.5 Z M2.5 45.5 Q24 33 45.5 45.5 Q24 41.5 2.5 45.5 Z" {...body} />
        <path d="M22 43.5 L21.2 56 H26.8 L26 43.5" {...body} />
        <path d="M15 56 H33" {...line} />
    </Art>
);
const Flag = () => (
    <Art box="0 0 48 46">
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M24 6 L5 13 M24 6 L43 13" {...line} />
        <rect x="5" y="13" width="38" height="28" rx="2" {...line} />
        <path d="M5 15 a2 2 0 0 1 2 -2 H41 a2 2 0 0 1 2 2 V20 H5 Z M5 34 H43 V39 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 Z" fill="rgba(217, 178, 111, 0.32)" stroke="none" />
        <path d="M5 20 H43 M5 34 H43" {...line} />
        <path d="M24 22 L26.5 25 H21.5 Z M19 27.5 Q24 22.5 29 27.5 Q24 26.3 19 27.5 Z M17 30.6 Q24 24.6 31 30.6 Q24 29 17 30.6 Z" {...dot} />
        <path d="M24 30 V32.5" {...line} />
    </Art>
);
const Firework = () => (
    <Art box="0 4 48 48">
        <path d="M24.0 21.0 L24.0 11.0 M27.5 23.1 L31.1 18.3 M30.7 25.8 L40.2 22.7 M29.7 29.9 L35.4 31.7 M28.1 33.7 L34.0 41.8 M24.0 34.0 L24.0 40.0 M19.9 33.7 L14.0 41.8 M18.3 29.9 L12.6 31.7 M17.3 25.8 L7.8 22.7 M20.5 23.1 L16.9 18.3" {...line} />
        <circle cx="24.0" cy="7.0" r="1.6" {...dot} /> <circle cx="44.0" cy="21.5" r="1.6" {...dot} /> <circle cx="36.3" cy="45.0" r="1.6" {...dot} /> <circle cx="11.7" cy="45.0" r="1.6" {...dot} /> <circle cx="4.0" cy="21.5" r="1.6" {...dot} />
        <circle cx="24" cy="28" r="2" {...dot} />
    </Art>
);
const Rosette = () => (
    <Art>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M17 31 L12 56 L19 51 L23 57 L24 34 M31 31 L36 56 L29 51 L25 57 L24 34" {...body} />
        <circle cx="37.0" cy="22.0" r="3.6" {...body} /> <circle cx="34.5" cy="29.6" r="3.6" {...body} /> <circle cx="28.0" cy="34.4" r="3.6" {...body} /> <circle cx="20.0" cy="34.4" r="3.6" {...body} /> <circle cx="13.5" cy="29.6" r="3.6" {...body} /> <circle cx="11.0" cy="22.0" r="3.6" {...body} /> <circle cx="13.5" cy="14.4" r="3.6" {...body} /> <circle cx="20.0" cy="9.6" r="3.6" {...body} /> <circle cx="28.0" cy="9.6" r="3.6" {...body} /> <circle cx="34.5" cy="14.4" r="3.6" {...body} />
        <circle cx="24" cy="22" r="11.5" fill="#0B0B0C" stroke="none" />
        <circle cx="24" cy="22" r="11.5" {...body} />
        <path d="M24.0 14.5 L26.0 19.6 L31.4 19.9 L27.2 23.3 L28.6 28.6 L24.0 25.6 L19.4 28.6 L20.8 23.3 L16.6 19.9 L22.0 19.6 Z" {...dot} />
    </Art>
);

/* ── Eid al-Fitr: gifts and sweets ─────────────────────────────────────── */

const Gift = () => (
    <Art>
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M24 20 C19 10 9 11 12 16.5 C14 20 20 20 24 20 Z M24 20 C29 10 39 11 36 16.5 C34 20 28 20 24 20 Z" {...body} />
        <rect x="5" y="20" width="38" height="9" rx="2" {...body} />
        <rect x="8" y="29" width="32" height="27" rx="2" {...body} />
        <path d="M24 20 V56 M20.5 20 V56 M27.5 20 V56" {...line} />
    </Art>
);
const Candy = () => (
    <Art box="0 0 48 44">
        <circle cx="24" cy="3.5" r="2.5" {...line} />
        <path d="M24 6 V14" {...line} />
        <path d="M13 26 L3 18 Q6.5 26 3 34 Z M35 26 L45 18 Q41.5 26 45 34 Z" {...body} />
        <ellipse cx="24" cy="26" rx="12" ry="12" {...body} />
        <path d="M17 16.5 Q22 26 17 35.5 M24 14 Q29 26 24 38 M31 16.5 Q35 26 31 35.5" {...line} />
    </Art>
);

// Where each drawing hangs. On a laptop the layer covers the hero's right column, where the
// bag's picture sits in the middle: `k` is the place across it, counted from its centre in
// widths of that picture (the bag itself reaches about 0.3 each way), so the drawings stay
// beside the bag at every screen width. `drop` is the length of the thread and `size` the
// drawing's width, in px at the picture's full size (480px); both shrink with it.
// `far`: only on wide screens, where there is room past the bag for one more.
// `phone`: the place on a phone, to the right of the headline: px back from the right edge,
// thread and width in px; `from` is the narrowest screen with room for it. A drawing without
// a `phone` is left out there.
const SEASONS = {
    christmas: [
        { art: CandyCane, k: -0.64, drop: 104, size: 26, far: true },
        { art: Snowflake, k: -0.53, drop: 46, size: 34 },
        { art: Bauble, k: -0.415, drop: 150, size: 66, phone: { back: 36, drop: 22, size: 24, from: 390 } },
        { art: Star, k: -0.325, drop: 44, size: 46 },
        { art: Tree, k: 0.375, drop: 40, size: 46 },
        { art: Bell, k: 0.5, drop: 136, size: 58, phone: { back: 6, drop: 84, size: 22 } },
        { art: Drop, k: 0.615, drop: 30, size: 38, far: true },
    ],
    ramadan: [
        { art: Sparkle, k: -0.53, drop: 52, size: 20 },
        { art: Lantern, k: -0.415, drop: 140, size: 62, phone: { back: 36, drop: 18, size: 24, from: 390 } },
        { art: Crescent, k: -0.325, drop: 42, size: 48 },
        { art: EightStar, k: 0.375, drop: 38, size: 42 },
        { art: RoundLantern, k: 0.5, drop: 128, size: 58, phone: { back: 6, drop: 86, size: 22 } },
        { art: Sparkle, k: 0.615, drop: 36, size: 18, far: true },
    ],
    fitr: [
        { art: Lantern, k: -0.64, drop: 96, size: 28, far: true },
        { art: Sparkle, k: -0.53, drop: 52, size: 20 },
        { art: Gift, k: -0.415, drop: 142, size: 60, phone: { back: 36, drop: 20, size: 24, from: 390 } },
        { art: Crescent, k: -0.325, drop: 42, size: 48 },
        { art: EightStar, k: 0.375, drop: 38, size: 42 },
        { art: Candy, k: 0.5, drop: 136, size: 60, phone: { back: 6, drop: 88, size: 24 } },
        { art: Sparkle, k: 0.615, drop: 36, size: 18, far: true },
    ],
    easter: [
        { art: Flower, k: -0.64, drop: 100, size: 30, far: true },
        { art: Sparkle, k: -0.53, drop: 52, size: 18 },
        { art: Egg, k: -0.415, drop: 150, size: 58, phone: { back: 36, drop: 20, size: 24, from: 390 } },
        { art: Chick, k: -0.335, drop: 28, size: 40 },
        { art: DottedEgg, k: 0.375, drop: 36, size: 40 },
        { art: Bunny, k: 0.5, drop: 132, size: 58, phone: { back: 6, drop: 84, size: 24 } },
        { art: Flower, k: 0.615, drop: 32, size: 28, far: true },
    ],
    independence: [
        { art: Sparkle, k: -0.64, drop: 96, size: 18, far: true },
        { art: Firework, k: -0.53, drop: 44, size: 36 },
        { art: Cedar, k: -0.415, drop: 146, size: 62, phone: { back: 36, drop: 20, size: 24, from: 390 } },
        { art: Star, k: -0.325, drop: 44, size: 44 },
        { art: Rosette, k: 0.375, drop: 36, size: 42 },
        { art: Flag, k: 0.5, drop: 138, size: 62, phone: { back: 6, drop: 88, size: 26 } },
        { art: Firework, k: 0.615, drop: 34, size: 30, far: true },
    ],
};

// The drawings of an occasion side by side, for the admin's choice.
export function SeasonPreview({ season }) {
    const arts = [...new Set((SEASONS[season] || []).map(i => i.art))];
    return arts.map((Drawing, i) => <span key={i} style={{ width: 44, flex: "none" }}><Drawing /></span>);
}

export default function SeasonDecor({ season }) {
    const items = SEASONS[season];
    if (!items) return null;
    return (
        <div className="season" aria-hidden="true">
            <style>{CSS}</style>
            {items.map(({ art: Drawing, k, drop, size, far, phone }, i) => (
                <div key={i}
                    className={`season__item${phone ? "" : " season__item--laptop"}${far ? " season__item--far" : ""}${phone?.from ? " season__item--roomy" : ""}`}
                    style={{
                        "--k": k, "--drop": drop / 480, "--size": size / 480, "--d": `${i * 90}ms`,
                        ...(phone && { "--p-back": `${phone.back}px`, "--p-drop": `${phone.drop}px`, "--p-size": `${phone.size}px` }),
                    }}>
                    <Drawing />
                </div>
            ))}
        </div>
    );
}

// The layer is laid over one cell of the hero's grid (an absolutely placed child of a grid
// takes the cell it names as its box), then lifted to the line under the header.
const CSS = `
    .season { position: absolute; grid-column: 2 / 3; grid-row: 1 / 2; top: 0; left: 0; right: 0; height: 0; transform: translateY(-40px); pointer-events: none; container-type: inline-size; }
    .season__item { --u: min(100cqw, 480px); }
    .season__item { position: absolute; top: 0; left: calc(50% + var(--u) * var(--k)); width: calc(var(--u) * var(--size)); padding-top: calc(var(--u) * var(--drop)); transform: translateX(-50%); opacity: 0.85; animation: season-in 0.9s var(--d) both; }
    .season__item::before { content: ""; position: absolute; left: 50%; top: 0; width: 1px; height: calc(var(--u) * var(--drop)); background: linear-gradient(rgba(217, 178, 111, 0.15), rgba(217, 178, 111, 0.6)); }
    @keyframes season-in { from { opacity: 0; } to { opacity: 0.85; } }
    @media (max-width: 1279px) { .season__item--far { display: none; } }
    @media (max-width: 900px) {
        .season { grid-column: 1 / 2; transform: translateY(-36px); }
        .season__item { left: calc(100% - var(--p-back)); width: var(--p-size); padding-top: var(--p-drop); }
        .season__item::before { height: var(--p-drop); }
        .season__item--laptop { display: none; }
    }
    @media (max-width: 389px) { .season__item--roomy { display: none; } }
    @media (prefers-reduced-motion: reduce) { .season__item { animation: none; } }
`;
