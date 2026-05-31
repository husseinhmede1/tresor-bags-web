import { useState, useEffect, useRef, useCallback } from "react";

/* ── Per-slide luxury dark palettes ── */
const PALETTES = [
    { bg: "#0D0A0E", glow: "rgba(180,120,220,0.07)" },   // midnight violet
    { bg: "#060D0B", glow: "rgba(60,160,110,0.07)" },    // deep forest
    { bg: "#07090F", glow: "rgba(80,100,210,0.08)" },    // indigo noir
    { bg: "#100807", glow: "rgba(190,55,55,0.07)" },     // bordeaux
    { bg: "#0C0C07", glow: "rgba(150,150,55,0.06)" },    // olive noir
    { bg: "#080710", glow: "rgba(100,75,210,0.08)" },    // deep purple
    { bg: "#10080D", glow: "rgba(200,55,90,0.07)" },     // rose noir
    { bg: "#07090E", glow: "rgba(55,100,190,0.08)" },    // slate blue
    { bg: "#090E08", glow: "rgba(70,170,70,0.06)" },     // forest
    { bg: "#0F0A07", glow: "rgba(210,115,55,0.07)" },    // cognac
    { bg: "#08090F", glow: "rgba(55,80,185,0.08)" },     // navy
    { bg: "#0D0808", glow: "rgba(190,55,55,0.07)" },     // crimson
];

const DURATION = 750; // ms

/* ── Single slide image with enter/exit 3D animation ── */
const SlideImg = ({ src, alt, mode, dir, floating }) => {
    const [entered, setEntered] = useState(false);
    const rafRef = useRef(null);

    useEffect(() => {
        if (mode === "enter") {
            // Double rAF: ensure "from" position is painted before transition starts
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = requestAnimationFrame(() => setEntered(true));
            });
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, []); // only on mount

    const exitX   = dir === "next" ? "-118%"  : "118%";
    const enterFromX = dir === "next" ? "118%"  : "-118%";
    const exitRY  = dir === "next" ? "-22deg" : "22deg";
    const enterRY = dir === "next" ? "22deg"  : "-22deg";

    let transform, opacity;

    if (mode === "exit") {
        transform = `translateX(${exitX}) rotateY(${exitRY}) scale(0.76)`;
        opacity   = 0;
    } else if (mode === "enter") {
        if (!entered) {
            transform = `translateX(${enterFromX}) rotateY(${enterRY}) scale(0.76)`;
            opacity   = 0;
        } else {
            transform = "translateX(0) rotateY(0deg) scale(1)";
            opacity   = 1;
        }
    } else {
        // idle
        transform = "translateX(0) rotateY(0deg) scale(1)";
        opacity   = 1;
    }

    return (
        <img
            src={src}
            alt={alt}
            style={{
                position:        "absolute",
                height:          "clamp(260px, 58vh, 440px)",
                width:           "auto",
                maxWidth:        "58%",
                objectFit:       "contain",
                transform,
                opacity,
                transition:      `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity ${DURATION * 0.65}ms ease`,
                animation:       floating ? "h3dFloat 6s ease-in-out infinite" : "none",
                transformStyle:  "preserve-3d",
                willChange:      "transform, opacity",
                filter:          "drop-shadow(0 44px 88px rgba(0,0,0,0.82)) drop-shadow(0 0 56px rgba(201,168,106,0.1))",
                userSelect:      "none",
                pointerEvents:   "none",
                left:            "50%",
                marginLeft:      "auto",
                marginRight:     "auto",
                translate:       "none",
                insetInlineStart:"50%",
                transform:       `${transform} translateX(-50%)`,
            }}
        />
    );
};

