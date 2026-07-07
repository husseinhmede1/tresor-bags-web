import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllTypes } from "../services/typeService";
import { getAllCollections } from "../services/collectionService";

/* ── Field must live OUTSIDE BagForm so it isn't recreated on every render ── */
const Field = ({ label, required, error, children }) => (
    <div style={S.formGroup}>
        <label style={S.label}>{label}{required && " *"}</label>
        {children}
        {error && <p style={S.fieldError}>{error}</p>}
    </div>
);

const BagForm = ({ bagId = null, initialData = null, onSubmit, title = "Add New Bag" }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        mainImage: "",
        sideImages: [],
        dimensions: { height: "", width: "", depth: "" },
        weight: "",
        color: "",
        capacity: "",
        typeId: "",
        collectionId: "",
        stock: "",
        gender: "",
    });

    const [errors, setErrors]                       = useState({});
    const [loading, setLoading]                     = useState(false);
    const [imagePreview, setImagePreview]           = useState("");
    const [sideImagePreviews, setSideImagePreviews] = useState([]);
    const [types, setTypes]                         = useState([]);
    const [collections, setCollections]             = useState([]);

    /* ── Global CSS ── */
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            @keyframes spin { to { transform: rotate(360deg); } }

            .bf-upload:hover  { border-color: rgba(229,196,138,0.7) !important; background: rgba(229,196,138,0.06) !important; }
            .bf-add:hover     { border-color: rgba(229,196,138,0.7) !important; background: rgba(229,196,138,0.12) !important; }
            .bf-input:focus   { border-color: rgba(229,196,138,0.5) !important; background: rgba(229,196,138,0.04) !important; }
            select.bf-input   { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23E5C48A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px !important; }
            select.bf-input option { background: #111; color: #F5F1E8; }
            .bf-submit:hover  { box-shadow: 0 28px 56px rgba(201,168,106,0.36) !important; }
            .bf-cancel:hover  { background: rgba(255,255,255,0.08) !important; }
            .bf-logout:hover  { background: rgba(229,196,138,0.1) !important; }

            /* Tablet */
            @media (max-width: 860px) {
                .bf-split   { grid-template-columns: 1fr !important; }
                .bf-header  { padding: 16px 20px !important; }
                .bf-htitle  { font-size: 20px !important; }
                .bf-main    { margin: 24px auto !important; padding: 0 16px 48px !important; }
            }
            /* Mobile */
            @media (max-width: 540px) {
                .bf-header  { padding: 14px 14px !important; gap: 10px !important; flex-wrap: wrap !important; }
                .bf-htitle  { font-size: 17px !important; letter-spacing: 0.04em !important; }
                .bf-eyebrow { font-size: 10px !important; }
                .bf-logout  { padding: 8px 14px !important; font-size: 11px !important; }
                .bf-card    { padding: 18px 16px !important; border-radius: 18px !important; }
                .bf-2col    { grid-template-columns: 1fr !important; gap: 0 !important; }
                .bf-main    { padding: 0 10px 40px !important; margin: 16px auto !important; }
                .bf-gallery { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                typeId: initialData.typeId?._id || initialData.typeId || "",
                collectionId: initialData.collectionId?._id || initialData.collectionId || "",
                gender: initialData.gender || "",
            });
            if (initialData.mainImage)  setImagePreview(initialData.mainImage);
            if (initialData.sideImages) setSideImagePreviews(initialData.sideImages);
        }
    }, [initialData]);

    useEffect(() => {
        getAllTypes().then(res => { if (res.success) setTypes(res.data); }).catch(() => {});
        getAllCollections().then(res => { if (res.success) setCollections(res.data); }).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes("dimensions.")) {
            const field = name.split(".")[1];
            setFormData(p => ({ ...p, dimensions: { ...p.dimensions, [field]: value ? Number(value) : "" } }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
        if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFormData(p => ({ ...p, mainImage: ev.target.result }));
            setImagePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSideImageAdd = (e) => {
        const files = Array.from(e.target.files);
        if (sideImagePreviews.length + files.length > 10) {
            setErrors(p => ({ ...p, sideImages: "Maximum 10 side images allowed" }));
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSideImagePreviews(p => [...p, ev.target.result]);
                setFormData(p => ({ ...p, sideImages: [...p.sideImages, ev.target.result] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveSideImage = (i) => {
        setSideImagePreviews(p => p.filter((_, j) => j !== i));
        setFormData(p => ({ ...p, sideImages: p.sideImages.filter((_, j) => j !== i) }));
    };

    const handleRemoveMainImage = () => {
        setFormData(p => ({ ...p, mainImage: "" }));
        setImagePreview("");
    };

    const validateForm = () => {
        const e = {};
        if (!formData.title.trim())       e.title       = "Title is required";
        if (!formData.description.trim()) e.description = "Description is required";
        if (!formData.price || formData.price < 0) e.price = "Valid price is required";
        if (!formData.mainImage)          e.mainImage   = "Main image is required";
        if (!formData.color.trim())       e.color       = "Color is required";
        if (!formData.typeId)             e.typeId      = "Type is required";
        if (!formData.collectionId)       e.collectionId = "Collection is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try { await onSubmit(formData); }
        catch (err) { setErrors({ submit: err.message }); }
        finally { setLoading(false); }
    };

    const handleCancel = () => navigate("/admin/dashboard");

    return (
        <div style={S.page}>

            {/* ── Header ── */}
            <header style={S.header} className="bf-header">
                <div>
                    <p style={S.eyebrow} className="bf-eyebrow">Admin Craft</p>
                    <h1 style={S.headerTitle} className="bf-htitle">
                        TRÉSOR BAGS — {title}
                    </h1>
                </div>
                <button style={S.logoutBtn} className="bf-logout" onClick={logout}>
                    Logout
                </button>
            </header>

            {/* ── Main ── */}
            <main style={S.container} className="bf-main">
                <form onSubmit={handleSubmit}>
                    {errors.submit && <div style={S.errorBox}>{errors.submit}</div>}

                    <div style={S.splitGrid} className="bf-split">

                        {/* ── LEFT: images ── */}
                        <div style={S.col}>

                            {/* Main Image */}
                            <div style={S.card} className="bf-card">
                                <div style={S.cardHeader}>
                                    <h2 style={S.cardTitle}>Main Image</h2>
                                    <span style={S.required}>Required</span>
                                </div>
                                {imagePreview ? (
                                    <div style={S.previewWrap}>
                                        <img src={imagePreview} alt="Main" style={S.previewImg} />
                                        <button type="button" style={S.removeMainBtn}
                                            onClick={handleRemoveMainImage}>
                                            Remove &amp; Reupload
                                        </button>
                                    </div>
                                ) : (
                                    <label style={S.uploadArea} className="bf-upload">
                                        <span style={S.uploadIcon}>📷</span>
                                        <span style={S.uploadText}>Upload hero image</span>
                                        <span style={S.uploadHint}>Click to browse</span>
                                        <input type="file" accept="image/*"
                                            onChange={handleMainImageChange} style={S.hidden} />
                                    </label>
                                )}
                                {errors.mainImage && <p style={S.fieldError}>{errors.mainImage}</p>}
                            </div>

                            {/* Gallery */}
                            <div style={S.card} className="bf-card">
                                <div style={S.cardHeader}>
                                    <h2 style={S.cardTitle}>Gallery Images</h2>
                                    <span style={S.badge}>{sideImagePreviews.length}/10</span>
                                </div>
                                <p style={S.cardSub}>Optional images for the luxury slider.</p>
                                <div style={S.gallery} className="bf-gallery">
                                    {sideImagePreviews.map((src, i) => (
                                        <div key={i} style={S.galleryItem}>
                                            <img src={src} alt={`Side ${i}`} style={S.galleryImg} />
                                            <button type="button" style={S.removeThumb}
                                                onClick={() => handleRemoveSideImage(i)}>✕</button>
                                        </div>
                                    ))}
                                    {sideImagePreviews.length < 10 && (
                                        <label style={S.addThumb} className="bf-add">
                                            <span style={S.addPlus}>+</span>
                                            <span style={S.addText}>Add</span>
                                            <input type="file" accept="image/*" multiple
                                                onChange={handleSideImageAdd} style={S.hidden} />
                                        </label>
                                    )}
                                </div>
                                {errors.sideImages && <p style={S.fieldError}>{errors.sideImages}</p>}
                            </div>
                        </div>

                        {/* ── RIGHT: details ── */}
                        <div style={S.col}>
                            <div style={S.card} className="bf-card">
                                <h2 style={{ ...S.cardTitle, marginBottom: 24 }}>Bag Details</h2>

                                <Field label="Title" required error={errors.title}>
                                    <input className="bf-input" type="text" name="title"
                                        value={formData.title} onChange={handleChange}
                                        placeholder="e.g., Classic Leather Tote"
                                        style={{ ...S.input, ...(errors.title ? S.inputErr : {}) }} />
                                </Field>

                                <Field label="Description" required error={errors.description}>
                                    <textarea className="bf-input" name="description"
                                        value={formData.description} onChange={handleChange}
                                        placeholder="Detailed description of the bag…"
                                        rows={5}
                                        style={{ ...S.input, ...S.textarea, ...(errors.description ? S.inputErr : {}) }} />
                                </Field>

                                <div style={S.twoCol} className="bf-2col">
                                    <Field label="Price ($)" required error={errors.price}>
                                        <input className="bf-input" type="number" name="price"
                                            value={formData.price} onChange={handleChange}
                                            placeholder="0.00" min="0" step="0.01"
                                            style={{ ...S.input, ...(errors.price ? S.inputErr : {}) }} />
                                    </Field>
                                    <Field label="Color" required error={errors.color}>
                                        <input className="bf-input" type="text" name="color"
                                            value={formData.color} onChange={handleChange}
                                            placeholder="e.g., Black"
                                            style={{ ...S.input, ...(errors.color ? S.inputErr : {}) }} />
                                    </Field>
                                </div>

                                <div style={S.twoCol} className="bf-2col">
                                    <Field label="Capacity">
                                        <input className="bf-input" type="text" name="capacity"
                                            value={formData.capacity} onChange={handleChange}
                                            placeholder="e.g., 20L" style={S.input} />
                                    </Field>
                                    <Field label="Weight (kg)">
                                        <input className="bf-input" type="number" name="weight"
                                            value={formData.weight} onChange={handleChange}
                                            placeholder="0.00" min="0" step="0.01" style={S.input} />
                                    </Field>
                                </div>

                                <div style={S.twoCol} className="bf-2col">
                                    <Field label="Height (cm)">
                                        <input className="bf-input" type="number" name="dimensions.height"
                                            value={formData.dimensions.height} onChange={handleChange}
                                            placeholder="0" min="0" style={S.input} />
                                    </Field>
                                    <Field label="Width (cm)">
                                        <input className="bf-input" type="number" name="dimensions.width"
                                            value={formData.dimensions.width} onChange={handleChange}
                                            placeholder="0" min="0" style={S.input} />
                                    </Field>
                                </div>

                                <div style={S.twoCol} className="bf-2col">
                                    <Field label="Depth (cm)">
                                        <input className="bf-input" type="number" name="dimensions.depth"
                                            value={formData.dimensions.depth} onChange={handleChange}
                                            placeholder="0" min="0" style={S.input} />
                                    </Field>
                                    <Field label="Stock (units)">
                                        <input className="bf-input" type="number" name="stock"
                                            value={formData.stock} onChange={handleChange}
                                            placeholder="0" min="0" style={S.input} />
                                    </Field>
                                </div>

                                <div style={S.twoCol} className="bf-2col">
                                    <Field label="Type" required error={errors.typeId}>
                                        <select
                                            className="bf-input"
                                            name="typeId"
                                            value={formData.typeId || ""}
                                            onChange={handleChange}
                                            style={{ ...S.input, cursor: "pointer", ...(errors.typeId ? S.inputErr : {}) }}
                                        >
                                            <option value="">— Select type —</option>
                                            {types.map(t => (
                                                <option key={t._id} value={t._id}>
                                                    {t.title} · {t.category}{t.discount > 0 ? ` (${t.discount}% off)` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Collection" required error={errors.collectionId}>
                                        <select
                                            className="bf-input"
                                            name="collectionId"
                                            value={formData.collectionId || ""}
                                            onChange={handleChange}
                                            style={{ ...S.input, cursor: "pointer", ...(errors.collectionId ? S.inputErr : {}) }}
                                        >
                                            <option value="">— Select collection —</option>
                                            {collections.map(c => (
                                                <option key={c._id} value={c._id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <Field label="Gender">
                                    <select
                                        className="bf-input"
                                        name="gender"
                                        value={formData.gender || ""}
                                        onChange={handleChange}
                                        style={{ ...S.input, cursor: "pointer" }}
                                    >
                                        <option value="">— Select gender —</option>
                                        <option value="Men's">Men's</option>
                                        <option value="Women's">Women's</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </Field>
                            </div>

                            {/* Publish panel */}
                            <div style={S.publishCard} className="bf-card">
                                <div style={S.publishTop}>
                                    <span style={S.publishDot} />
                                    <h3 style={S.publishTitle}>Ready to publish</h3>
                                </div>
                                <p style={S.publishText}>
                                    Save once the hero image and all specs are complete.
                                </p>
                                <div style={S.btnGroup}>
                                    <button type="submit" className="bf-submit"
                                        disabled={loading}
                                        style={{
                                            ...S.submitBtn,
                                            opacity: loading ? 0.7 : 1,
                                            cursor: loading ? "not-allowed" : "pointer",
                                        }}>
                                        {loading && <span style={S.spinnerInline} />}
                                        {loading ? "Saving…" : "Save Bag"}
                                    </button>
                                    <button type="button" className="bf-cancel"
                                        onClick={handleCancel} style={S.cancelBtn}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </main>
        </div>
    );
};

/* ── Tokens ── */
const GOLD   = "#dfa94b";
const GOLD_L = "#E5C48A";
const BG     = "#070707";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED  = "#A7A19A";
const TEXT   = "#F5F1E8";

const S = {
    page: {
        minHeight: "100vh",
        background: `radial-gradient(ellipse at top left, rgba(201,168,106,0.13), transparent 36%), ${BG}`,
        fontFamily: "'Inter', sans-serif",
        color: TEXT,
        overflowX: "hidden",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 36px",
        background: "rgba(7,7,7,0.94)",
        borderBottom: `1px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(18px)",
        gap: 12,
    },
    eyebrow: {
        fontSize: 11,
        color: MUTED,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        margin: "0 0 6px",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 700,
        margin: 0,
        color: GOLD_L,
        fontFamily: "'Cormorant Garamond', serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    },
    logoutBtn: {
        padding: "10px 22px",
        background: "transparent",
        color: GOLD_L,
        border: `1px solid rgba(229,196,138,0.4)`,
        borderRadius: 999,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background 0.2s",
    },
    container: {
        maxWidth: 1200,
        margin: "32px auto",
        padding: "0 20px 60px",
    },
    splitGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 28,
        alignItems: "start",
    },
    col: {
        display: "flex",
        flexDirection: "column",
        gap: 24,
    },
    card: {
        padding: "26px 24px",
        background: "rgba(255,255,255,0.035)",
        borderRadius: 22,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: TEXT,
        margin: 0,
        fontFamily: "'Cormorant Garamond', serif",
    },
    cardSub: {
        fontSize: 13,
        color: MUTED,
        margin: "0 0 18px",
        lineHeight: 1.7,
    },
    required: {
        fontSize: 11,
        color: GOLD,
        background: "rgba(223,169,75,0.1)",
        border: `1px solid rgba(223,169,75,0.22)`,
        borderRadius: 999,
        padding: "4px 10px",
        fontWeight: 700,
    },
    badge: {
        fontSize: 12,
        color: GOLD_L,
        background: "rgba(229,196,138,0.1)",
        border: `1px solid rgba(229,196,138,0.22)`,
        borderRadius: 999,
        padding: "4px 12px",
        fontWeight: 700,
    },
    uploadArea: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "44px 20px",
        border: "1.5px dashed rgba(229,196,138,0.32)",
        borderRadius: 18,
        cursor: "pointer",
        background: "rgba(255,255,255,0.02)",
        transition: "all 0.25s",
    },
    uploadIcon: { fontSize: 38, lineHeight: 1 },
    uploadText: { fontSize: 14, fontWeight: 700, color: TEXT },
    uploadHint: { fontSize: 12, color: MUTED },
    hidden: { display: "none" },
    previewWrap: {
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
    },
    previewImg: {
        width: "100%",
        display: "block",
        objectFit: "cover",
        maxHeight: 340,
    },
    removeMainBtn: {
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 20px",
        background: "rgba(201,168,106,0.95)",
        color: BG,
        border: "none",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
    },
    gallery: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
    },
    galleryItem: {
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        aspectRatio: "1/1",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${BORDER}`,
    },
    galleryImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    removeThumb: {
        position: "absolute", top: 8, right: 8,
        width: 26, height: 26,
        background: "rgba(255,255,255,0.9)",
        color: "#B83A3A",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    addThumb: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        aspectRatio: "1/1",
        borderRadius: 14,
        background: "rgba(229,196,138,0.06)",
        border: "1.5px dashed rgba(229,196,138,0.35)",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    addPlus: { fontSize: 28, color: GOLD_L, lineHeight: 1 },
    addText: { fontSize: 11, fontWeight: 700, color: GOLD_L, letterSpacing: "0.06em" },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        marginBottom: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: 700,
        color: MUTED,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
    },
    input: {
        padding: "13px 16px",
        border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 12,
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        background: "rgba(255,255,255,0.04)",
        color: TEXT,
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.2s, background 0.2s",
    },
    textarea: {
        resize: "vertical",
        minHeight: 120,
        lineHeight: 1.7,
    },
    inputErr: {
        borderColor: "#B83A3A",
        background: "rgba(184,58,58,0.07)",
    },
    fieldError: {
        color: GOLD,
        fontSize: 11,
        margin: "6px 0 0",
        fontWeight: 600,
    },
    twoCol: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        gap: 16,
    },
    publishCard: {
        padding: "24px",
        borderRadius: 22,
        background: "rgba(223,169,75,0.05)",
        border: `1px solid rgba(223,169,75,0.16)`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
    },
    publishTop: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    publishDot: {
        width: 8, height: 8,
        borderRadius: "50%",
        background: GOLD,
        boxShadow: `0 0 8px ${GOLD}`,
        flexShrink: 0,
    },
    publishTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: TEXT,
        margin: 0,
    },
    publishText: {
        color: MUTED,
        fontSize: 13,
        lineHeight: 1.75,
        margin: "0 0 20px",
    },
    btnGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    submitBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "15px 28px",
        background: `linear-gradient(135deg, #C9A86A, ${GOLD_L})`,
        color: BG,
        border: "none",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 18px 40px rgba(201,168,106,0.22)",
        transition: "box-shadow 0.25s",
    },
    cancelBtn: {
        padding: "14px 28px",
        background: "rgba(255,255,255,0.04)",
        color: TEXT,
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        transition: "background 0.2s",
    },
    spinnerInline: {
        display: "inline-block",
        width: 14, height: 14,
        border: `2px solid rgba(7,7,7,0.3)`,
        borderTop: `2px solid ${BG}`,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
    errorBox: {
        padding: 16,
        background: "rgba(184,58,58,0.12)",
        color: TEXT,
        borderRadius: 14,
        fontSize: 13,
        marginBottom: 24,
        border: "1px solid rgba(184,58,58,0.28)",
    },
};

export default BagForm;