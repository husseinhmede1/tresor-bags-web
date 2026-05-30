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
            <header style={S.header}>
                <div style={S.headerLeft}>
                    <button onClick={() => navigate("/")} style={S.backLink}>←</button>
                    <span style={S.headerDivider} />
                    <span style={S.headerBrand}>Trésor Bags</span>
                </div>
                <p style={S.headerLabel}>Gallery</p>
            </header>

            {/* ── Main layout ── */}
            <div style={S.layout}>

                {/* Left — image viewer */}
                <div style={S.imageCol}>
                    {/* Main image — no container box, bleeds on dark */}
                    <div style={S.mainImgWrap}>
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
                        <div style={S.thumbStrip}>
                            {allImages.map((img, i) => (
                                <div key={i} style={S.thumbWrap}>
                                    <img
                                        src={img}
                                        alt={`View ${i + 1}`}
                                        className={`gallery-thumb${selectedImage === img ? " active" : ""}`}
                                        style={S.thumb}
                                        onClick={() => setSelectedImage(img)}
                                    />
                                    <button
                                        style={S.thumbExpand}
                                        onClick={() => window.open(img, "_self")}
                                        title="View full"
                                    >⤢</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right — details */}
                <div style={S.detailCol}>

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
                            <div style={S.specsGrid}>
                                {specs.map(([label, value], i) => (
                                    <div key={label} style={{
                                        ...S.specCell,
                                        borderLeft: i % 3 !== 0 ? `1px solid ${BORDER_GOLD}` : "none",
                                        borderTop: i >= 3 ? `1px solid ${BORDER_GOLD}` : "none",
                                    }}>
                                        <span style={S.specKey}>{label}</span>
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
        gap: 1,
        borderTop: `1px solid ${BORDER}`,
        background: BORDER,
        overflow: "hidden",
        flexShrink: 0,
    },
    thumbWrap: {
        position: "relative",
        flex: "1 1 0",
        minWidth: 0,
        aspectRatio: "1",
        overflow: "hidden",
        background: "#060606",
    },
    thumb: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
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
        padding: "56px 48px",
        overflowY: "auto",
        borderLeft: `1px solid ${BORDER}`,
    },
    collectionLabel: {
        fontSize: 9,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: MUTED,
        margin: "0 0 16px",
        fontFamily: SANS,
    },
    title: {
        fontFamily: SERIF,
        fontSize: "clamp(28px, 4vw, 42px)",
        fontWeight: 400,
        color: TEXT,
        margin: "0 0 24px",
        lineHeight: 1.15,
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
        margin: "28px 0",
    },

    /* Description */
    description: {
        fontFamily: SERIF,
        fontSize: 15,
        color: "rgba(245,241,232,0.65)",
        lineHeight: 1.9,
        fontStyle: "italic",
        margin: 0,
    },

    /* Specs */
    specSection: { marginTop: 0 },
    specHeading: {
        fontFamily: SANS,
        fontSize: 9,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: MUTED,
        margin: "0 0 20px",
    },
    specsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
    },
    specCell: {
        padding: "16px 20px 16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    specKey: {
        fontFamily: SANS,
        fontSize: 9,
        color: MUTED,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
    },
    specVal: {
        fontFamily: SERIF,
        fontSize: 16,
        color: TEXT,
        fontWeight: 300,
        letterSpacing: "0.02em",
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
