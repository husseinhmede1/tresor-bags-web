import { useState } from "react";
import { Check, Plus, Sparkle, Star, X } from "@phosphor-icons/react";
import { parseProductFromChat } from "../services/aiService";

const MAX_SHOTS = 20;
// Product photos picked from here end up on the site, so keep them sharp enough.
const MAX_EDGE = 1600;

/* Downscale + re-encode so a batch of phone images stays small to upload and store. */
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
    const [kinds, setKinds]       = useState({}); // image index -> "screenshot" | "product" | "main" | "other"

    const addFiles = async (files) => {
        const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (!imgs.length) return;
        if (shots.length + imgs.length > MAX_SHOTS) {
            setError(`Maximum ${MAX_SHOTS} images per bag`);
            return;
        }
        setError("");
        const urls = await Promise.all(imgs.map(fileToDataUrl));
        setShots(p => [...p, ...urls]);
        setKinds({});
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
            setError("Add at least one image or paste the supplier's text");
            return;
        }
        setLoading(true);
        setError("");
        setDone(false);
        try {
            const res = await parseProductFromChat({ images: shots, text, language });
            if (res.success) {
                const k = {};
                (res.data.images || []).forEach(i => { k[i.number - 1] = i.kind; });
                if (res.data.mainImage) k[res.data.mainImage - 1] = "main";
                setKinds(k);
                onResult(res.data, shots);
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
        <section className="sf-panel aq" onPaste={handlePaste} aria-labelledby="aq-h">
            <style>{AQ_CSS}</style>
            <div className="aq__head">
                <h2 id="aq-h" className="sf-h3 aq__title">
                    <Sparkle size={20} weight="fill" className="sf-gold" /> AI quick add
                </h2>
                <div className="sf-seg" role="group" aria-label="Output language">
                    {[["ar", "عربي"], ["en", "English"]].map(([k, l]) => (
                        <button key={k} type="button" onClick={() => setLanguage(k)}
                            aria-pressed={language === k}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>
            <p className="sf-muted aq__sub">
                Drop everything for <b>one bag</b> here: the WeChat screenshots (one or several) and
                the bag's photos. You can also paste a screenshot. The AI reads the details, translates
                them, and puts the photos in Main image and Gallery. Review everything, set your
                selling price, then save.
            </p>

            <div className="aq__shots">
                {shots.map((src, i) => (
                    <div key={i} className="aq__shot">
                        <img src={src} alt={`Screenshot ${i + 1}`} />
                        <span className="aq__num sf-num">{i + 1}</span>
                        {kinds[i] && (
                            <span className={`aq__kind aq__kind--${kinds[i]}`}>
                                {kinds[i] === "main" && <Star size={10} weight="fill" />}
                                {KIND_LABEL[kinds[i]]}
                            </span>
                        )}
                        <button type="button" className="aq__remove" aria-label={`Remove image ${i + 1}`}
                            onClick={() => { setShots(p => p.filter((_, j) => j !== i)); setKinds({}); }}>
                            <X size={12} weight="bold" />
                        </button>
                    </div>
                ))}
                {shots.length < MAX_SHOTS && (
                    <label className="aq__add">
                        <Plus size={20} />
                        <span>Add images</span>
                        <input type="file" accept="image/*" multiple hidden
                            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
                    </label>
                )}
            </div>

            <label className="sf-label" htmlFor="aq-text" style={{ marginBottom: 8 }}>
                Supplier's message <small>Optional</small>
            </label>
            <textarea id="aq-text" className="sf-input" rows={3} value={text} dir="auto"
                onChange={e => setText(e.target.value)}
                placeholder="Paste the supplier's message text here…" />

            {error && <p className="sf-error aq__msg" role="alert">{error}</p>}
            {done && !error && (
                <p className="aq__msg aq__ok" role="status">
                    <Check size={16} weight="bold" /> Form filled. Check every field and photo before saving.
                </p>
            )}

            <button type="button" onClick={handleRead} disabled={loading}
                className="sf-btn sf-btn--primary sf-btn--block aq__btn">
                {loading ? <span className="aq__spin" aria-hidden="true" /> : <Sparkle size={16} weight="fill" />}
                {loading ? "Reading…" : "Read and fill the form"}
            </button>
        </section>
    );
};

const KIND_LABEL = { main: "Main", product: "Photo", screenshot: "Info", other: "Skipped" };

const AQ_CSS = `
    .aq { margin-bottom: 24px; border-color: rgba(217, 178, 111, 0.3); }
    .aq__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
    .aq__title { display: inline-flex; align-items: center; gap: 8px; }
    .aq__sub { font-size: 14px; margin-bottom: 18px; max-width: 75ch; }
    .aq__sub b { color: var(--sf-text); font-weight: 600; }
    .aq__shots { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
    .aq__shot { position: relative; width: 84px; height: 120px; border-radius: 12px; overflow: hidden; border: 1px solid var(--sf-line); background: var(--sf-surface-2); }
    .aq__shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .aq__num { position: absolute; bottom: 6px; left: 6px; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: rgba(17,17,17,.82); color: var(--sf-text); font: 600 11px/20px var(--sf-font); text-align: center; }
    .aq__kind { position: absolute; top: 6px; left: 6px; height: 20px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; gap: 3px; font: 600 10.5px/1 var(--sf-font); background: rgba(17,17,17,.86); color: var(--sf-text-2); }
    .aq__kind--main { background: var(--sf-gold); color: var(--sf-on-gold); }
    .aq__kind--product { color: var(--sf-gold); }
    .aq__kind--other { color: var(--sf-text-3); }
    .aq__remove { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; border-radius: 999px; border: 0; background: rgba(17,17,17,.82); color: #fff; display: grid; place-items: center; cursor: pointer; }
    .aq__remove:hover { color: var(--sf-danger); }
    .aq__add { width: 84px; height: 120px; display: grid; place-content: center; justify-items: center; gap: 6px; border-radius: 12px; border: 1.5px dashed var(--sf-line-2); color: var(--sf-text-2); font-size: 12px; font-weight: 500; text-align: center; cursor: pointer; transition: border-color .2s, color .2s, background-color .2s; }
    .aq__add:hover { border-color: rgba(217, 178, 111, 0.6); color: var(--sf-gold); background: var(--sf-gold-soft); }
    .aq__msg { margin-top: 12px; font-size: 14px; }
    .aq__ok { display: flex; align-items: center; gap: 6px; color: var(--sf-gold); }
    .aq__btn { margin-top: 16px; }
    .aq__spin { width: 14px; height: 14px; border-radius: 999px; border: 2px solid rgba(23, 19, 11, 0.3); border-top-color: var(--sf-on-gold); animation: sfSpin .7s linear infinite; }
`;

export default AiQuickAdd;
