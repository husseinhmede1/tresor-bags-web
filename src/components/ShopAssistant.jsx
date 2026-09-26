import { useEffect, useRef, useState } from "react";
import { Sparkle, Camera, ArrowRight, X } from "@phosphor-icons/react";
import { askShop } from "../services/aiService";
import { sized } from "../utils/image";

// Ask-the-shop box: a question and/or a photo in, a short answer plus matching bags out.
// Answers come only from the catalog (enforced on the server).

const GOLD_L = "#E5C48A";
const GOLD_D = "#C9A86A";
const TEXT   = "#F5F1E8";
const SOFT   = "#A39A90";   // secondary text, AA on the near-black background
const BORDER = "rgba(201,168,106,0.18)";
const SERIF  = "'Cormorant Garamond', serif";
const SANS   = "'Inter', system-ui, sans-serif";

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

            <p className="sa-note">Answers come from our catalog only.</p>
        </form>
    );
}

const CSS = `
.sa { display: flex; flex-direction: column; gap: 10px; }
.sa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sa-field {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 6px 6px 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid ${BORDER}; border-radius: 2px;
    transition: border-color .25s, background .25s;
}
.sa-field:focus-within { border-color: rgba(229,196,138,0.55); background: rgba(201,168,106,0.05); }
.sa-field input {
    flex: 1; min-width: 0; background: none; border: none; outline: none;
    color: ${TEXT}; font: 400 14px/1.4 ${SANS}; padding: 8px 0;
}
.sa-field input::placeholder { color: ${SOFT}; }
.sa-icon, .sa-send {
    flex-shrink: 0; width: 36px; height: 36px; display: grid; place-items: center;
    border-radius: 2px; cursor: pointer; transition: background .2s, color .2s, transform .15s, opacity .2s;
}
.sa-icon { background: none; border: 1px solid transparent; color: ${SOFT}; }
.sa-icon:hover { color: ${GOLD_L}; background: rgba(201,168,106,0.08); }
.sa-send { border: none; color: #0A0908; background: linear-gradient(135deg, ${GOLD_D}, ${GOLD_L}); }
.sa-send:disabled { opacity: .3; cursor: default; }
.sa-send:not(:disabled):active, .sa-icon:active { transform: scale(0.96); }
.sa-icon:focus-visible, .sa-send:focus-visible, .sa-suggest button:focus-visible, .sa-card:focus-visible {
    outline: 1px solid ${GOLD_L}; outline-offset: 2px;
}
.sa-chip { position: relative; flex-shrink: 0; width: 30px; height: 30px; }
.sa-chip img { width: 100%; height: 100%; object-fit: cover; border-radius: 2px; border: 1px solid ${BORDER}; }
.sa-chip button {
    position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; border-radius: 50%;
    display: grid; place-items: center; padding: 0; cursor: pointer;
    background: ${TEXT}; color: #0A0908; border: none;
}
.sa-suggest { display: flex; gap: 6px; flex-wrap: wrap; }
.sa-suggest button {
    padding: 6px 12px; border-radius: 2px; cursor: pointer;
    background: none; border: 1px solid ${BORDER}; color: ${SOFT};
    font: 400 12px/1.3 ${SANS}; transition: color .2s, border-color .2s;
}
.sa-suggest button:hover { color: ${GOLD_L}; border-color: rgba(201,168,106,0.4); }
.sa-result { animation: saIn .35s cubic-bezier(0.22,1,0.36,1); }
.sa-answer { margin: 0; color: ${TEXT}; font: 400 14px/1.65 ${SANS}; max-width: 62ch; }
.sa-cards {
    display: grid; grid-auto-flow: column; grid-auto-columns: 128px; gap: 10px;
    overflow-x: auto; scroll-snap-type: x mandatory; padding: 12px 0 4px; scrollbar-width: none;
}
.sa-cards::-webkit-scrollbar { display: none; }
.sa-card {
    scroll-snap-align: start; display: flex; flex-direction: column; gap: 6px; text-align: left;
    padding: 0; background: none; border: none; cursor: pointer; color: inherit;
}
.sa-card-img {
    position: relative; display: block; aspect-ratio: 1; border-radius: 2px; overflow: hidden;
    background: #121110; border: 1px solid ${BORDER}; transition: border-color .25s;
}
.sa-card-img img { width: 100%; height: 100%; object-fit: contain; transition: transform .4s cubic-bezier(0.22,1,0.36,1); }
.sa-card:hover .sa-card-img { border-color: rgba(201,168,106,0.45); }
.sa-card:hover .sa-card-img img { transform: scale(1.04); }
.sa-soldout {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 4px 0; text-align: center;
    background: rgba(8,8,8,0.8); color: ${SOFT}; font: 500 10px/1 ${SANS}; letter-spacing: .08em;
}
.sa-card-title {
    font: 400 15px/1.2 ${SERIF}; color: ${TEXT};
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sa-card-price { display: flex; gap: 6px; align-items: baseline; font: 600 12px/1 ${SANS}; color: ${GOLD_L}; }
.sa-card-price s { font-weight: 400; color: ${SOFT}; }
.sa-error { margin: 0; color: #E08A8A; font: 400 13px/1.5 ${SANS}; }
.sa-note { margin: 0; color: #857D75; font: 400 10.5px/1.4 ${SANS}; }
.sa-skel { height: 12px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(229,196,138,0.10) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: saShimmer 1.3s linear infinite; }
.sa-skel-card { height: auto; aspect-ratio: 1; }
.sa-spin { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid rgba(10,9,8,0.25); border-top-color: #0A0908; animation: saSpin .7s linear infinite; }
@keyframes saIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes saShimmer { to { background-position: -200% 0; } }
@keyframes saSpin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
    .sa-result, .sa-skel, .sa-spin { animation-duration: 0s !important; animation-iteration-count: 1 !important; }
    .sa-card-img img { transition: none; }
}
`;
