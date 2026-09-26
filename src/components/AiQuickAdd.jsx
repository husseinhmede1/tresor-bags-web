import { useEffect, useRef, useState } from "react";
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

// Status lines while the AI works, same gold language as the storefront assistant.
const STEPS = ["Reading the screenshots", "Translating the details", "Sorting the photos", "Filling the form"];
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const AiQuickAdd = ({ onResult }) => {
    const [shots, setShots]       = useState([]);
    const [text, setText]         = useState("");
    const [language, setLanguage] = useState("ar");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [done, setDone]         = useState(false);
    const [kinds, setKinds]       = useState({}); // image index -> "screenshot" | "product" | "main" | "other"
    const [step, setStep]         = useState(0);
    const [fresh, setFresh]       = useState(false); // badges just arrived, animate them in
    const rootRef = useRef(null);

    useEffect(() => {
        if (!loading) return;
        const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2200);
        return () => clearInterval(id);
    }, [loading]);

    // Soft gold light that trails the mouse. CSS variables only, no re-renders.
    useEffect(() => {
        const el = rootRef.current;
        if (!el || reducedMotion() || !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
        let tx = 0, ty = 0, cx = null, cy = null, raf = 0;
        const tick = () => {
            cx += (tx - cx) * 0.08;
            cy += (ty - cy) * 0.08;
            el.style.setProperty("--aq-mx", `${cx.toFixed(1)}px`);
            el.style.setProperty("--aq-my", `${cy.toFixed(1)}px`);
            raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
        };
        const move = (e) => {
            const r = el.getBoundingClientRect();
            tx = e.clientX - r.left;
            ty = e.clientY - r.top;
            if (cx === null) { cx = r.width * 0.15; cy = 40; }
            if (!raf) raf = requestAnimationFrame(tick);
        };
        el.addEventListener("pointermove", move);
        return () => { el.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
    }, []);

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
        setStep(0);
        setFresh(false);
        try {
            const res = await parseProductFromChat({ images: shots, text, language });
            if (res.success) {
                const k = {};
                (res.data.images || []).forEach(i => { k[i.number - 1] = i.kind; });
                if (res.data.mainImage) k[res.data.mainImage - 1] = "main";
                setKinds(k);
                setFresh(!reducedMotion());
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
        <section ref={rootRef} className={`sf-panel aq${loading ? " is-busy" : ""}${fresh ? " is-fresh" : ""}`} onPaste={handlePaste} aria-labelledby="aq-h">
            <style>{AQ_CSS}</style>
            <span className="aq__glow" aria-hidden="true" />
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
                    <div key={i} className={`aq__shot${kinds[i] === "main" ? " aq__shot--main" : ""}`}
                        style={{ "--i": i }}>
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

            {loading && (
                <p className="aq__status">
                    <span className="sf-sr" role="status">Reading</span>
                    <span key={step} className="aq__status-text" aria-hidden="true">{STEPS[step]}</span>
                </p>
            )}

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
    @property --aq-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
    .aq { position: relative; isolation: isolate; margin-bottom: 24px; border-color: rgba(217, 178, 111, 0.22); transition: box-shadow .5s; }
    .aq > .aq__glow {
        position: absolute; inset: 0; z-index: -1; pointer-events: none; border-radius: inherit;
        background: radial-gradient(360px circle at var(--aq-mx, 15%) var(--aq-my, 40px), rgba(217,178,111,0.09), transparent 70%);
    }
    /* Light running around the panel: slow while idle, fast and bright while reading */
    .aq::before, .aq::after {
        content: ""; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; pointer-events: none;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
    }
    .aq::before {
        background: conic-gradient(from var(--aq-a), transparent 0deg 260deg, rgba(217,178,111,0.7) 325deg, transparent 360deg);
        opacity: .5; animation: aqTurn 12s linear infinite; transition: opacity .5s;
    }
    .aq::after {
        background: conic-gradient(from var(--aq-a), transparent 0deg 180deg, rgba(217,178,111,0.35) 250deg, #F3D9A6 330deg, transparent 360deg);
        opacity: 0; animation: aqTurn 2s linear infinite; transition: opacity .5s;
    }
    .aq.is-busy { box-shadow: 0 0 48px rgba(217,178,111,0.10); }
    .aq.is-busy::before { opacity: 0; }
    .aq.is-busy::after { opacity: 1; }

    /* While reading, a gold line scans every image, one after another */
    .aq.is-busy .aq__shot { border-color: rgba(217,178,111,0.4); }
    .aq.is-busy .aq__shot img { filter: saturate(.7) brightness(.85); }
    .aq.is-busy .aq__shot::after {
        content: ""; position: absolute; left: 0; right: 0; top: 0; height: 36%; pointer-events: none;
        background: linear-gradient(to bottom, transparent, rgba(217,178,111,0.30) 85%, #F3D9A6 100%);
        border-bottom: 1px solid #F3D9A6;
        animation: aqScan 1.6s cubic-bezier(0.65,0,0.35,1) calc(var(--i) * 140ms) infinite alternate backwards;
    }
    .aq__status { margin-top: 14px; display: flex; align-items: center; gap: 8px; min-height: 18px; }
    .aq__status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--sf-gold); box-shadow: 0 0 10px var(--sf-gold); animation: aqPulse 1.2s ease-in-out infinite; }
    .aq__status-text { color: var(--sf-text-2); font: 500 13px/1.3 var(--sf-font); animation: aqStep .45s cubic-bezier(0.16,1,0.3,1) both; }

    /* Results: badges land one by one, the main photo gets a gold ring and one sheen */
    .aq.is-fresh .aq__kind { animation: aqPop .5s cubic-bezier(0.16,1,0.3,1) calc(var(--i) * 90ms) backwards; }
    .aq__shot--main { border-color: var(--sf-gold); box-shadow: 0 0 0 1px var(--sf-gold), 0 0 24px rgba(217,178,111,0.25); }
    .aq.is-fresh .aq__shot--main::before {
        content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
        background: linear-gradient(110deg, transparent 35%, rgba(243,217,166,0.6) 50%, transparent 65%);
        transform: translateX(-120%); animation: aqSheen 1.1s cubic-bezier(0.4,0,0.2,1) calc(var(--i) * 90ms + 400ms) forwards;
    }
    @keyframes aqTurn { to { --aq-a: 360deg; } }
    @keyframes aqScan { from { transform: translateY(-100%); } to { transform: translateY(280%); } }
    @keyframes aqPulse { 50% { opacity: .35; transform: scale(.7); } }
    @keyframes aqStep { from { opacity: 0; transform: translateY(4px); } }
    @keyframes aqPop { from { opacity: 0; transform: translateY(-4px) scale(.85); } }
    @keyframes aqSheen { to { transform: translateX(120%); } }
    @media (prefers-reduced-motion: reduce) {
        .aq::before, .aq::after, .aq__shot::after, .aq__shot::before, .aq__status::before, .aq__status-text, .aq__kind { animation: none !important; }
        .aq::before { background: none; }
        .aq.is-busy .aq__shot::after { top: 40%; }
    }
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
