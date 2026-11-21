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
};

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
