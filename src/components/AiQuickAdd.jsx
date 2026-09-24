import { useState } from "react";
import { parseProductFromChat } from "../services/aiService";

const MAX_SHOTS = 8;
const MAX_EDGE = 1568; // larger images are downscaled by the API anyway

/* Downscale + re-encode so several phone screenshots stay small to upload. */
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
            const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

const AiQuickAdd = ({ onResult }) => {
    const [shots, setShots]       = useState([]);
    const [text, setText]         = useState("");
    const [language, setLanguage] = useState("ar");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [done, setDone]         = useState(false);

    const addFiles = async (files) => {
        const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (!imgs.length) return;
        if (shots.length + imgs.length > MAX_SHOTS) {
            setError(`Maximum ${MAX_SHOTS} screenshots per bag`);
            return;
        }
        setError("");
        const urls = await Promise.all(imgs.map(fileToDataUrl));
        setShots(p => [...p, ...urls]);
    };

    // Ctrl/Cmd+V a screenshot straight into the box
    const handlePaste = (e) => {
        const files = Array.from(e.clipboardData?.items || [])
            .filter(i => i.kind === "file")
            .map(i => i.getAsFile())
            .filter(Boolean);
        if (files.length) {
            e.preventDefault();
            addFiles(files);
        }
    };

    const handleRead = async () => {
        if (!shots.length && !text.trim()) {
            setError("Add at least one screenshot or paste the supplier's text");
            return;
        }
        setLoading(true);
        setError("");
        setDone(false);
        try {
            const res = await parseProductFromChat({ images: shots, text, language });
            if (res.success) {
                onResult(res.data);
                setDone(true);
            } else {
                setError(res.message || "AI could not read this");
            }
        } catch (err) {
            setError(err.message || "AI could not read this");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.card} onPaste={handlePaste}>
            <div style={S.head}>
                <h2 style={S.title}>✨ AI Quick Add</h2>
                <div style={S.langWrap}>
                    {[["ar", "عربي"], ["en", "English"]].map(([k, l]) => (
                        <button key={k} type="button" onClick={() => setLanguage(k)}
                            style={{ ...S.langBtn, ...(language === k ? S.langOn : {}) }}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>
            <p style={S.sub}>
                Upload the WeChat screenshots for <b>one bag</b> (one or several), or paste the
                supplier's text. The AI translates and fills the form below — review it, add the
                product photos and your selling price, then save.
            </p>

            <div style={S.shots}>
                {shots.map((src, i) => (
                    <div key={i} style={S.shot}>
                        <img src={src} alt={`Screenshot ${i + 1}`} style={S.shotImg} />
                        <span style={S.shotNum}>{i + 1}</span>
                        <button type="button" style={S.remove}
                            onClick={() => setShots(p => p.filter((_, j) => j !== i))}>✕</button>
                    </div>
                ))}
                {shots.length < MAX_SHOTS && (
                    <label style={S.add} className="bf-add">
                        <span style={S.plus}>+</span>
                        <span style={S.addText}>Screenshot</span>
                        <input type="file" accept="image/*" multiple style={{ display: "none" }}
                            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
                    </label>
                )}
            </div>

            <textarea className="bf-input" rows={3} value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Optional: paste the supplier's message text here…"
                style={S.textarea} />

            {error && <p style={S.error}>{error}</p>}
            {done && !error && <p style={S.ok}>Form filled ✓ Check every field before saving.</p>}

            <button type="button" onClick={handleRead} disabled={loading}
                style={{ ...S.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading && <span style={S.spinner} />}
                {loading ? "Reading…" : "Read & fill the form"}
            </button>
        </div>
    );
};

const GOLD_L = "#E5C48A";
const MUTED  = "#A7A19A";
const TEXT   = "#F5F1E8";

const S = {
    card: {
        padding: "24px",
        borderRadius: 22,
        background: "linear-gradient(135deg, rgba(223,169,75,0.10), rgba(255,255,255,0.03))",
        border: "1px solid rgba(223,169,75,0.3)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        marginBottom: 28,
    },
    head: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 },
    title: { fontSize: 20, fontWeight: 700, color: GOLD_L, margin: 0, fontFamily: "'Cormorant Garamond', serif" },
    langWrap: { display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 3 },
    langBtn: { padding: "6px 14px", border: "none", borderRadius: 999, background: "transparent", color: MUTED, fontSize: 12, fontWeight: 700, cursor: "pointer" },
    langOn: { background: GOLD_L, color: "#070707" },
    sub: { fontSize: 13, color: MUTED, lineHeight: 1.7, margin: "0 0 16px" },
    shots: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 },
    shot: { position: "relative", width: 84, height: 120, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
    shotImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    shotNum: { position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.7)", color: GOLD_L, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 7px" },
    remove: { position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", color: "#B83A3A", fontSize: 11, fontWeight: 700, cursor: "pointer" },
    add: { width: 84, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 12, border: "1.5px dashed rgba(229,196,138,0.35)", background: "rgba(229,196,138,0.06)", cursor: "pointer" },
    plus: { fontSize: 26, color: GOLD_L, lineHeight: 1 },
    addText: { fontSize: 10, fontWeight: 700, color: GOLD_L },
    textarea: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: TEXT, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", marginBottom: 12, boxSizing: "border-box" },
    error: { color: "#E07A7A", fontSize: 12, fontWeight: 600, margin: "0 0 12px" },
    ok: { color: GOLD_L, fontSize: 12, fontWeight: 600, margin: "0 0 12px" },
    btn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 24px", border: "none", borderRadius: 999, background: "linear-gradient(135deg, #C9A86A, #E5C48A)", color: "#070707", fontSize: 14, fontWeight: 700 },
    spinner: { display: "inline-block", width: 14, height: 14, border: "2px solid rgba(7,7,7,0.3)", borderTop: "2px solid #070707", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
};

export default AiQuickAdd;