/* ══════════════════════════════════════════════════════ */
const HeroCarousel3D = ({ bags }) => {
    const [idx, setIdx]         = useState(0);
    const [nextIdx, setNextIdx] = useState(null);
    const [dir, setDir]         = useState("next");
    const [sliding, setSliding] = useState(false);
    const autoRef               = useRef(null);
    const timerRef              = useRef(null);

    const pal = PALETTES[idx % PALETTES.length];

    const go = useCallback((newIdx, direction) => {
        if (sliding || !bags?.length || newIdx === idx) return;
        clearTimeout(timerRef.current);
        clearInterval(autoRef.current);

        setDir(direction);
        setNextIdx(newIdx);
        setSliding(true);

        timerRef.current = setTimeout(() => {
            setIdx(newIdx);
            setNextIdx(null);
            setSliding(false);
            // Restart auto-advance
            startAuto();
        }, DURATION + 60);
    // eslint-disable-next-line
    }, [sliding, bags, idx]);

    const goNext = useCallback(() => {
        if (!bags?.length) return;
        go((idx + 1) % bags.length, "next");
    }, [go, idx, bags]);

    const goPrev = useCallback(() => {
        if (!bags?.length) return;
        go((idx - 1 + bags.length) % bags.length, "prev");
    }, [go, idx, bags]);

    const startAuto = useCallback(() => {
        clearInterval(autoRef.current);
        autoRef.current = setInterval(() => {
            setIdx(prev => {
                const n = (prev + 1) % (bags?.length || 1);
                setDir("next");
                setNextIdx(n);
                setSliding(true);
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    setIdx(n);
                    setNextIdx(null);
                    setSliding(false);
                }, DURATION + 60);
                return prev; // state set inside timeout
            });
        }, 5500);
    }, [bags]);

    useEffect(() => {
        if (bags?.length) startAuto();
        return () => { clearInterval(autoRef.current); clearTimeout(timerRef.current); };
    }, [bags, startAuto]);

    if (!bags?.length) {
        return <div style={{ minHeight: 520, background: "#080808" }} />;
    }

    const bag     = bags[idx];
    const nextBag = nextIdx !== null ? bags[nextIdx] : null;

    return (
        <>
            <style>{`
                @keyframes h3dFloat {
                    0%,100% { transform: translateX(-50%) translateY(0px)  rotate(-0.5deg) scale(1);     }
                    25%     { transform: translateX(-50%) translateY(-18px) rotate(0.4deg)  scale(1.014); }
                    50%     { transform: translateX(-50%) translateY(-28px) rotate(1deg)    scale(1.019); }
                    75%     { transform: translateX(-50%) translateY(-12px) rotate(0.2deg)  scale(1.009); }
                }
                .h3d-arrow-btn {
                    transition: opacity 0.25s ease, border-color 0.25s ease, transform 0.2s ease !important;
                }
                .h3d-arrow-btn:hover {
                    opacity: 1 !important;
                    border-color: rgba(229,196,138,0.55) !important;
                    transform: scale(1.08) !important;
                }
                .h3d-dot {
                    transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important;
                    cursor: pointer;
                }
            `}</style>

            <div style={{
                position:       "relative",
                minHeight:      520,
                background:     pal.bg,
                transition:     `background-color ${DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
                overflow:       "hidden",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                perspective:    "1400px",
            }}>

                {/* ── Radial glow (color-shifts per slide) ── */}
                <div style={{
                    position:   "absolute", inset: 0,
                    background: `radial-gradient(ellipse 70% 60% at 62% 38%, ${pal.glow}, transparent)`,
                    transition: `background ${DURATION}ms ease`,
                    pointerEvents: "none", zIndex: 0,
                }} />

                {/* ── Bottom fade ── */}
                <div style={{
                    position:   "absolute", bottom: 0, left: 0, right: 0, height: 180,
                    background: `linear-gradient(to top, ${pal.bg} 0%, transparent 100%)`,
                    transition: `background ${DURATION}ms ease`,
                    pointerEvents: "none", zIndex: 0,
                }} />

                {/* ── Top edge vignette ── */}
                <div style={{
                    position:   "absolute", top: 0, left: 0, right: 0, height: 100,
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)`,
                    pointerEvents: "none", zIndex: 0,
                }} />

                {/* ── BEHIND layer: hero text ── */}
                <section style={{
                    position:  "absolute",
                    zIndex:    1,
                    textAlign: "center",
                    padding:   "0 24px",
                    maxWidth:  760,
                    width:     "100%",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}>
                    <p style={{
                        fontSize: 10, letterSpacing: "0.44em",
                        textTransform: "uppercase",
                        color: "rgba(201,168,106,0.45)",
                        margin: "0 0 20px",
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Curated luxury travel &amp; executive essentials
                    </p>
                    <h2 className="t-hero-title" style={{
                        fontSize: "clamp(1.9rem, 5.5vw, 3.8rem)",
                        lineHeight: 1.04,
                        margin: "0 0 18px",
                        fontFamily: "'Cormorant Garamond', serif",
                        letterSpacing: "0.07em",
                        background: "linear-gradient(135deg,#8B6914 0%,#C9A84C 25%,#E8C96A 45%,#F5DFA0 55%,#C9A84C 75%,#8B6914 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontWeight: 700,
                    }}>
                        TRÉSOR BAGS<br />COLLECTION
                    </h2>
                    <p style={{
                        fontSize: 13, color: "rgba(216,201,161,0.5)",
                        lineHeight: 1.9, margin: 0,
                        fontStyle: "italic",
                        fontFamily: "'Cormorant Garamond', serif",
                        letterSpacing: "0.02em",
                    }}>
                        Premium business, travel, and luxury bags<br />designed for the modern executive.
                    </p>
                </section>

                {/* ── FRONT layer: bag images ── */}
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 2,
                }}>
                    {/* Current (exiting when sliding) */}
                    <SlideImg
                        key={`img-${idx}`}
                        src={bag.mainImage}
                        alt={bag.title}
                        mode={sliding ? "exit" : "idle"}
                        dir={dir}
                        floating={!sliding}
                    />
                    {/* Next (entering) */}
                    {sliding && nextBag && (
                        <SlideImg
                            key={`img-${nextIdx}`}
                            src={nextBag.mainImage}
                            alt={nextBag.title}
                            mode="enter"
                            dir={dir}
                            floating={false}
                        />
                    )}
                </div>

                {/* ── Prev arrow ── */}
                <button
                    onClick={goPrev}
                    className="h3d-arrow-btn"
                    style={{
                        position: "absolute", left: 24, zIndex: 10,
                        background: "rgba(0,0,0,0.25)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(201,168,106,0.18)",
                        color: "rgba(229,196,138,0.65)",
                        width: 44, height: 44,
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', serif",
                        opacity: 0.55,
                    }}
                    aria-label="Previous"
                >←</button>

                {/* ── Next arrow ── */}
                <button
                    onClick={goNext}
                    className="h3d-arrow-btn"
                    style={{
                        position: "absolute", right: 24, zIndex: 10,
                        background: "rgba(0,0,0,0.25)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(201,168,106,0.18)",
                        color: "rgba(229,196,138,0.65)",
                        width: 44, height: 44,
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: 18,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', serif",
                        opacity: 0.55,
                    }}
                    aria-label="Next"
                >→</button>

                {/* ── Bag title & index ── */}
                <div style={{
                    position: "absolute", bottom: 44,
                    left: "50%", transform: "translateX(-50%)",
                    textAlign: "center", zIndex: 10,
                    pointerEvents: "none",
                    transition: `opacity ${DURATION * 0.5}ms ease`,
                    opacity: sliding ? 0 : 1,
                }}>
                    <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 15, color: "rgba(245,241,232,0.6)",
                        margin: "0 0 6px", letterSpacing: "0.08em",
                        fontWeight: 300, whiteSpace: "nowrap",
                    }}>{bag.title}</p>
                    {bag.price && (
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 10, color: "rgba(201,168,106,0.5)",
                            margin: 0, letterSpacing: "0.16em",
                            textTransform: "uppercase",
                        }}>
                            ${bag.categoryId?.discount > 0
                                ? (bag.price * (1 - bag.categoryId.discount / 100)).toFixed(2)
                                : bag.price}
                        </p>
                    )}
                </div>

                {/* ── Dot indicators ── */}
                <div style={{
                    position: "absolute", bottom: 18,
                    left: "50%", transform: "translateX(-50%)",
                    display: "flex", gap: 6, zIndex: 10,
                }}>
                    {bags.map((_, i) => (
                        <div
                            key={i}
                            className="h3d-dot"
                            onClick={() => go(i, i > idx ? "next" : "prev")}
                            style={{
                                width:        i === idx ? 22 : 5,
                                height:       5,
                                borderRadius: 999,
                                background:   i === idx
                                    ? "linear-gradient(90deg,#C9A86A,#E5C48A)"
                                    : "rgba(229,196,138,0.22)",
                            }}
                        />
                    ))}
                </div>

                {/* ── Slide counter top-right ── */}
                <div style={{
                    position: "absolute", top: 18, right: 72,
                    zIndex: 10,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10, letterSpacing: "0.18em",
                    color: "rgba(201,168,106,0.4)",
                }}>
                    {String(idx + 1).padStart(2, "0")} / {String(bags.length).padStart(2, "0")}
                </div>

            </div>
        </>
    );
};

export default HeroCarousel3D;
