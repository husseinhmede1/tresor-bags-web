import { lazy, Suspense, useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { getSettings, saveSettings } from "../services/settingService";
import { rememberSeason, SEASON_CHOICES } from "../utils/season";

const SeasonPreview = lazy(() => import("./storefront/SeasonDecor").then(m => ({ default: m.SeasonPreview })));
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());
const niceDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const labelOf = (v) => SEASON_CHOICES.find(c => c.value === v)?.label || v;

// The admin picks an occasion and, if they like, its last day. The home page then shows that
// occasion's small drawings around the bag; "Default" is the site as it always is.
export default function OccasionSetting() {
    const [saved, setSaved] = useState(null);          // what the server holds
    const [season, setSeason] = useState("");
    const [until, setUntil] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        let off = false;
        getSettings()
            .then((s) => { if (off) return; setSaved(s); setSeason(s.ended ? "" : s.season); setUntil(s.ended ? "" : s.seasonUntil); })
            .catch((e) => { if (!off) setError(e?.response?.data?.message || e.message || "Could not load the setting"); });
        return () => { off = true; };
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setError(""); setDone(false);
        try {
            const s = await saveSettings({ season, seasonUntil: season ? until : "" });
            setSaved(s);
            // this device shows the change straight away too
            rememberSeason(s.season ? { name: s.season, until: s.seasonUntil || null } : null);
            setDone(true);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Could not save");
        } finally {
            setBusy(false);
        }
    };

    const live = saved && saved.season && !saved.ended;
    const changed = saved && (season !== (saved.ended ? "" : saved.season) || (season ? until : "") !== (saved.ended ? "" : saved.seasonUntil));

    return (
        <form className="sf-panel oc" onSubmit={save}>
            <style>{CSS}</style>
            <div>
                <h2 className="sf-h3">Occasion</h2>
                <p className="sf-muted" style={{ fontSize: 14, marginTop: 4 }}>
                    Small gold drawings on the home page, around the bag. Nothing else on the site changes.
                </p>
            </div>

            {saved && (
                <p className="oc__now" role="status">
                    On the site now: <b>{live ? labelOf(saved.season) : "Default"}</b>
                    {live && saved.seasonUntil && <span className="sf-faint"> until {niceDate(saved.seasonUntil)}</span>}
                    {saved.ended && <span className="sf-faint"> ({labelOf(saved.season)} ended on {niceDate(saved.seasonUntil)})</span>}
                </p>
            )}

            <div className="oc__row">
                <div className="sf-field">
                    <label className="sf-label" htmlFor="oc-season">Show</label>
                    <select id="oc-season" className="sf-input" value={season} onChange={(e) => { setSeason(e.target.value); setDone(false); }} disabled={!saved}>
                        {SEASON_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                {season && (
                    <div className="sf-field">
                        <label className="sf-label" htmlFor="oc-until">Last day <small>Optional</small></label>
                        <input id="oc-until" className="sf-input sf-num" type="date" min={today()} value={until}
                            onChange={(e) => { setUntil(e.target.value); setDone(false); }} />
                    </div>
                )}
            </div>
            {season && (
                <p className="sf-faint" style={{ fontSize: 13 }}>
                    {until ? `After ${niceDate(until)} the site goes back to Default by itself.` : "Without a last day it stays until you choose Default again."}
                </p>
            )}

            {season && (
                <div className="oc__preview" aria-label={`The ${labelOf(season)} drawings`}>
                    <Suspense fallback={null}><SeasonPreview season={season} /></Suspense>
                </div>
            )}

            {error && <p className="sf-error" role="alert">{error}</p>}
            <div className="oc__actions">
                <button type="submit" className="sf-btn sf-btn--primary" disabled={busy || !saved || !changed}>{busy ? "Saving…" : "Save"}</button>
                {done && !changed && <span className="oc__done" role="status"><Check size={16} weight="bold" /> Saved. Visitors see it within a minute.</span>}
            </div>
        </form>
    );
}

const CSS = `
    .oc { display: grid; gap: 18px; }
    .oc__now { font-size: 15px; }
    .oc__row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
    .oc__preview { display: flex; flex-wrap: wrap; gap: 18px 22px; align-items: flex-start; padding: 20px; border-radius: 14px; background: #0B0B0C; border: 1px solid var(--sf-line); min-height: 96px; }
    .oc__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; }
    .oc__done { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: #8FCB98; }
    @media (max-width: 560px) { .oc__row { grid-template-columns: 1fr; } }
`;
