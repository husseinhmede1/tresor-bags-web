import { useEffect, useRef, useState } from "react";
import { Sparkle, Camera, ArrowRight, X } from "@phosphor-icons/react";
import { askShop } from "../services/aiService";
import { sized } from "../utils/image";

// Ask-the-shop box: a question and/or a photo in, a short answer plus matching bags out.
// Answers come only from the catalog (enforced on the server).

const GOLD_L = "#D9B26F";
const GOLD_D = "#D9B26F";
const TEXT   = "#F2F0EB";
const SOFT   = "#B3ADA5";   // secondary text, AA on the near-black background
const BORDER = "rgba(255,255,255,0.10)";
const SANS   = "'Geist Variable', system-ui, sans-serif";

const SUGGESTIONS = ["A laptop backpack", "What's on sale?", "شنطة سفر كبيرة"];
const MAX_EDGE = 1024;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
            const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

const money = (n) => `$${Number(n).toLocaleString("en-US", Number.isInteger(Number(n)) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The last question and answer survive a visit to a bag page, so "back" lands on them.
const loadSaved = (key) => {
    try { return JSON.parse(sessionStorage.getItem(`tresor-ask-${key}`)) || {}; } catch { return {}; }
};

export default function ShopAssistant({ onOpenBag, autoFocus = false, storageKey = "main" }) {
    const [saved]               = useState(() => loadSaved(storageKey));
    const [text, setText]       = useState(saved.text || "");
    const [photo, setPhoto]     = useState(saved.photo || "");
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [result, setResult]   = useState(saved.result || null);
    const fileRef = useRef(null);

    useEffect(() => {
        const save = (data) => sessionStorage.setItem(`tresor-ask-${storageKey}`, JSON.stringify(data));
        try { save({ text, photo, result }); }
        catch { try { save({ text, result }); } catch { /* storage full or blocked */ } }
    }, [storageKey, text, photo, result]);

    const ask = async (q = text) => {
        if (loading || (!q.trim() && !photo)) return;
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await askShop({ text: q.trim(), image: photo || undefined });
            if (res.success) setResult(res.data);
            else setError(res.message || "Please try again.");
        } catch (err) {
            setError(err.message || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const pickPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("image/")) return;
        try { setPhoto(await fileToDataUrl(file)); setError(""); }
        catch { setError("This photo could not be read, please try another one."); }
    };

    const canSend = !loading && (text.trim() || photo);

    return (
        <form className="sa" onSubmit={(e) => { e.preventDefault(); ask(); }}>
            <style>{CSS}</style>

            <label htmlFor="sa-input" className="sa-sr">Ask the Trésor assistant</label>
            <div className="sa-field">
                <Sparkle size={16} weight="fill" color={GOLD_D} aria-hidden="true" style={{ flexShrink: 0 }} />
                {photo && (
                    <span className="sa-chip">
                        <img src={photo} alt="Your photo" />
                        <button type="button" onClick={() => setPhoto("")} aria-label="Remove photo"><X size={10} weight="bold" /></button>
                    </span>
                )}
                <input
                    id="sa-input"
                    dir="auto"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    maxLength={500}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={photo ? "Anything to add? Or just send" : "Ask about a bag, or search by photo"}
                />
                <button type="button" className="sa-icon" onClick={() => fileRef.current?.click()} aria-label="Search with a photo" title="Search with a photo">
                    <Camera size={18} />
                </button>
                <button type="submit" className="sa-send" disabled={!loading && !canSend} aria-busy={loading} aria-label="Ask">
                    {loading ? <span className="sa-spin" /> : <ArrowRight size={16} weight="bold" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
            </div>

            {!result && !loading && !error && (
                <div className="sa-suggest">
                    {SUGGESTIONS.map(s => (
                        <button key={s} type="button" dir="auto" onClick={() => { setText(s); ask(s); }}>{s}</button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="sa-result" aria-live="polite" aria-busy="true">
                    <div className="sa-skel" style={{ width: "88%" }} />
                    <div className="sa-skel" style={{ width: "56%", marginTop: 8 }} />
                    <div className="sa-cards">
                        {[0, 1, 2].map(i => <div key={i} className="sa-card sa-skel sa-skel-card" />)}
                    </div>
                </div>
            )}

            {error && <p className="sa-error" role="alert">{error}</p>}

            {result && (
                <div className="sa-result" aria-live="polite">
                    <p className="sa-answer" dir="auto">{result.answer}</p>
                    {result.bags.length > 0 && (
                        <div className="sa-cards">
                            {result.bags.map(b => (
                                <button key={b._id} type="button" className="sa-card" onClick={() => onOpenBag?.(b._id)}>
                                    <span className="sa-card-img">
                                        <img src={sized(b.mainImage, 280)} alt="" loading="lazy" />
                                        {!b.inStock && <span className="sa-soldout">Sold out</span>}
                                    </span>
                                    <span className="sa-card-title">{b.title}</span>
                                    <span className="sa-card-price">
                                        {money(b.finalPrice)}
                                        {b.discount > 0 && <s>{money(b.price)}</s>}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <p className="sa-note">Answers come from our catalog only. <a href="/privacy">Privacy</a></p>
        </form>
    );
}

const CSS = `
.sa { display: flex; flex-direction: column; gap: 12px; }
.sa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sa-field {
    display: flex; align-items: center; gap: 10px;
    padding: 5px 5px 5px 18px;
    background: #131315;
    border: 1px solid ${BORDER}; border-radius: 999px;
    transition: border-color .2s, background-color .2s;
}
.sa-field:focus-within { border-color: rgba(217,178,111,0.6); background: #1B1B1E; }
.sa-field input {
    flex: 1; min-width: 0; background: none; border: none; outline: none;
    color: ${TEXT}; font: 400 15px/1.4 ${SANS}; padding: 9px 0;
}
.sa-field input::placeholder { color: #8C867E; }
.sa-icon, .sa-send {
    flex-shrink: 0; width: 40px; height: 40px; display: grid; place-items: center;
    border-radius: 999px; cursor: pointer; transition: background-color .2s, color .2s, transform .15s, opacity .2s;
}
.sa-icon { background: none; border: 0; color: ${SOFT}; }
.sa-icon:hover { color: ${TEXT}; background: rgba(255,255,255,0.06); }
.sa-send { border: none; color: #17130B; background: ${GOLD_L}; }
.sa-send:hover:not(:disabled) { background: #E6C68D; }
.sa-send:disabled { opacity: .3; cursor: default; }
.sa-send:not(:disabled):active, .sa-icon:active { transform: scale(0.96); }
.sa-icon:focus-visible, .sa-send:focus-visible, .sa-suggest button:focus-visible, .sa-card:focus-visible {
    outline: 2px solid ${GOLD_L}; outline-offset: 2px;
}
.sa-chip { position: relative; flex-shrink: 0; width: 32px; height: 32px; }
.sa-chip img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid ${BORDER}; }
.sa-chip button {
    position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; border-radius: 50%;
    display: grid; place-items: center; padding: 0; cursor: pointer;
    background: ${TEXT}; color: #0B0B0C; border: none;
}
.sa-suggest { display: flex; gap: 8px; flex-wrap: wrap; }
.sa-suggest button {
    height: 34px; padding: 0 14px; border-radius: 999px; cursor: pointer;
    background: none; border: 1px solid ${BORDER}; color: ${SOFT};
    font: 500 13px/1 ${SANS}; transition: color .2s, border-color .2s;
}
.sa-suggest button:hover { color: ${TEXT}; border-color: rgba(255,255,255,0.22); }
.sa-result { animation: saIn .35s cubic-bezier(0.16,1,0.3,1); }
.sa-answer { margin: 0; color: ${TEXT}; font: 400 15px/1.65 ${SANS}; max-width: 62ch; }
.sa-cards {
    display: grid; grid-auto-flow: column; grid-auto-columns: 140px; gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; padding: 12px 0 4px; scrollbar-width: none;
}
.sa-cards::-webkit-scrollbar { display: none; }
.sa-card {
    scroll-snap-align: start; display: flex; flex-direction: column; gap: 8px; text-align: left;
    padding: 0; background: none; border: none; cursor: pointer; color: inherit;
}
.sa-card-img {
    position: relative; display: block; aspect-ratio: 1; border-radius: 16px; overflow: hidden; isolation: isolate;
    background: #EDEDEE;
}
.sa-card-img img { width: 100%; height: 100%; object-fit: contain; padding: 10%; mix-blend-mode: multiply; transition: transform .5s cubic-bezier(0.16,1,0.3,1); }
.sa-card:hover .sa-card-img img { transform: scale(1.04); }
.sa-soldout {
    position: absolute; left: 8px; top: 8px; height: 22px; padding: 0 8px; border-radius: 999px; display: inline-flex; align-items: center;
    background: #111; color: #D8D4CD; font: 600 11px/1 ${SANS};
}
.sa-card-title {
    font: 550 14px/1.3 ${SANS}; color: ${TEXT};
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sa-card-price { display: flex; gap: 6px; align-items: baseline; font: 600 13px/1 ${SANS}; color: ${TEXT}; font-variant-numeric: tabular-nums; }
.sa-card-price s { font-weight: 400; color: #8C867E; }
.sa-error { margin: 0; color: #F0907F; font: 400 14px/1.5 ${SANS}; }
.sa-note { margin: 0; color: #8C867E; font: 400 12.5px/1.4 ${SANS}; }
.sa-note a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.sa-note a:hover { color: ${TEXT}; }
.sa-skel { height: 12px; border-radius: 8px; background: linear-gradient(90deg, #17171a 25%, #212125 50%, #17171a 75%); background-size: 200% 100%; animation: saShimmer 1.4s linear infinite; }
.sa-skel-card { height: auto; aspect-ratio: 1; border-radius: 16px; }
.sa-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(23,19,11,0.25); border-top-color: #17130B; animation: saSpin .7s linear infinite; }
@keyframes saIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes saShimmer { to { background-position: -200% 0; } }
@keyframes saSpin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
    .sa-result, .sa-skel, .sa-spin { animation-duration: 0s !important; animation-iteration-count: 1 !important; }
    .sa-card-img img { transition: none; }
}
`;
