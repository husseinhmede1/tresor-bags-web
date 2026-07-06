import { useState, useEffect } from "react";

const GOLD   = "#dfa94b";
const GOLD_L = "#E5C48A";
const GOLD_D = "#C9A86A";
const BG     = "#080808";
const BORDER = "rgba(201,168,106,0.15)";
const MUTED  = "#6B6560";
const TEXT   = "#F5F1E8";
const SERIF  = "'Cormorant Garamond', serif";
const SANS   = "'Inter', sans-serif";

const CATEGORIES = [
    { title: "Luggage",     sub: "Carry-ons, checked, trolleys" },
    { title: "Backpacks",   sub: "Travel, laptop, active packs" },
    { title: "Bags",        sub: "Totes, crossbody, duffels" },
    { title: "Accessories", sub: "Wallets, tech, packing & more" },
];

export default function TypeSelectorModal({ onStart, onSkip }) {
    const [selected, setSelected] = useState(null);
    const [isExiting, setIsExiting] = useState(false);

    const exitThen = (cb) => { setIsExiting(true); setTimeout(cb, 600); };
    const handleStart = () => { if (!selected) return; exitThen(() => onStart(selected)); };
    const handleSkip  = () => exitThen(() => onSkip());

    useEffect(() => {
        const s = document.createElement("style");
        s.id = "tsm-keyframes";
        s.textContent = `
            @keyframes tsmFadeIn    { from { opacity:0; transform:scale(0.97) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes tsmFadeOut   { from { opacity:1; transform:scale(1) translateY(0); } to { opacity:0; transform:scale(1.04) translateY(-10px); } }
            @keyframes tsmOverlayOut { from { opacity:1; backdrop-filter:blur(14px); } to { opacity:0; backdrop-filter:blur(0px); } }
            .tsm-cat-box:hover  { border-color: rgba(201,168,106,0.4) !important; background: rgba(201,168,106,0.05) !important; }
            .tsm-start-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,106,0.35) !important; }
            .tsm-close-btn:hover { background: rgba(201,168,106,0.12) !important; color: #E5C48A !important; }
        `;
        if (!document.getElementById("tsm-keyframes")) document.head.appendChild(s);
        return () => { const el = document.getElementById("tsm-keyframes"); if (el) el.remove(); };
    }, []);

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
            animation: isExiting ? "tsmOverlayOut 0.6s cubic-bezier(0.4,0,1,1) forwards" : "none",
            pointerEvents: isExiting ? "none" : "auto",
        }}>
            <div style={{
                width: "min(640px, 100%)",
                height: "min(92vh, 680px)",
                background: BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 3,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(201,168,106,0.08)",
                animation: isExiting
                    ? "tsmFadeOut 0.55s cubic-bezier(0.4,0,1,1) forwards"
                    : "tsmFadeIn 0.45s cubic-bezier(0.22,1,0.36,1)",
            }}>

                {/* Top — video */}
                <div style={{ position: "relative", flexShrink: 0, height: "min(46vh, 320px)", background: "#030303", overflow: "hidden" }}>
                    <video
                        src="/tummiVideo.mp4"
                        autoPlay muted loop playsInline
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(8,8,8,0.96), transparent)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: 18, left: 24, display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: GOLD_L, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                            TRÉSOR BAGS
                        </span>
                        {selected && (
                            <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                                {selected.title}
                            </span>
                        )}
                    </div>
                    <button onClick={handleSkip} className="tsm-close-btn" title="Browse all" style={{
                        position: "absolute", top: 12, right: 12,
                        background: "rgba(0,0,0,0.5)", border: `1px solid ${BORDER}`,
                        color: MUTED, borderRadius: "50%", width: 30, height: 30,
                        cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(6px)",
                    }}>✕</button>
                </div>

                {/* Bottom — category grid */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 24px 0", overflowY: "auto", background: BG, minHeight: 0 }}>
                    <p style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, margin: "0 0 14px", flexShrink: 0 }}>
                        {selected ? `Selected: ${selected.title}` : "What are you looking for?"}
                    </p>

                    {/* 2×2 grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, alignContent: "flex-start" }}>
                        {CATEGORIES.map(cat => {
                            const isActive = selected?.title === cat.title;
                            return (
                                <div
                                    key={cat.title}
                                    className="tsm-cat-box"
                                    onClick={() => setSelected(cat)}
                                    style={{
                                        display: "flex", flexDirection: "column", gap: 6,
                                        padding: "20px 18px",
                                        border: `1px solid ${isActive ? GOLD_D : BORDER}`,
                                        background: isActive ? "rgba(201,168,106,0.07)" : "rgba(255,255,255,0.02)",
                                        borderRadius: 2, cursor: "pointer",
                                        transition: "border-color 0.25s, background 0.25s",
                                        position: "relative",
                                    }}
                                >
                                    <span style={{ fontFamily: SERIF, fontSize: 20, color: isActive ? GOLD_L : TEXT, fontWeight: 400, letterSpacing: "0.04em" }}>
                                        {cat.title}
                                    </span>
                                    <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED, letterSpacing: "0.06em", lineHeight: 1.5 }}>
                                        {cat.sub}
                                    </span>
                                    {isActive && (
                                        <span style={{ position: "absolute", top: 8, right: 10, fontSize: 9, color: GOLD_L, fontWeight: 700 }}>✓</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${BORDER}`, padding: "14px 0", marginTop: 14, flexShrink: 0 }}>
                        <div>
                            {selected && (
                                <span style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "0.1em", color: GOLD_D, textTransform: "uppercase" }}>
                                    ✓ {selected.title}
                                </span>
                            )}
                        </div>
                        <button
                            className="tsm-start-btn"
                            onClick={handleStart}
                            disabled={!selected}
                            style={{
                                background: `linear-gradient(135deg, ${GOLD_D}, ${GOLD_L})`,
                                color: "#070707",
                                border: "none",
                                padding: "11px 24px",
                                borderRadius: 1,
                                fontFamily: SANS,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                cursor: selected ? "pointer" : "not-allowed",
                                opacity: selected ? 1 : 0.28,
                                pointerEvents: selected ? "auto" : "none",
                                transition: "opacity 0.2s, transform 0.2s",
                            }}
                        >
                            Browse {selected?.title || "Category"} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
