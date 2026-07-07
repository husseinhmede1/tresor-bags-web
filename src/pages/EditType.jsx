import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTypeById, updateType } from "../services/typeService";

const G = "#E5C48A", BG = "#080808", BORDER = "rgba(201,168,106,0.15)", MUTED = "#6B6560", TEXT = "#F5F1E8";
const SERIF = "'Cormorant Garamond', serif", SANS = "'Inter', sans-serif";
const CATEGORIES = ["Backpacks", "Luggage", "Bags", "Accessories"];

const inputStyle = { width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 15, fontFamily: SANS, padding: "11px 14px", outline: "none", letterSpacing: "0.02em" };
const labelStyle = { fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 10 };

export default function EditType() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [form, setForm] = useState({ title: "", category: "", discount: "", note: "" });
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        getTypeById(id)
            .then(res => {
                if (res.success) {
                    const t = res.data;
                    setForm({ title: t.title || "", category: t.category || "", discount: t.discount ?? "", note: t.note || "" });
                }
            })
            .catch(() => setError("Failed to load type"))
            .finally(() => setFetching(false));
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setError("Title is required");
        if (!form.category) return setError("Category is required");
        if (form.discount !== "" && (isNaN(form.discount) || form.discount < 0 || form.discount > 100))
            return setError("Discount must be between 0 and 100");
        setLoading(true); setError("");
        try {
            const res = await updateType(id, {
                title: form.title.trim(),
                category: form.category,
                discount: form.discount === "" ? 0 : Number(form.discount),
                note: form.note.trim(),
            });
            if (res.success) navigate("/admin/dashboard");
        } catch (err) { setError(err.message || "Failed to update type"); }
        finally { setLoading(false); }
    };

    if (fetching) return <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontFamily: SANS, fontSize: 12, letterSpacing: "0.1em" }}>Loading…</div>;

    return (
        <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: TEXT }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", borderBottom: `1px solid ${BORDER}`, background: "rgba(8,8,8,0.96)" }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, color: G, letterSpacing: "0.1em" }}>Edit Type</span>
                <button onClick={logout} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Logout</button>
            </header>
            <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 24px 80px" }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {error && <p style={{ color: "#C9957A", fontSize: 12, letterSpacing: "0.06em" }}>{error}</p>}

                    <div>
                        <label style={labelStyle}>Category *</label>
                        <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="">— Select a category —</option>
                            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#111" }}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Title *</label>
                        <input type="text" value={form.title} onChange={e => set("title", e.target.value)}
                            placeholder="e.g. Carry-On Luggage, Briefcases…" style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Discount (%) · optional 0–100</label>
                        <input type="number" min="0" max="100" value={form.discount} onChange={e => set("discount", e.target.value)}
                            placeholder="e.g. 20" style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Note · optional</label>
                        <textarea value={form.note} onChange={e => set("note", e.target.value)} rows={3}
                            placeholder='e.g. "With every 2 items of this type you win 1"'
                            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                        <button type="submit" disabled={loading} style={{ background: `linear-gradient(135deg,#C9A86A,${G})`, color: "#070707", border: "none", padding: "12px 28px", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving…" : "Update Type"}
                        </button>
                        <button type="button" onClick={() => navigate("/admin/dashboard")} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, padding: "12px 20px", fontFamily: SANS, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
                    </div>
                </form>
            </main>
        </div>
    );
}
