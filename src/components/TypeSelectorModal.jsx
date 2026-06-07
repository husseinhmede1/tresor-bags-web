import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTypes, deleteType } from "../services/typeService";
import { useAuth } from "../context/AuthContext";

/* ── Tokens ── */
const GOLD   = "#dfa94b";
const GOLD_L = "#E5C48A";
const GOLD_D = "#C9A86A";
const BG     = "#080808";
const BORDER = "rgba(201,168,106,0.15)";
const MUTED  = "#6B6560";
const TEXT   = "#F5F1E8";
const SERIF  = "'Cormorant Garamond', serif";
const SANS   = "'Inter', sans-serif";

export default function TypeSelectorModal({ onStart, onSkip }) {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [types, setTypes]               = useState([]);
    const [selected, setSelected]         = useState(null); // type object
    const [mediaPhase, setMediaPhase]     = useState("video"); // "video" | "logo"
    const [logoSrc, setLogoSrc]           = useState("");
    const [logoVisible, setLogoVisible]   = useState(false);
    const [loading, setLoading]           = useState(true);
    const videoRef                        = useRef(null);

    useEffect(() => {
        getAllTypes()
            .then(res => { if (res.success) setTypes(res.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSelectType = (type) => {
        if (selected?._id === type._id) return;
        setSelected(type);
        if (type.logo) {
            setLogoVisible(false);
            setTimeout(() => {
                setLogoSrc(type.logo);
                setMediaPhase("logo");
                setTimeout(() => setLogoVisible(true), 50);
            }, 300);
        } else {
            setMediaPhase("video");
            setLogoSrc("");
            setLogoVisible(false);
        }
    };

    const handleStart = () => {
        if (!selected) return;
        onStart(selected);
    };

    const handleSkip = () => {
        onSkip();
    };

    const handleDeleteType = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this type?")) return;
        try {
            await deleteType(id);
            setTypes(prev => prev.filter(t => t._id !== id));
            if (selected?._id === id) {
                setSelected(null);
                setMediaPhase("video");
                setLogoSrc("");
                setLogoVisible(false);
            }
        } catch { alert("Failed to delete type"); }
    };

    /* Inject keyframes */
    useEffect(() => {
        const s = document.createElement("style");
        s.id = "tsm-keyframes";
        s.textContent = `
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes tsmFadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
            .tsm-type-box:hover { border-color: rgba(201,168,106,0.4) !important; background: rgba(201,168,106,0.05) !important; }
            .tsm-add-box:hover  { border-color: rgba(201,168,106,0.35) !important; background: rgba(201,168,106,0.04) !important; }
            .tsm-start-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,106,0.35) !important; }
            .tsm-close-btn:hover { background: rgba(201,168,106,0.12) !important; color: #E5C48A !important; }
        `;
        if (!document.getElementById("tsm-keyframes")) document.head.appendChild(s);
        return () => { const el = document.getElementById("tsm-keyframes"); if (el) el.remove(); };
    }, []);

    return (
        <div style={S.overlay}>
            <div style={S.modal}>

                {/* ── TOP 50%: Media (video or logo) ── */}
                <div style={S.mediaWrap}>
                    {/* Video */}
                    <video
                        ref={videoRef}
                        src="/tummiVideo.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{
                            ...S.mediaFill,
                            opacity: mediaPhase === "video" ? 1 : 0,
                            transition: "opacity 0.4s ease",
                        }}
                    />
                    {/* Logo */}
                    {logoSrc && (
                        <img
                            src={logoSrc}
                            alt={selected?.title}
                            style={{
                                ...S.logoImg,
                                opacity: logoVisible ? 1 : 0,
                                transform: logoVisible ? "scale(1)" : "scale(0.92)",
                                transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                            }}
                        />
                    )}

                    {/* Overlay gradient */}
                    <div style={S.mediaGrad} />

                    {/* Brand label */}
                    <div style={S.mediaBrand}>
                        <span style={S.mediaBrandText}>TRÉSOR BAGS</span>
                        {selected && (
                            <span style={S.mediaTypeLabel}>{selected.title}</span>
                        )}
                    </div>

                    {/* Admin-only close button */}
                    {isAdmin && (
                        <button onClick={handleSkip} style={S.closeBtn} className="tsm-close-btn" title="Browse all">✕</button>
                    )}
                </div>

                {/* ── BOTTOM 50%: Type selector + footer ── */}
                <div style={S.bottomWrap}>
                    <p style={S.selectLabel}>
                        {selected ? `Selected: ${selected.title}` : "Choose your collection"}
                    </p>

                    {/* Type boxes grid */}
                    <div style={S.typesGrid}>
                        {loading ? (
                            <div style={S.loadingRow}>
                                <div style={S.spinner} />
                            </div>
                        ) : (
                            <>
                                {types.map(type => (
                                    <div
                                        key={type._id}
                                        className="tsm-type-box"
                                        style={{
                                            ...S.typeBox,
                                            ...(selected?._id === type._id ? S.typeBoxActive : {}),
                                        }}
                                        onClick={() => handleSelectType(type)}
                                    >
                                        {/* Logo thumbnail */}
                                        {type.logo
                                            ? <img src={type.logo} alt={type.title} style={S.typeBoxLogo} />
                                            : <span style={S.typeBoxInitial}>{type.title[0]}</span>
                                        }
                                        <span style={S.typeBoxTitle}>{type.title}</span>

                                        {/* Admin action icons */}
                                        {isAdmin && (
                                            <div style={S.typeAdminActions}>
                                                <button
                                                    style={S.typeIconBtn}
                                                    title="Edit type"
                                                    onClick={e => { e.stopPropagation(); navigate(`/admin/type/edit/${type._id}`); }}
                                                >✏️</button>
                                                <button
                                                    style={{ ...S.typeIconBtn, color: "#C9957A" }}
                                                    title="Delete type"
                                                    onClick={e => handleDeleteType(e, type._id)}
                                                >🗑️</button>
                                            </div>
                                        )}

                                        {/* Active check */}
                                        {selected?._id === type._id && (
                                            <div style={S.typeActiveCheck}>✓</div>
                                        )}
                                    </div>
                                ))}

                                {/* Admin: Add new type box */}
                                {isAdmin && (
                                    <div
                                        className="tsm-add-box"
                                        style={S.typeBoxAdd}
                                        onClick={() => navigate("/admin/type/add")}
                                        title="Add new type"
                                    >
                                        <span style={S.typeBoxAddPlus}>+</span>
                                        <span style={S.typeBoxAddLabel}>Add Type</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={S.footer}>
                        <div style={S.footerLeft}>
                            {selected && (
                                <span style={S.footerSelected}>
                                    ✓ {selected.title}
                                </span>
                            )}
                        </div>
                        <button
                            className="tsm-start-btn"
                            onClick={handleStart}
                            disabled={!selected}
                            style={{
                                ...S.startBtn,
                                opacity: selected ? 1 : 0.28,
                                cursor: selected ? "pointer" : "not-allowed",
                                pointerEvents: selected ? "auto" : "none",
                            }}
                        >
                            Enter Collection →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Styles ── */
const MODAL_H = "min(92vh, 680px)";
const MEDIA_H = "min(46vh, 340px)";

const S = {
    overlay: {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
    },
    modal: {
        width: "min(640px, 100%)",
        height: MODAL_H,
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(201,168,106,0.08)",
        animation: "tsmFadeIn 0.35s cubic-bezier(0.22,1,0.36,1)",
    },

    /* Media top half */
    mediaWrap: {
        position: "relative",
        flexShrink: 0,
        height: MEDIA_H,
        background: "#030303",
        overflow: "hidden",
    },
    mediaFill: {
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover",
    },
    logoImg: {
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "contain",
        padding: "10%",
        background: "#050505",
    },
    mediaGrad: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "50%",
        background: "linear-gradient(to top, rgba(8,8,8,0.95), transparent)",
        pointerEvents: "none",
    },
    mediaBrand: {
        position: "absolute", bottom: 16, left: 24,
        display: "flex", flexDirection: "column", gap: 4,
    },
    mediaBrandText: {
        fontFamily: SERIF,
        fontSize: 18, fontWeight: 700,
        color: GOLD_L,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
    },
    mediaTypeLabel: {
        fontFamily: SANS,
        fontSize: 10, color: MUTED,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        transition: "opacity 0.3s",
    },
    closeBtn: {
        position: "absolute", top: 12, right: 12,
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${BORDER}`,
        color: MUTED, borderRadius: "50%",
        width: 30, height: 30,
        cursor: "pointer", fontSize: 13,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
    },

    /* Bottom half */
    bottomWrap: {
        flex: 1,
        display: "flex", flexDirection: "column",
        padding: "18px 24px 0",
        overflowY: "auto",
        background: BG,
        minHeight: 0,
    },
    selectLabel: {
        fontFamily: SANS, fontSize: 10,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: MUTED, margin: "0 0 12px",
        flexShrink: 0,
    },

    /* Types grid */
    typesGrid: {
        display: "flex", flexWrap: "wrap",
        gap: 10, flex: 1,
        alignContent: "flex-start",
    },
    loadingRow: {
        width: "100%", display: "flex", justifyContent: "center", padding: 20,
    },
    spinner: {
        width: 20, height: 20,
        border: `1px solid ${BORDER}`,
        borderTop: `1px solid ${GOLD}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    typeBox: {
        position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 6,
        width: 90, minHeight: 88,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        cursor: "pointer",
        background: "rgba(255,255,255,0.02)",
        padding: "10px 8px",
        transition: "border-color 0.25s, background 0.25s",
        overflow: "hidden",
    },
    typeBoxActive: {
        border: `1px solid ${GOLD_D}`,
        background: "rgba(201,168,106,0.07)",
    },
    typeBoxLogo: {
        width: 44, height: 44,
        objectFit: "contain",
        borderRadius: 2,
    },
    typeBoxInitial: {
        width: 44, height: 44,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: SERIF, fontSize: 22, color: GOLD_L,
        background: "rgba(201,168,106,0.08)",
        borderRadius: 2,
    },
    typeBoxTitle: {
        fontFamily: SANS, fontSize: 9,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: MUTED, textAlign: "center",
        lineHeight: 1.3,
    },
    typeActiveCheck: {
        position: "absolute", top: 4, right: 4,
        fontSize: 9, color: GOLD_L,
        fontWeight: 700,
    },
    typeAdminActions: {
        position: "absolute", bottom: 2, right: 2,
        display: "flex", gap: 2,
    },
    typeIconBtn: {
        background: "rgba(0,0,0,0.5)",
        border: "none", borderRadius: 2,
        cursor: "pointer", fontSize: 10,
        padding: "2px 3px",
        lineHeight: 1,
    },
    typeBoxAdd: {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 4,
        width: 90, minHeight: 88,
        border: `1px dashed rgba(201,168,106,0.2)`,
        borderRadius: 2,
        cursor: "pointer",
        background: "transparent",
        padding: "10px 8px",
        transition: "border-color 0.25s, background 0.25s",
    },
    typeBoxAddPlus: {
        fontSize: 22, color: "rgba(201,168,106,0.3)",
        lineHeight: 1, fontWeight: 300,
    },
    typeBoxAddLabel: {
        fontFamily: SANS, fontSize: 9,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(107,101,96,0.5)",
    },

    /* Footer */
    footer: {
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        borderTop: `1px solid ${BORDER}`,
        padding: "14px 0",
        marginTop: 14,
        flexShrink: 0,
    },
    footerLeft: { display: "flex", alignItems: "center", gap: 8 },
    footerSelected: {
        fontFamily: SANS, fontSize: 10,
        letterSpacing: "0.1em",
        color: GOLD_D,
        textTransform: "uppercase",
    },
    startBtn: {
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
        transition: "opacity 0.2s, transform 0.2s",
    },
};
