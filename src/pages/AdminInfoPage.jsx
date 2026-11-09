import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, PencilSimple, Trash, ChatCircleDots, Check, X, ArrowCounterClockwise } from "@phosphor-icons/react";
import AdminShell from "../components/storefront/AdminShell";
import { getInfo, createInfo, updateInfo, deleteInfo, getUnanswered, setQuestionState } from "../services/infoService";

// What the shop assistant knows about the store, plus the questions it could not answer.
// The assistant answers only from these entries and the catalog.

const CATEGORIES = [
    { k: "delivery", label: "Delivery" },
    { k: "payment", label: "Payment" },
    { k: "returns", label: "Returns" },
    { k: "store", label: "The shop" },
    { k: "general", label: "General" },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.k, c.label]));
const MAX_TITLE = 120;
const MAX_ANSWER = 800;
const EMPTY = { title: "", answer: "", category: "general", active: true };

const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }); } catch { return ""; } };

function InfoEditor({ initial, question, onSave, onCancel }) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);
    const titleRef = useRef(null);

    useEffect(() => {
        titleRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        (question ? document.getElementById("ie-answer") : titleRef.current)?.focus({ preventScroll: true });
    }, [question]);

    const titleErr = !form.title.trim() ? "Add a short title" : "";
    const answerErr = !form.answer.trim() ? "Write the answer customers should get" : "";
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setTouched(true);
        if (titleErr || answerErr) return;
        setSaving(true); setError("");
        try { await onSave({ ...form, title: form.title.trim(), answer: form.answer.trim() }); }
        catch (err) { setError(err.message || "Could not save, please try again"); setSaving(false); }
    };

    return (
        <form className="sf-panel ie" onSubmit={submit} noValidate>
            {question && (
                <p className="ie-q"><ChatCircleDots size={16} aria-hidden="true" /> <span>Answering <b dir="auto">"{question}"</b></span></p>
            )}
            <div className="ie-grid">
                <div className="sf-field">
                    <label className="sf-label" htmlFor="ie-title">Title</label>
                    <input id="ie-title" ref={titleRef} className="sf-input" dir="auto" maxLength={MAX_TITLE}
                        value={form.title} onChange={set("title")} placeholder="Delivery fee"
                        aria-invalid={touched && Boolean(titleErr)} aria-describedby="ie-title-err" />
                    {touched && titleErr && <p id="ie-title-err" className="sf-error">{titleErr}</p>}
                </div>
                <div className="sf-field">
                    <label className="sf-label" htmlFor="ie-cat">Category</label>
                    <select id="ie-cat" className="sf-input" value={form.category} onChange={set("category")}>
                        {CATEGORIES.map(c => <option key={c.k} value={c.k}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="sf-field">
                <label className="sf-label" htmlFor="ie-answer">
                    Answer <small>Any language. The assistant replies in the customer's language.</small>
                </label>
                <textarea id="ie-answer" className="sf-input ie-answer" dir="auto" rows={4} maxLength={MAX_ANSWER}
                    value={form.answer} onChange={set("answer")}
                    placeholder="Inside Beirut $3.50, outside Beirut $4. Delivery takes 1 to 3 days."
                    aria-invalid={touched && Boolean(answerErr)} aria-describedby="ie-answer-err ie-count" />
                <div className="ie-under">
                    {touched && answerErr ? <p id="ie-answer-err" className="sf-error">{answerErr}</p> : <span />}
                    <span id="ie-count" className="sf-faint sf-num ie-count">{form.answer.length}/{MAX_ANSWER}</span>
                </div>
            </div>
            <label className="ie-switch">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} />
                <span className="ie-track" aria-hidden="true"><span /></span>
                <span>{form.active ? "Live: the assistant uses it" : "Off: kept, but not used"}</span>
            </label>
            {error && <p className="sf-error" role="alert">{error}</p>}
            <div className="ie-actions">
                <button type="button" className="sf-btn sf-btn--ghost sf-btn--sm" onClick={onCancel} disabled={saving}>Cancel</button>
                <button type="submit" className="sf-btn sf-btn--primary sf-btn--sm" disabled={saving}>
                    <Check size={14} weight="bold" /> {saving ? "Saving" : "Save"}
                </button>
            </div>
        </form>
    );
}

