import { useState, useEffect } from "react";
import ShopAssistant from "./ShopAssistant";
import { X } from "@phosphor-icons/react";

const GOLD_L = "#D9B26F";
const BG     = "#111113";
const BORDER = "rgba(255,255,255,0.09)";
const TEXT   = "#F2F0EB";
const FONT   = "'Geist Variable', system-ui, sans-serif";

// Welcome popup: the brand video and the shop assistant. Categories live in the header menu
// and above the bags, so this only asks one thing: what are you looking for?
export default function TypeSelectorModal({ onSkip, onOpenBag }) {
    const [isExiting, setIsExiting] = useState(false);

    const exitThen = (cb) => { setIsExiting(true); setTimeout(cb, 600); };
    const handleSkip  = () => exitThen(() => onSkip());

    useEffect(() => {
        const s = document.createElement("style");
        s.id = "tsm-keyframes";
        s.textContent = `
            @keyframes tsmFadeIn    { from { opacity:0; transform:scale(0.97) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes tsmFadeOut   { from { opacity:1; transform:scale(1) translateY(0); } to { opacity:0; transform:scale(1.04) translateY(-10px); } }
            @keyframes tsmOverlayOut { from { opacity:1; backdrop-filter:blur(14px); } to { opacity:0; backdrop-filter:blur(0px); } }
            .tsm-start-btn:hover:not(:disabled) { background: #E6C68D !important; }
            .tsm-close-btn:hover { background: rgba(255,255,255,0.14) !important; }
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
                maxHeight: "min(92vh, 760px)",
                background: BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 20,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(201,168,106,0.08)",
                animation: isExiting
                    ? "tsmFadeOut 0.55s cubic-bezier(0.4,0,1,1) forwards"
                    : "tsmFadeIn 0.45s cubic-bezier(0.22,1,0.36,1)",
            }}>

                {/* Top — video */}
                <div style={{ position: "relative", flexShrink: 0, height: "min(30vh, 190px)", background: "#030303", overflow: "hidden" }}>
                    <video
                        src="/tummiVideo.mp4"
                        autoPlay muted loop playsInline
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(8,8,8,0.96), transparent)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: 18, left: 24, display: "flex", flexDirection: "column", gap: 5 }}>
                        <img src="/tresor_logo.webp" alt="Trésor Bags" style={{ height: 40, width: 110, objectFit: "contain", objectPosition: "left center" }} />

                    </div>
                    <button onClick={handleSkip} className="tsm-close-btn" title="Browse all" style={{
                        position: "absolute", top: 12, right: 12,
                        background: "rgba(0,0,0,0.5)", border: `1px solid ${BORDER}`,
                        color: TEXT, borderRadius: "50%", width: 36, height: 36,
                        cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(6px)",
                    }}><X size={16} /></button>
                </div>

                {/* Bottom: ask the shop, or start shopping */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 20px 0", overflowY: "auto", background: BG, minHeight: 0 }}>
                    {/* Ask the shop: text or photo, answered from the catalog only */}
                    <div style={{ flexShrink: 0, paddingBottom: 16 }}>
                        <ShopAssistant storageKey="modal" onOpenBag={onOpenBag} />
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${BORDER}`, padding: "14px 0", flexShrink: 0 }}>
                        <button className="tsm-start-btn" onClick={handleSkip} style={{
                            background: GOLD_L, color: "#17130B", border: "none", height: 44, padding: "0 22px",
                            borderRadius: 999, fontFamily: FONT, fontSize: 15, fontWeight: 600, cursor: "pointer",
                            transition: "opacity 0.2s, transform 0.2s",
                        }}>
                            Start shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
