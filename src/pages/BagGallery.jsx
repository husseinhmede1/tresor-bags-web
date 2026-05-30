import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBagById } from "../services/bagService";

const BagGallery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bag, setBag] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBag = async () => {
            try {
                const result = await getBagById(id);
                if (result.success) {
                    setBag(result.data);
                    setSelectedImage(result.data.mainImage);
                } else {
                    setError("Failed to load bag details");
                }
            } catch (err) {
                setError(err.message || "Failed to fetch bag");
            } finally {
                setLoading(false);
            }
        };

        fetchBag();
    }, [id]);

    const openFullImage = (url) => {
        window.open(url, "_self");
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading gallery...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate("/")} style={styles.backBtn}>
                    Go Back
                </button>
            </div>
        );
    }

    if (!bag) {
        return (
            <div style={styles.errorContainer}>
                <h2>Bag not found</h2>
                <button onClick={() => navigate("/")} style={styles.backBtn}>
                    Go Back
                </button>
            </div>
        );
    }

    const allImages = [...new Set([...(bag.mainImage ? [bag.mainImage] : []), ...(bag.sideImages || [])])];

    return (
        <div style={styles.page}>
            {/* Header */}
            <header style={styles.header}>
                <h1 style={styles.headerTitle}>TRÉSOR BAGS - Gallery</h1>
                <button onClick={() => navigate("/")} style={styles.backBtn}>
                    ← Back
                </button>
            </header>

            <main style={styles.container}>
                {/* Main Image Display */}
                <div style={styles.mainImageSection}>
                    <div style={styles.mainImageContainer}>
                        <img
                            src={selectedImage}
                            alt={bag.title}
                            style={styles.mainImage}
                        />
                        {/* Fullscreen button on main image */}
                        <button
                            style={styles.fullscreenBtn}
                            onClick={() => openFullImage(selectedImage)}
                            title="View full image"
                        >
                            🔍
                        </button>
                    </div>
                </div>

                {/* Bag Details */}
                <div style={styles.detailsSection}>
                    {/* Category badge */}
                    {bag.categoryId?.title && (
                        <span style={styles.catBadge}>{bag.categoryId.title}</span>
                    )}
                    <h1 style={styles.title}>{bag.title}</h1>
                    <p style={styles.description}>{bag.description}</p>

                    <div style={styles.priceSection}>
                        {bag.categoryId?.discount > 0 ? (
                            <div style={styles.priceRow}>
                                <span style={styles.priceOld}>${bag.price}</span>
                                <span style={styles.price}>${(bag.price * (1 - bag.categoryId.discount / 100)).toFixed(2)}</span>
                                <span style={styles.discountBadge}>-{bag.categoryId.discount}%</span>
                            </div>
                        ) : (
                            <p style={styles.price}>${bag.price}</p>
                        )}
                    </div>

                    <div style={styles.specSection}>
                        <h3 style={styles.specTitle}>Specifications</h3>
                        <div style={styles.specGrid}>
                            {bag.dimensions?.height && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Height:</span>
                                    <span style={styles.specValue}>{bag.dimensions.height} cm</span>
                                </div>
                            )}
                            {bag.dimensions?.width && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Width:</span>
                                    <span style={styles.specValue}>{bag.dimensions.width} cm</span>
                                </div>
                            )}
                            {bag.dimensions?.depth && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Depth:</span>
                                    <span style={styles.specValue}>{bag.dimensions.depth} cm</span>
                                </div>
                            )}
                            {bag.weight && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Weight:</span>
                                    <span style={styles.specValue}>{bag.weight} kg</span>
                                </div>
                            )}
                            {bag.color && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Color:</span>
                                    <span style={styles.specValue}>{bag.color}</span>
                                </div>
                            )}
                            {bag.capacity && (
                                <div style={styles.specItem}>
                                    <span style={styles.specLabel}>Capacity:</span>
                                    <span style={styles.specValue}>{bag.capacity}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
                <div style={styles.thumbnailSection}>
                    <h3 style={styles.thumbnailTitle}>Gallery ({allImages.length} images)</h3>
                    <div style={styles.thumbnailGrid}>
                        {allImages.map((image, index) => (
                            <div key={index} style={styles.thumbnailWrapper}>
                                <img
                                    src={image}
                                    alt={`Gallery item ${index + 1}`}
                                    style={{
                                        ...styles.thumbnail,
                                        ...(selectedImage === image && styles.activeThumbnail),
                                    }}
                                    onClick={() => setSelectedImage(image)}
                                />
                                {/* Fullscreen button on each thumbnail */}
                                <button
                                    style={styles.thumbFullscreenBtn}
                                    onClick={() => openFullImage(image)}
                                    title="View full image"
                                >
                                    🔍
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Inter', sans-serif",
        color: "#F5F1E8",
        position: "relative",
        zIndex: 1,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 40px",
        background: "rgba(10,10,10,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(14px)",
    },
    headerTitle: {
        fontSize: "26px",
        fontWeight: 800,
        margin: 0,
        color: "#E5C48A",
        fontFamily: "'Cormorant Garamond', serif",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
    },
    backBtn: {
        padding: "10px 20px",
        background: "transparent",
        color: "#E5C48A",
        border: "1px solid rgba(229,196,138,0.45)",
        borderRadius: "999px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "700",
        transition: "all 0.3s ease",
    },
    container: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "32px",
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
    },
    mainImageSection: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    mainImageContainer: {
        width: "100%",
        maxWidth: "100%",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,0.25)",
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
    },
    mainImage: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        padding: "20px",
    },
    fullscreenBtn: {
        position: "absolute",
        top: "12px",
        right: "12px",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(229,196,138,0.5)",
        color: "#E5C48A",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        backdropFilter: "blur(6px)",
        transition: "all 0.2s ease",
        zIndex: 10,
        lineHeight: 1,
    },
    detailsSection: {
        background: "rgba(18,18,18,0.94)",
        padding: "36px",
        borderRadius: "24px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    catBadge: { display: "inline-block", fontSize: 11, fontWeight: 700, color: "#E5C48A", background: "rgba(229,196,138,0.1)", border: "1px solid rgba(229,196,138,0.2)", borderRadius: 999, padding: "4px 12px", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 },
    title: {
        fontSize: "34px",
        fontWeight: "800",
        color: "#F5F1E8",
        margin: "0 0 18px",
        fontFamily: "'Cormorant Garamond', serif",
    },
    description: {
        fontSize: "15px",
        color: "#A7A19A",
        lineHeight: "1.8",
        marginBottom: "28px",
    },
    priceSection: {
        padding: "22px 24px",
        background: "rgba(201,168,106,0.12)",
        borderRadius: "18px",
        marginBottom: "24px",
        border: "1px solid rgba(229,196,138,0.16)",
    },
    priceRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    priceOld: { fontSize: "22px", fontWeight: 600, color: "#FF6B6B", textDecoration: "line-through" },
    price: { fontSize: "34px", fontWeight: "800", color: "#E5C48A", margin: 0 },
    discountBadge: { fontSize: 13, fontWeight: 700, color: "#fff", background: "#FF6B6B", borderRadius: 999, padding: "4px 12px" },
    specSection: {},
    specTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#F5F1E8",
        marginBottom: "18px",
    },
    specGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
    },
    specItem: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "16px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    specLabel: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#A7A19A",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    specValue: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#F5F1E8",
    },
    thumbnailSection: {
        padding: "24px 32px 40px",
        maxWidth: "1400px",
        margin: "0 auto",
    },
    thumbnailTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#F5F1E8",
        marginBottom: "16px",
    },
    thumbnailGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "16px",
    },
    thumbnailWrapper: {
        position: "relative",
        display: "inline-block",
        width: "100%",
    },
    thumbnail: {
        width: "100%",
        aspectRatio: "1",
        objectFit: "cover",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: "2px solid transparent",
        opacity: 0.75,
        display: "block",
    },
    activeThumbnail: {
        opacity: 1,
        border: "2px solid #E5C48A",
        boxShadow: "0 14px 28px rgba(229,196,138,0.18)",
    },
    thumbFullscreenBtn: {
        position: "absolute",
        top: "6px",
        right: "6px",
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(229,196,138,0.5)",
        color: "#E5C48A",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        backdropFilter: "blur(4px)",
        transition: "all 0.2s ease",
        zIndex: 10,
        lineHeight: 1,
        padding: 0,
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Inter', sans-serif",
        color: "#A7A19A",
        position: "relative",
        zIndex: 1,
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(255,255,255,0.1)",
        borderTop: "4px solid #E5C48A",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "16px",
    },
    errorContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Inter', sans-serif",
        color: "#F5F1E8",
        position: "relative",
        zIndex: 1,
    },
};

export default BagGallery;