export default function AdminInfoPage() {
    const [tab, setTab] = useState("info");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cat, setCat] = useState("");
    const [editing, setEditing] = useState(null);   // "new" | entry id
    const [answering, setAnswering] = useState(null); // unanswered question being answered
    const [confirmDel, setConfirmDel] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [qStatus, setQStatus] = useState("open");
    const [questions, setQuestions] = useState([]);
    const [openCount, setOpenCount] = useState(0);
    const [qLoading, setQLoading] = useState(true);
    const [qError, setQError] = useState("");

    useEffect(() => {
        getInfo()
            .then(r => setItems(r.data || []))
            .catch(e => setError(e.message || "Could not load the info"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let alive = true;
        getUnanswered(qStatus)
            .then(r => {
                if (!alive) return;
                setQuestions(r.data || []);
                if (qStatus === "open") setOpenCount((r.data || []).length);
            })
            .catch(e => alive && setQError(e.message || "Could not load the questions"))
            .finally(() => alive && setQLoading(false));
        return () => { alive = false; };
    }, [qStatus]);

    const showQuestions = (status) => {
        if (status === qStatus) return;
        setQLoading(true); setQError("");
        setQStatus(status);
    };

    const shown = useMemo(() => items.filter(i => !cat || i.category === cat), [items, cat]);
    const groups = useMemo(() => CATEGORIES
        .map(c => ({ ...c, rows: shown.filter(i => i.category === c.k) }))
        .filter(g => g.rows.length), [shown]);
    const liveCount = items.filter(i => i.active).length;

    const startNew = (q = null) => {
        setAnswering(q);
        setEditing("new");
        setConfirmDel(null);
        setTab("info");
    };

    const saveNew = async (form) => {
        const res = await createInfo({ ...form, ...(answering && { questionId: answering._id }) });
        setItems(list => [...list, res.data]);
        if (answering) {
            setQuestions(list => list.filter(q => q._id !== answering._id));
            setOpenCount(n => Math.max(0, n - (answering.status === "open" ? 1 : 0)));
        }
        setEditing(null); setAnswering(null);
    };

    const saveEdit = (id) => async (form) => {
        const res = await updateInfo(id, form);
        setItems(list => list.map(i => i._id === id ? res.data : i));
        setEditing(null);
    };

    const toggle = async (item) => {
        setBusyId(item._id);
        try {
            const res = await updateInfo(item._id, { active: !item.active });
            setItems(list => list.map(i => i._id === item._id ? res.data : i));
        } catch (e) { setError(e.message || "Could not update"); }
        finally { setBusyId(null); }
    };

    const remove = async (id) => {
        setBusyId(id);
        try {
            await deleteInfo(id);
            setItems(list => list.filter(i => i._id !== id));
            setConfirmDel(null);
        } catch (e) { setError(e.message || "Could not delete"); }
        finally { setBusyId(null); }
    };

    const setQ = async (q, status) => {
        setBusyId(q._id);
        try {
            await setQuestionState(q._id, status);
            setQuestions(list => list.filter(x => x._id !== q._id));
            setOpenCount(n => status === "open" ? n + 1 : Math.max(0, n - 1));
        } catch (e) { setQError(e.message || "Could not update"); }
        finally { setBusyId(null); }
    };

    const subtitle = loading ? "Loading" : `${liveCount} live ${liveCount === 1 ? "entry" : "entries"}. The assistant answers only from these and the catalog.`;

    return (
        <AdminShell title="Store info" subtitle={subtitle} width={920}
            actions={tab === "info" && editing !== "new" && (
                <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => startNew()}><Plus size={14} weight="bold" /> Add info</button>
            )}>
            <style>{INFO_CSS}</style>

            <div className="sf-seg ai-tabs" role="tablist" aria-label="Sections">
                <button role="tab" aria-selected={tab === "info"} aria-pressed={tab === "info"} onClick={() => setTab("info")}>Info</button>
                <button role="tab" aria-selected={tab === "questions"} aria-pressed={tab === "questions"} onClick={() => setTab("questions")}>
                    Unanswered {openCount > 0 && <span className="ai-count sf-num">{openCount}</span>}
                </button>
            </div>

            {tab === "info" && (
                <section>
                    {editing === "new" && (
                        <InfoEditor initial={{ ...EMPTY, title: answering?.text?.slice(0, MAX_TITLE) || "" }} question={answering?.text}
                            onSave={saveNew} onCancel={() => { setEditing(null); setAnswering(null); }} />
                    )}

                    {!loading && items.length > 0 && (
                        <div className="sf-chips ai-filter" role="group" aria-label="Filter by category">
                            <button type="button" className="sf-chip" aria-pressed={!cat} onClick={() => setCat("")}>All</button>
                            {CATEGORIES.map(c => (
                                <button key={c.k} type="button" className="sf-chip" aria-pressed={cat === c.k} onClick={() => setCat(c.k)}>{c.label}</button>
                            ))}
                        </div>
                    )}

                    {error && <p className="sf-error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

                    {loading ? (
                        <div className="ai-list" aria-busy="true" aria-label="Loading">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="ai-skel">
                                    <div className="sf-skel" style={{ height: 15, width: "34%" }} />
                                    <div className="sf-skel" style={{ height: 12, width: "82%" }} />
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 && editing !== "new" ? (
                        <div className="sf-panel ai-empty">
                            <ChatCircleDots size={40} color="#8C867E" />
                            <h2 className="sf-h3">Nothing here yet</h2>
                            <p className="sf-muted" style={{ maxWidth: "44ch" }}>Add delivery fees, return rules, opening hours and anything else customers ask about. The assistant starts using it right away.</p>
                            <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => startNew()}><Plus size={14} weight="bold" /> Add info</button>
                        </div>
                    ) : groups.length === 0 && items.length > 0 ? (
                        <p className="sf-muted ai-none">No entries in {CAT_LABEL[cat]} yet.</p>
                    ) : (
                        groups.map(g => (
                            <div key={g.k} className="ai-group">
                                <h2 className="ai-group-h">{g.label}</h2>
                                <ul className="ai-list">
                                    {g.rows.map(item => editing === item._id ? (
                                        <li key={item._id}>
                                            <InfoEditor initial={{ title: item.title, answer: item.answer, category: item.category, active: item.active }}
                                                onSave={saveEdit(item._id)} onCancel={() => setEditing(null)} />
                                        </li>
                                    ) : (
                                        <li key={item._id} className={`ai-item${item.active ? "" : " is-off"}`}>
                                            <div className="ai-text">
                                                <p className="ai-title" dir="auto">{item.title}</p>
                                                <p className="ai-answer" dir="auto">{item.answer}</p>
                                            </div>
                                            {confirmDel === item._id ? (
                                                <div className="ai-actions ai-confirm" role="group" aria-label={`Delete ${item.title}?`}>
                                                    <span>Delete?</span>
                                                    <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => setConfirmDel(null)} disabled={busyId === item._id}>No</button>
                                                    <button className="sf-btn sf-btn--sm ai-danger" onClick={() => remove(item._id)} disabled={busyId === item._id}>Delete</button>
                                                </div>
                                            ) : (
                                                <div className="ai-actions">
                                                    <button type="button" className={`ai-live${item.active ? " is-on" : ""}`} onClick={() => toggle(item)}
                                                        disabled={busyId === item._id} aria-pressed={item.active}
                                                        title={item.active ? "The assistant uses this. Click to turn off." : "Off. Click to let the assistant use it."}>
                                                        {item.active ? "Live" : "Off"}
                                                    </button>
                                                    <button className="sf-icon-btn" onClick={() => { setEditing(item._id); setConfirmDel(null); }} aria-label={`Edit ${item.title}`} title="Edit"><PencilSimple size={18} /></button>
                                                    <button className="sf-icon-btn" onClick={() => setConfirmDel(item._id)} aria-label={`Delete ${item.title}`} title="Delete"><Trash size={18} /></button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </section>
            )}

            {tab === "questions" && (
                <section>
                    <div className="ai-qhead">
                        <p className="sf-muted ai-qnote">Questions customers asked that the assistant had no answer for. Answer one and it becomes store info.</p>
                        <div className="sf-chips" role="group" aria-label="Show">
                            <button type="button" className="sf-chip" aria-pressed={qStatus === "open"} onClick={() => showQuestions("open")}>Open</button>
                            <button type="button" className="sf-chip" aria-pressed={qStatus === "ignored"} onClick={() => showQuestions("ignored")}>Ignored</button>
                        </div>
                    </div>

                    {qError && <p className="sf-error" role="alert" style={{ marginBottom: 16 }}>{qError}</p>}

                    {qLoading ? (
                        <div className="ai-list" aria-busy="true" aria-label="Loading">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="ai-skel">
                                    <div className="sf-skel" style={{ height: 15, width: "60%" }} />
                                    <div className="sf-skel" style={{ height: 12, width: "24%" }} />
                                </div>
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="sf-panel ai-empty">
                            <Check size={40} color="#8C867E" />
                            <h2 className="sf-h3">{qStatus === "open" ? "All caught up" : "Nothing ignored"}</h2>
                            <p className="sf-muted" style={{ maxWidth: "44ch" }}>
                                {qStatus === "open"
                                    ? "When a customer asks about the shop and the assistant has no answer, the question shows up here."
                                    : "Questions you ignore are kept here in case you change your mind."}
                            </p>
                        </div>
                    ) : (
                        <ul className="ai-list">
                            {questions.map(q => (
                                <li key={q._id} className="ai-item ai-qitem">
                                    <div className="ai-text">
                                        <p className="ai-title" dir="auto">{q.text}</p>
                                        <p className="ai-meta sf-num">
                                            <span className={q.count > 1 ? "ai-hot" : ""}>Asked {q.count} {q.count === 1 ? "time" : "times"}</span>
                                            <span>Last {fmtDate(q.lastAskedAt)}</span>
                                        </p>
                                    </div>
                                    <div className="ai-actions">
                                        {qStatus === "open" ? (
                                            <>
                                                <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => setQ(q, "ignored")} disabled={busyId === q._id}><X size={14} /> Ignore</button>
                                                <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => startNew(q)} disabled={busyId === q._id}><PencilSimple size={14} /> Answer</button>
                                            </>
                                        ) : (
                                            <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => setQ(q, "open")} disabled={busyId === q._id}><ArrowCounterClockwise size={14} /> Restore</button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </AdminShell>
    );
}

const INFO_CSS = `
    .ai-tabs { margin-bottom: 24px; }
    .ai-tabs button { display: inline-flex; align-items: center; gap: 8px; }
    .ai-count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--sf-gold); color: var(--sf-on-gold); font-size: 11.5px; font-weight: 700; display: inline-grid; place-items: center; }
    .ai-filter { margin-bottom: 20px; }
    .ai-group + .ai-group { margin-top: 28px; }
    .ai-group-h { font: 600 13px/1 var(--sf-font); color: var(--sf-text-3); margin: 0 0 10px; letter-spacing: 0; }
    .ai-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .ai-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 18px; border-radius: 16px; background: var(--sf-surface); border: 1px solid var(--sf-line); transition: border-color .2s, opacity .2s; }
    .ai-item:hover { border-color: var(--sf-line-2); }
    .ai-item.is-off .ai-text { opacity: .55; }
    .ai-title { font-size: 15.5px; font-weight: 550; letter-spacing: -0.01em; overflow-wrap: anywhere; }
    .ai-answer { margin-top: 4px; font-size: 14px; line-height: 1.55; color: var(--sf-text-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
    .ai-actions { display: flex; align-items: center; gap: 6px; }
    .ai-confirm span { font-size: 14px; color: var(--sf-text-2); margin-right: 4px; }
    .ai-danger { background: rgba(240,144,127,0.14); color: var(--sf-danger); border: 1px solid rgba(240,144,127,0.4); }
    .ai-danger:hover:not(:disabled) { background: rgba(240,144,127,0.22); }
    .ai-live { height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--sf-line-2); background: transparent; color: var(--sf-text-3); font: 600 12.5px/1 var(--sf-font); cursor: pointer; margin-right: 4px; transition: color .2s, border-color .2s, background-color .2s; }
    .ai-live.is-on { color: var(--sf-gold); border-color: rgba(217,178,111,0.5); background: var(--sf-gold-soft); }
    .ai-live:focus-visible { outline: 2px solid var(--sf-gold); outline-offset: 2px; }
    .ai-skel { display: grid; gap: 10px; padding: 18px; border-radius: 16px; background: var(--sf-surface); border: 1px solid var(--sf-line); }
    .ai-empty { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 56px 24px; }
    .ai-none { padding: 24px 0; }
    .ai-qhead { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .ai-qnote { font-size: 14px; max-width: 60ch; }
    .ai-meta { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--sf-text-3); }
    .ai-hot { color: var(--sf-gold); }

    .ie { display: grid; gap: 18px; margin-bottom: 24px; border-color: rgba(217,178,111,0.35); animation: ieIn .35s cubic-bezier(0.16,1,0.3,1); }
    .ie-q { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; color: var(--sf-text-2); }
    .ie-q svg { color: var(--sf-gold); flex-shrink: 0; margin-top: 3px; }
    .ie-q b { color: var(--sf-text); font-weight: 550; }
    .ie-grid { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 14px; }
    .ie-answer { min-height: 112px; resize: vertical; line-height: 1.55; padding-top: 12px; padding-bottom: 12px; }
    .ie-under { display: flex; justify-content: space-between; gap: 12px; }
    .ie-count { font-size: 12.5px; }
    .ie-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .ie-switch { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--sf-text-2); cursor: pointer; width: fit-content; }
    .ie-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .ie-track { width: 38px; height: 22px; border-radius: 999px; background: var(--sf-surface-2); border: 1px solid var(--sf-line-2); position: relative; transition: background-color .2s, border-color .2s; flex-shrink: 0; }
    .ie-track span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--sf-text-3); transition: transform .2s cubic-bezier(0.16,1,0.3,1), background-color .2s; }
    .ie-switch input:checked + .ie-track { background: var(--sf-gold-soft); border-color: rgba(217,178,111,0.6); }
    .ie-switch input:checked + .ie-track span { transform: translateX(16px); background: var(--sf-gold); }
    .ie-switch input:focus-visible + .ie-track { outline: 2px solid var(--sf-gold); outline-offset: 2px; }
    @keyframes ieIn { from { opacity: 0; transform: translateY(6px); } }

    @media (max-width: 640px) {
        .ai-item { grid-template-columns: 1fr; gap: 12px; padding: 14px 16px; }
        .ai-actions { justify-content: flex-end; }
        .ie-grid { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
        .ie { animation: none; }
        .ie-track span { transition: none; }
    }
`;
