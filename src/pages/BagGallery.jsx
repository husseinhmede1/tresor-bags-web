import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBagById } from "../services/bagService";

/* ── Tokens (mirrors BagListing) ── */
const GOLD_L  = "#E5C48A";
const GOLD_D  = "#C9A86A";
const MUTED   = "#6B6560";
const TEXT    = "#F5F1E8";
const BORDER  = "rgba(255,255,255,0.06)";
const BORDER_GOLD = "rgba(201,168,106,0.15)";
const SERIF   = "'Cormorant Garamond', serif";
const SANS    = "'Inter', sans-serif";

const BagGallery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bag, setBag] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin { to { transform: rotate(360deg); } }
            .gallery-thumb { opacity: 0.45; transition: opacity 0.3s ease; cursor: pointer; }
            .gallery-thumb:hover { opacity: 0.75; }
            .gallery-thumb.active { opacity: 1; }
            .expand-btn:hover { opacity: 0.6; }
            .thumb-wrap:hover .thumb-expand { opacity: 1 !important; }

            /* Spec cell borders — 3-col desktop */
            .bg-spec-cell { border-left: none; border-top: none; }
            .bg-specs-grid .bg-spec-cell:nth-child(3n+2),
            .bg-specs-grid .bg-spec-cell:nth-child(3n+3) { border-left: 1px solid rgba(201,168,106,0.15); }
            .bg-specs-grid .bg-spec-cell:nth-child(n+4) { border-top: 1px solid rgba(201,168,106,0.15); }

            /* 2-col on mobile */
            @media (max-width: 768px) {
                .bg-specs-grid .bg-spec-cell:nth-child(3n+2),
                .bg-specs-grid .bg-spec-cell:nth-child(3n+3) { border-left: none; }
                .bg-specs-grid .bg-spec-cell:nth-child(n+4) { border-top: none; }
                .bg-specs-grid .bg-spec-cell:nth-child(2n) { border-left: 1px solid rgba(201,168,106,0.15); }
                .bg-specs-grid .bg-spec-cell:nth-child(n+3) { border-top: 1px solid rgba(201,168,106,0.15); }
            }

            /* ── Mobile: single-column vertical flow ── */
            @media (max-width: 768px) {
                .bg-layout {
                    grid-template-columns: 1fr !important;
                }
                .bg-image-col {
                    position: relative !important;
                    top: 0 !important;
                    height: auto !important;
                    min-height: 320px !important;
                }
                .bg-main-img-wrap {
                    min-height: 280px !important;
                    max-height: 56vw !important;
                }
                .bg-detail-col {
                    padding: 32px 20px 56px !important;
                    border-left: none !important;
                    border-top: 1px solid rgba(255,255,255,0.06) !important;
                }
                .bg-thumb-strip {
                    gap: 6px !important;
                    padding: 10px 12px !important;
                    background: #060606 !important;
                    border-top: 1px solid rgba(255,255,255,0.06) !important;
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    justify-content: flex-start !important;
                }
                .bg-thumb-wrap {
                    flex: 0 0 72px !important;
                    height: 72px !important;
                    width: 72px !important;
                    aspect-ratio: 1 !important;
                    border-radius: 4px !important;
                    overflow: hidden !important;
                }
                .bg-specs-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
                .bg-header {
                    padding: 14px 20px !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        getBagById(id)
            .then(result => {
                if (result.success) {
                    setBag(result.data);
                    setSelectedImage(result.data.mainImage);
                } else setError("Failed to load details");
            })
            .catch(err => setError(err.message || "Failed to fetch bag"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={S.stateWrap}>
            <div style={S.spinner} />
        </div>
    );

    if (error || !bag) return (
        <div style={S.stateWrap}>
            <p style={S.stateText}>{error || "Piece not found"}</p>
            <button onClick={() => navigate("/")} style={S.backLink}>← Return to collection</button>
        </div>
    );

    const allImages = [...new Set([...(bag.mainImage ? [bag.mainImage] : []), ...(bag.sideImages || [])])];

    const specs = [
        ["Height",   bag.dimensions?.height ? `${bag.dimensions.height} cm` : null],
        ["Width",    bag.dimensions?.width  ? `${bag.dimensions.width} cm`  : null],
        ["Depth",    bag.dimensions?.depth  ? `${bag.dimensions.depth} cm`  : null],
        ["Weight",   bag.weight             ? `${bag.weight} kg`            : null],
        ["Colour",   bag.color              || null],
        ["Capacity", bag.capacity           || null],
    ].filter(([, v]) => v);

    const discountedPrice = bag.categoryId?.discount > 0
        ? (bag.price * (1 - bag.categoryId.discount / 100)).toFixed(2)
        : null;

    return (
        <div style={S.page}>

            {/* ── Header ── */}
            <header style={S.header} className="bg-header">
                <div style={S.headerLeft}>
                    <button onClick={() => navigate("/")} style={S.backLink}>←</button>
                    <span style={S.headerDivider} />
                    <span style={S.headerBrand}>Trésor Bags</span>
                </div>
                <p style={S.headerLabel}>Gallery</p>
            </header>

            {/* ── Main layout ── */}
            <div style={S.layout} className="bg-layout">

                {/* Left — image viewer */}
                <div style={S.imageCol} className="bg-image-col">
                    {/* Main image */}
                    <div style={S.mainImgWrap} className="bg-main-img-wrap">
                        <img
                            src={selectedImage}
                            alt={bag.title}
                            style={S.mainImg}
                        />
                        <button
                            style={S.expandBtn}
                            className="expand-btn"
                            onClick={() => window.open(selectedImage, "_self")}
                            title="View full"
                        >
                            ⤢
                        </button>
                    </div>

                    {/* Thumbnail strip */}
                    {allImages.length > 1 && (
                        <div style={S.thumbStrip} className="bg-thumb-strip">
                            {allImages.map((img, i) => {
                                const isActive = selectedImage === img;
                                return (
                                    <div key={i} style={{
                                        ...S.thumbWrap,
                                        outline: isActive ? `1px solid ${GOLD_L}` : "1px solid transparent",
                                    }} className="bg-thumb-wrap thumb-wrap">
                                        <img
                                            src={img}
                                            alt={`View ${i + 1}`}
                                            style={{
                                                ...S.thumb,
                                                opacity: isActive ? 1 : 0.4,
                                                transition: "opacity 0.3s ease",
                                            }}
                                            onClick={() => setSelectedImage(img)}
                                        />
                                        <button
                                            style={S.thumbExpand}
                                            className="thumb-expand"
                                            onClick={() => window.open(img, "_self")}
                                            title="View full"
                                        >⤢</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right — details */}
                <div style={S.detailCol} className="bg-detail-col">

                    {/* Collection label */}
                    {bag.categoryId?.title && (
                        <p style={S.collectionLabel}>{bag.categoryId.title}</p>
                    )}

                    {/* Title */}
                    <h1 style={S.title}>{bag.title}</h1>

                    {/* Price */}
                    <div style={S.priceWrap}>
                        {discountedPrice ? (
                            <>
                                <span style={S.priceOld}>${bag.price}</span>
                                <span style={S.priceFinal}>${discountedPrice}</span>
                                <span style={S.discountLabel}>−{bag.categoryId.discount}%</span>
                            </>
                        ) : (
                            <span style={S.priceFinal}>${bag.price}</span>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={S.divider} />

                    {/* Description */}
                    <p style={S.description}>{bag.description}</p>

                    {/* Divider */}
                    <div style={S.divider} />

                    {/* Specifications — minimal grid */}
                    {specs.length > 0 && (
                        <div style={S.specSection}>
                            <p style={S.specHeading}>Specifications</p>
                            <div style={S.specsGrid} className="bg-specs-grid">
                                {specs.map(([label, value], i) => (
                                    <div key={label} style={S.specCell} className={`bg-spec-cell spec-cell-${i}`}>
                                        <span style={S.specKey}>{label.toUpperCase()}</span>
                                        <span style={S.specVal}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const S = {
    page: {
        minHeight: "100vh",
        background: "#080808",
        color: TEXT,
        fontFamily: SANS,
        position: "relative",
    },

    /* Header */
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        background: "rgba(8,8,8,0.96)",
        borderBottom: `1px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 16 },
    backLink: {
        background: "none",
        border: "none",
        color: MUTED,
        fontSize: 18,
        cursor: "pointer",
        padding: 0,
        lineHeight: 1,
        fontFamily: SERIF,
        transition: "color 0.2s",
    },
    headerDivider: {
        display: "inline-block",
        width: 1,
        height: 14,
        background: "rgba(255,255,255,0.1)",
    },
    headerBrand: {
        fontFamily: SERIF,
        fontSize: 15,
        color: GOLD_L,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
    },
    headerLabel: {
        fontFamily: SANS,
        fontSize: 10,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: MUTED,
        margin: 0,
    },

    /* Layout */
    layout: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - 57px)",
        "@media(max-width:768px)": { gridTemplateColumns: "1fr" },
    },

    /* Image column */
    imageCol: {
        background: "#060606",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 57,
        height: "calc(100vh - 57px)",
        overflow: "hidden",
    },
    mainImgWrap: {
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    mainImg: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        padding: "32px",
        transition: "opacity 0.3s ease",
    },
    expandBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        background: "none",
        border: "none",
        color: MUTED,
        fontSize: 18,
        cursor: "pointer",
        padding: 4,
        lineHeight: 1,
        transition: "opacity 0.2s",
        opacity: 0.5,
    },

    /* Thumbnail strip */
    thumbStrip: {
        display: "flex",
        gap: 8,
        padding: "12px",
        borderTop: `1px solid ${BORDER}`,
        background: "#060606",
        overflow: "hidden",
        flexShrink: 0,
        flexWrap: "wrap",
    },
    thumbWrap: {
        position: "relative",
        flex: "1 1 0",
        minWidth: 60,
        maxWidth: 90,
        aspectRatio: "1",
        overflow: "hidden",
        background: "#060606",
        borderRadius: 3,
        cursor: "pointer",
    },
    thumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        cursor: "pointer",
    },
    thumbExpand: {
        position: "absolute",
        bottom: 4,
        right: 4,
        background: "none",
        border: "none",
        color: "rgba(229,196,138,0.5)",
        fontSize: 12,
        cursor: "pointer",
        padding: 2,
        lineHeight: 1,
        opacity: 0,
        transition: "opacity 0.2s",
    },

    /* Detail column */
    detailCol: {
        padding: "48px 48px 64px",
        overflowY: "auto",
        borderLeft: `1px solid ${BORDER}`,
    },
    collectionLabel: {
        fontSize: 9,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: MUTED,
        margin: "0 0 14px",
        fontFamily: SANS,
        display: "block",
    },
    title: {
        fontFamily: SERIF,
        fontSize: "clamp(26px, 3.5vw, 42px)",
        fontWeight: 400,
        color: TEXT,
        margin: "0 0 28px",
        lineHeight: 1.2,
        letterSpacing: "0.03em",
    },

    /* Price */
    priceWrap: {
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 32,
        flexWrap: "wrap",
    },
    priceOld: {
        fontFamily: SERIF,
        fontSize: 18,
        color: MUTED,
        textDecoration: "line-through",
        fontWeight: 300,
    },
    priceFinal: {
        fontFamily: SERIF,
        fontSize: 28,
        color: GOLD_L,
        fontWeight: 300,
        letterSpacing: "0.04em",
    },
    discountLabel: {
        fontFamily: SANS,
        fontSize: 10,
        color: "#C9957A",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        alignSelf: "center",
    },

    /* Divider */
    divider: {
        height: 1,
        background: BORDER,
        margin: "24px 0",
    },

    /* Description */
    description: {
        fontFamily: SERIF,
        fontSize: 15,
        color: "rgba(245,241,232,0.65)",
        lineHeight: 1.9,
        fontStyle: "italic",
        margin: "0 0 4px",
    },

    /* Specs */
    specSection: { marginTop: 4 },
    specHeading: {
        fontFamily: SANS,
        fontSize: 9,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: MUTED,
        margin: "0 0 16px",
    },
    specsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
    },
    specCell: {
        padding: "14px 16px 14px 0",
        display: "flex",
        flexDirection: "column",
        gap: 5,
    },
    specKey: {
        fontFamily: SANS,
        fontSize: 8,
        color: MUTED,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
    },
    specVal: {
        fontFamily: SERIF,
        fontSize: 15,
        color: TEXT,
        fontWeight: 300,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
    },

    /* State screens */
    stateWrap: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        gap: 20,
    },
    spinner: {
        width: 24,
        height: 24,
        border: "1px solid rgba(255,255,255,0.06)",
        borderTop: `1px solid ${GOLD_D}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    stateText: {
        fontFamily: SERIF,
        fontSize: 18,
        color: MUTED,
        fontStyle: "italic",
        margin: 0,
    },
};

export default BagGallery;
