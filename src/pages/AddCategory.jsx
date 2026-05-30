import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createCategory } from "../services/categoryService";

const GOLD = "#dfa94b";
const GOLD_L = "#E5C48A";
const BG = "#070707";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "#A7A19A";
const TEXT = "#F5F1E8";

const AddCategory = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [form, setForm] = useState({ title: "", discount: "", note: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .cf-input:focus { border-color: rgba(229,196,138,0.5) !important; background: rgba(229,196,138,0.04) !important; }
            .cf-submit:hover { box-shadow: 0 28px 56px rgba(201,168,106,0.36) !important; }
            .cf-cancel:hover { background: rgba(255,255,255,0.08) !important; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Title is required";
        if (form.discount !== "" && (isNaN(form.discount) || form.discount < 0 || form.discount > 100))
            e.discount = "Discount must be between 0 and 100";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                title: form.title.trim(),
                discount: form.discount === "" ? 0 : Number(form.discount),
                note: form.note.trim(),
            };
            const result = await createCategory(payload);
            if (result.success) navigate("/admin/dashboard");
        } catch (err) {
            setErrors({ submit: err.message || "Failed to create category" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.page}>
            <header style={S.header}>
                <div>
                    <p style={S.eyebrow}>Admin Panel</p>
                    <h1 style={S.headerTitle}>TRÉSOR BAGS — Add Category</h1>
                </div>
                <button style={S.logoutBtn} onClick={logout}>Logout</button>
            </header>

            <main style={S.main}>
                <div style={S.card}>
                    <h2 style={S.cardTitle}>New Category</h2>
                    <p style={S.cardSub}>Create a new product category with optional discount and note.</p>

                    {errors.submit && <div style={S.errorBox}>{errors.submit}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div style={S.formGroup}>
                            <label style={S.label}>Title <span style={S.req}>*</span></label>
                            <input
                                className="cf-input"
                                type="text"
                                value={form.title}
                                onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => { const n={...p}; delete n.title; return n; }); }}
                                placeholder="e.g., Luxury Totes"
                                style={{ ...S.input, ...(errors.title ? S.inputErr : {}) }}
                            />
                            {errors.title && <p style={S.fieldError}>{errors.title}</p>}
                        </div>

                        {/* Discount */}
                        <div style={S.formGroup}>
                            <label style={S.label}>Discount (%) <span style={S.opt}>Optional · 0–100</span></label>
                            <input
                                className="cf-input"
                                type="number"
                                min="0"
                                max="100"
                                value={form.discount}
                                onChange={e => { setForm(p => ({ ...p, discount: e.target.value })); setErrors(p => { const n={...p}; delete n.discount; return n; }); }}
                                placeholder="e.g., 20"
                                style={{ ...S.input, ...(errors.discount ? S.inputErr : {}) }}
                            />
                            {errors.discount && <p style={S.fieldError}>{errors.discount}</p>}
                        </div>

                        {/* Note */}
                        <div style={S.formGroup}>
                            <label style={S.label}>Note <span style={S.opt}>Optional</span></label>
                            <textarea
                                className="cf-input"
                                value={form.note}
                                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                                placeholder='e.g., "With every 2 items of this category you can win 1"'
                                rows={4}
                                style={{ ...S.input, resize: "vertical", lineHeight: 1.7 }}
                            />
                        </div>

                        <div style={S.btnRow}>
                            <button
                                type="submit"
                                className="cf-submit"
                                disabled={loading}
                                style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                            >
                                {loading ? "Saving…" : "Save Category"}
                            </button>
                            <button
                                type="button"
                                className="cf-cancel"
                                onClick={() => navigate("/admin/dashboard")}
                                style={S.cancelBtn}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

const S = {
    page: { minHeight: "100vh", background: `radial-gradient(ellipse at top left, rgba(201,168,106,0.13), transparent 36%), ${BG}`, fontFamily: "'Inter', sans-serif", color: TEXT },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 36px", background: "rgba(7,7,7,0.94)", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(18px)" },
    eyebrow: { fontSize: 11, color: MUTED, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 6px" },
    headerTitle: { fontSize: 24, fontWeight: 700, margin: 0, color: GOLD_L, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.08em", textTransform: "uppercase" },
    logoutBtn: { padding: "10px 22px", background: "transparent", color: GOLD_L, border: `1px solid rgba(229,196,138,0.4)`, borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700 },
    main: { maxWidth: 680, margin: "40px auto", padding: "0 20px 60px" },
    card: { padding: "36px 32px", background: "rgba(255,255,255,0.035)", borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 30px 70px rgba(0,0,0,0.25)" },
    cardTitle: { fontSize: 26, fontWeight: 700, color: TEXT, margin: "0 0 8px", fontFamily: "'Cormorant Garamond', serif" },
    cardSub: { fontSize: 13, color: MUTED, margin: "0 0 28px", lineHeight: 1.7 },
    formGroup: { display: "flex", flexDirection: "column", marginBottom: 22 },
    label: { fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" },
    req: { color: GOLD },
    opt: { color: "rgba(167,161,154,0.6)", fontWeight: 400, textTransform: "none", letterSpacing: 0 },
    input: { padding: "13px 16px", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", background: "rgba(255,255,255,0.04)", color: TEXT, width: "100%", transition: "border-color 0.2s, background 0.2s" },
    inputErr: { borderColor: "#B83A3A", background: "rgba(184,58,58,0.07)" },
    fieldError: { color: GOLD, fontSize: 11, margin: "6px 0 0", fontWeight: 600 },
    errorBox: { padding: 16, background: "rgba(184,58,58,0.12)", color: TEXT, borderRadius: 14, fontSize: 13, marginBottom: 24, border: "1px solid rgba(184,58,58,0.28)" },
    btnRow: { display: "flex", flexDirection: "column", gap: 12, marginTop: 8 },
    submitBtn: { padding: "15px 28px", background: `linear-gradient(135deg, #C9A86A, ${GOLD_L})`, color: BG, border: "none", borderRadius: 999, fontSize: 14, fontWeight: 700, boxShadow: "0 18px 40px rgba(201,168,106,0.22)", transition: "box-shadow 0.25s" },
    cancelBtn: { padding: "14px 28px", background: "rgba(255,255,255,0.04)", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" },
};

export default AddCategory;
