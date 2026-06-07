import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createType } from "../services/typeService";

const G = "#E5C48A", BG = "#080808", BORDER = "rgba(201,168,106,0.15)", MUTED = "#6B6560", TEXT = "#F5F1E8";
const SERIF = "'Cormorant Garamond', serif", SANS = "'Inter', sans-serif";

export default function AddType() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [title, setTitle]     = useState("");
    const [logo, setLogo]       = useState("");
    const [preview, setPreview] = useState("");
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const s = document.createElement("style");
        s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(s);
        return () => document.head.removeChild(s);
    }, []);

    const handleLogo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setLogo(ev.target.result); setPreview(ev.target.result); };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Title is required");
        setLoading(true); setError("");
        try {
            const res = await createType({ title: title.trim(), logo });
            if (res.success) navigate("/admin/dashboard");
        } catch (err) { setError(err.message || "Failed to create type"); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: TEXT }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", borderBottom: `1px solid ${BORDER}`, background: "rgba(8,8,8,0.96)" }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, color: G, letterSpacing: "0.1em" }}>Add Type</span>
                <button onClick={logout} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Logout</button>
            </header>
            <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 24px 80px" }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {error && <p style={{ color: "#C9957A", fontSize: 12, letterSpacing: "0.06em" }}>{error}</p>}

                    {/* Logo upload */}
                    <div>
                        <label style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 12 }}>Type Logo</label>
                        {preview
                            ? <div style={{ position: "relative", display: "inline-block" }}>
                                <img src={preview} alt="logo" style={{ width: 120, height: 120, objectFit: "contain", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }} />
                                <button type="button" onClick={() => { setLogo(""); setPreview(""); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", color: "#C9957A", cursor: "pointer", fontSize: 11, borderRadius: 2, padding: "2px 6px" }}>✕</button>
                              </div>
                            : <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 120, height: 120, border: `1px dashed ${BORDER}`, cursor: "pointer", gap: 8, background: "rgba(255,255,255,0.02)" }}>
                                <span style={{ fontSize: 28, color: "rgba(201,168,106,0.3)" }}>+</span>
                                <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>Choose image</span>
                                <input type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
                              </label>
                        }
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 10 }}>Title *</label>
                        <input
                            type="text" value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. McLaren, Alpha, Harrison…"
                            style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${BORDER}`, color: TEXT, fontSize: 16, fontFamily: SERIF, padding: "8px 0", outline: "none", letterSpacing: "0.04em" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                        <button type="submit" disabled={loading} style={{ background: `linear-gradient(135deg,#C9A86A,${G})`, color: "#070707", border: "none", padding: "12px 28px", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving…" : "Save Type"}
                        </button>
                        <button type="button" onClick={() => navigate("/admin/dashboard")} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, padding: "12px 20px", fontFamily: SANS, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
                    </div>
                </form>
            </main>
        </div>
    );
}
