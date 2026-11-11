import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, FilmSlate, WarningCircle } from "@phosphor-icons/react";
import AdminShell from "../components/storefront/AdminShell";
import { getSettings, saveSettings } from "../services/bagService";
import { DEFAULT_PRESET, VIDEO_PRESETS, canCompress, compressVideo } from "../utils/videoCompress";

// Compare the three video qualities on a real clip, on this device, then pick the one the
// bag form uses. Nothing is uploaded and nothing is saved on the device.

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const KEYS = Object.keys(VIDEO_PRESETS);

const AdminVideoQualityPage = () => {
    const [current, setCurrent] = useState(DEFAULT_PRESET);
    const [source, setSource] = useState(null);          // { name, size }
    const [results, setResults] = useState({});          // key -> { status, progress, url, size, width, height, seconds, duration, error }
    const [saving, setSaving] = useState("");
    const [error, setError] = useState("");
    const runRef = useRef(null);                         // AbortController of the running comparison
    const urlsRef = useRef([]);
    const supported = canCompress();

    useEffect(() => {
        getSettings().then(s => { if (VIDEO_PRESETS[s?.videoQuality]) setCurrent(s.videoQuality); }).catch(() => {});
        const urls = urlsRef.current;
        return () => { runRef.current?.abort(); urls.forEach(u => URL.revokeObjectURL(u)); };
    }, []);

    const patch = (key, p) => setResults(r => ({ ...r, [key]: { ...r[key], ...p } }));

    const pick = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        runRef.current?.abort();
        const run = new AbortController();
        runRef.current = run;
        setError("");
        setSource({ name: file.name, size: file.size });
        setResults(Object.fromEntries(KEYS.map(k => [k, { status: "waiting" }])));
        for (const key of KEYS) {
            if (run.signal.aborted) return;
            patch(key, { status: "working", progress: 0 });
            const t0 = performance.now();
            try {
                const out = await compressVideo(file, key, { signal: run.signal, onProgress: (progress) => patch(key, { progress }) });
                if (!out) { patch(key, { status: "error", error: "This browser can't compress this video" }); continue; }
                const url = URL.createObjectURL(out.file);
                urlsRef.current.push(url);
                patch(key, {
                    status: "done", url, size: out.file.size, width: out.width, height: out.height,
                    duration: out.duration, seconds: (performance.now() - t0) / 1000, audio: out.audio, hdr: out.hdr,
                });
            } catch (err) {
                if (run.signal.aborted) return;
                patch(key, { status: "error", error: err?.message || "Compression failed" });
            }
        }
    };

    const choose = async (key) => {
        setSaving(key);
        setError("");
        try {
            const s = await saveSettings({ videoQuality: key });
            setCurrent(s.videoQuality);
        } catch (err) {
            setError(err?.message || "Could not save, please try again");
        } finally {
            setSaving("");
        }
    };

    return (
        <AdminShell title="Video quality" subtitle="Compare the qualities on one of your videos, then pick the one new videos use." width={1120}>
            <style>{VQ_CSS}</style>
            <div className="vq">
                <Link to="/admin/dashboard" className="sf-btn sf-btn--ghost sf-btn--sm vq-back"><ArrowLeft size={16} /> Back to bags</Link>

                <section className="sf-panel vq-pick">
                    <div>
                        <h2 className="sf-h3">Try it on a real video</h2>
                        <p className="sf-muted vq-sub">
                            Pick a bag video from this device. It is compressed here three ways so you can watch them side by side.
                            Nothing is uploaded and nothing is saved on the device. Watch them on the phone screen customers use.
                        </p>
                    </div>
                    {supported ? (
                        <label className="sf-btn sf-btn--primary vq-file">
                            <FilmSlate size={18} /> {source ? "Choose another video" : "Choose a video"}
                            <input type="file" accept="video/*" onChange={pick} hidden />
                        </label>
                    ) : (
                        <p className="vq-alert" role="alert">
                            <WarningCircle size={18} /> This browser can't compress videos. Use Chrome on a laptop, or Safari on an iPhone with iOS 17 or newer.
                        </p>
                    )}
                    {source && <p className="sf-faint vq-meta" dir="auto">Original: <b>{source.name}</b>, {mb(source.size)}</p>}
                    {error && <p className="vq-alert" role="alert">{error}</p>}
                </section>

                <div className="vq-grid">
                    {KEYS.map(key => {
                        const p = VIDEO_PRESETS[key];
                        const r = results[key];
                        const inUse = current === key;
                        return (
                            <section key={key} className={`sf-panel vq-card${inUse ? " vq-card--on" : ""}`} aria-labelledby={`vq-${key}`}>
                                <div className="vq-card__head">
                                    <h3 id={`vq-${key}`} className="sf-h3">{p.label}</h3>
                                    {inUse && <span className="vq-badge"><Check size={12} weight="bold" /> In use</span>}
                                </div>
                                <p className="sf-muted vq-note">{p.note}</p>

                                <div className="vq-player">
                                    {r?.status === "done" ? (
                                        <video src={r.url} controls playsInline preload="metadata" />
                                    ) : r?.status === "working" ? (
                                        <div className="vq-wait" role="progressbar" aria-label={`Compressing ${p.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.progress || 0}>
                                            <span className="sf-num">Compressing {r.progress || 0}%</span>
                                            <i><b style={{ width: `${r.progress || 0}%` }} /></i>
                                        </div>
                                    ) : r?.status === "waiting" ? (
                                        <div className="vq-wait"><span>Waiting</span></div>
                                    ) : r?.status === "error" ? (
                                        <div className="vq-wait vq-wait--err"><span>{r.error}</span></div>
                                    ) : (
                                        <div className="vq-wait"><FilmSlate size={28} weight="light" /></div>
                                    )}
                                </div>

                                {r?.status === "done" && (
                                    <dl className="vq-facts">
                                        <div><dt>Size</dt><dd className="sf-num">{mb(r.size)}</dd></div>
                                        <div><dt>Per 30 s</dt><dd className="sf-num">{mb(r.size / Math.max(1, r.duration) * 30)}</dd></div>
                                        <div><dt>Picture</dt><dd className="sf-num">{r.width}×{r.height}</dd></div>
                                        <div><dt>Took</dt><dd className="sf-num">{Math.round(r.seconds)} s</dd></div>
                                    </dl>
                                )}
                                {r?.status === "done" && !r.audio && <p className="sf-faint vq-small">This browser saved it without sound.</p>}

                                <button type="button" className={`sf-btn ${inUse ? "sf-btn--ghost" : "sf-btn--primary"} sf-btn--sm vq-use`}
                                    disabled={inUse || Boolean(saving)} onClick={() => choose(key)}>
                                    {inUse ? "In use for new videos" : saving === key ? "Saving…" : "Use this quality"}
                                </button>
                            </section>
                        );
                    })}
                </div>
                <p className="sf-faint vq-small">The quality you pick applies to videos added from now on, on every device. Videos already on the site stay as they are.</p>
            </div>
        </AdminShell>
    );
};

const VQ_CSS = `
    .vq { display: grid; gap: 20px; }
    .vq-back { justify-self: start; }
    .vq-pick { display: grid; gap: 14px; justify-items: start; }
    .vq-sub { font-size: 14px; margin-top: 6px; max-width: 70ch; }
    .vq-file { cursor: pointer; }
    .vq-meta { font-size: 13px; }
    .vq-meta b { font-weight: 600; word-break: break-all; }
    .vq-alert { display: flex; gap: 8px; align-items: center; padding: 12px 14px; border-radius: var(--sf-r-input); font-size: 14px; color: var(--sf-text); background: rgba(240, 144, 127, 0.1); border: 1px solid rgba(240, 144, 127, 0.35); }
    .vq-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
    .vq-card { display: grid; gap: 12px; transition: border-color .2s; }
    .vq-card--on { border-color: rgba(217, 178, 111, 0.55); }
    .vq-card__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .vq-badge { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--sf-gold-soft); color: var(--sf-gold); font-size: 12px; font-weight: 600; }
    .vq-note { font-size: 14px; margin-top: -6px; }
    .vq-player { aspect-ratio: 3 / 4; border-radius: 14px; overflow: hidden; background: #0b0b0b; border: 1px solid var(--sf-line); display: grid; }
    .vq-player video { width: 100%; height: 100%; object-fit: contain; background: #0b0b0b; }
    .vq-wait { display: grid; place-content: center; justify-items: center; gap: 10px; padding: 16px; color: var(--sf-text-3); font-size: 13px; text-align: center; }
    .vq-wait span { color: var(--sf-text-2); font-weight: 600; }
    .vq-wait i { display: block; width: 140px; height: 3px; border-radius: 3px; background: var(--sf-line); overflow: hidden; }
    .vq-wait i b { display: block; height: 100%; background: var(--sf-gold); transition: width .2s; }
    .vq-wait--err span { color: var(--sf-danger); font-weight: 500; }
    .vq-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
    .vq-facts div { background: var(--sf-surface-2); border-radius: 12px; padding: 10px 12px; display: grid; gap: 2px; }
    .vq-facts dt { font-size: 12px; color: var(--sf-text-3); }
    .vq-facts dd { margin: 0; font-size: 15px; font-weight: 600; }
    .vq-small { font-size: 13px; }
    .vq-use { justify-self: stretch; }
    @media (max-width: 860px) { .vq-grid { grid-template-columns: 1fr; } .vq-player { aspect-ratio: auto; max-height: 70vh; } .vq-player video { max-height: 70vh; } }
`;

export default AdminVideoQualityPage;
