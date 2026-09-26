import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createType } from "../services/typeService";
import AdminShell from "../components/storefront/AdminShell";

const CATEGORIES = ["Backpacks", "Luggage", "Bags", "Accessories"];

// Which field a validation message belongs to, so it can sit under that field.
const errorField = (msg) =>
    msg === "Title is required" ? "title"
        : msg === "Category is required" ? "category"
            : msg.startsWith("Discount") ? "discount" : null;

export default function AddType() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", category: "", discount: "", note: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setError("Title is required");
        if (!form.category) return setError("Category is required");
        if (form.discount !== "" && (isNaN(form.discount) || form.discount < 0 || form.discount > 100))
            return setError("Discount must be between 0 and 100");
        setLoading(true); setError("");
        try {
            const res = await createType({
                title: form.title.trim(),
                category: form.category,
                discount: form.discount === "" ? 0 : Number(form.discount),
                note: form.note.trim(),
            });
            if (res.success) navigate("/admin/dashboard");
        } catch (err) { setError(err.message || "Failed to create type"); }
        finally { setLoading(false); }
    };

    const ef = error ? errorField(error) : null;
    const fieldErr = (k) => ef === k ? <p id={`${k}-error`} className="sf-error" role="alert">{error}</p> : null;
    const inv = (k) => ef === k ? { "aria-invalid": "true", "aria-describedby": `${k}-error` } : {};

    return (
        <AdminShell
            title="Add type"
            subtitle="A type sits under a category (for example Carry-on luggage under Luggage). Its discount and note apply to every bag of this type."
            width={720}
        >
            <style>{TYPE_FORM_CSS}</style>
            <form onSubmit={handleSubmit} className="tf">
                <div className="tf__row">
                    <div className="sf-field">
                        <label className="sf-label" htmlFor="type-category">Category</label>
                        <select id="type-category" className="sf-input" value={form.category} onChange={e => set("category", e.target.value)} {...inv("category")}>
                            <option value="">Select a category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {fieldErr("category")}
                    </div>

                    <div className="sf-field">
                        <label className="sf-label" htmlFor="type-title">Title</label>
                        <input id="type-title" className="sf-input" type="text" value={form.title} onChange={e => set("title", e.target.value)}
                            placeholder="Carry-on luggage, Briefcases" {...inv("title")} />
                        {fieldErr("title")}
                    </div>
                </div>

                <div className="sf-field tf__narrow">
                    <label className="sf-label" htmlFor="type-discount">Discount (%) <small>Optional, 0 to 100</small></label>
                    <input id="type-discount" className="sf-input sf-num" type="number" min="0" max="100" inputMode="numeric" value={form.discount} onChange={e => set("discount", e.target.value)}
                        placeholder="20" {...inv("discount")} />
                    {fieldErr("discount")}
                </div>

                <div className="sf-field">
                    <label className="sf-label" htmlFor="type-note">Note <small>Optional</small></label>
                    <textarea id="type-note" className="sf-input" value={form.note} onChange={e => set("note", e.target.value)} rows={3}
                        placeholder="With every 2 items of this type you win 1" />
                </div>

                {error && !ef && <p className="sf-error" role="alert">{error}</p>}

                <div className="tf__actions">
                    <button type="submit" className="sf-btn sf-btn--primary" disabled={loading} aria-busy={loading}>
                        {loading ? "Saving…" : "Save type"}
                    </button>
                    <button type="button" className="sf-btn sf-btn--ghost" onClick={() => navigate("/admin/dashboard")}>Cancel</button>
                </div>
            </form>
        </AdminShell>
    );
}

const TYPE_FORM_CSS = `
    .tf { display: grid; gap: 22px; }
    .tf__row { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 16px; align-items: start; }
    .tf__narrow { max-width: 220px; }
    .tf__actions { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 22px; border-top: 1px solid var(--sf-line); }
    @media (max-width: 560px) {
        .tf__row { grid-template-columns: 1fr; }
        .tf__narrow { max-width: none; }
        .tf__actions .sf-btn { flex: 1 1 140px; }
    }
`;
