import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageSquare, X } from "@phosphor-icons/react";
import { createCollection } from "../services/collectionService";
import AdminShell from "../components/storefront/AdminShell";

export default function AddCollection() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [logo, setLogo] = useState("");
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogo = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setLogo(ev.target.result); setPreview(ev.target.result); };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Title is required");
        setLoading(true); setError("");
        try {
            const res = await createCollection({ title: title.trim(), logo });
            if (res.success) navigate("/admin/dashboard");
        } catch (err) { setError(err.message || "Failed to create collection"); }
        finally { setLoading(false); }
    };

    const titleErr = error === "Title is required";

    return (
        <AdminShell
            title="Add collection"
            subtitle="A collection is a product line (for example Alpha or Voyageur) that can span many types and categories."
            width={720}
        >
            <style>{COLLECTION_FORM_CSS}</style>
            <form onSubmit={handleSubmit} className="cf">
                <div className="sf-field">
                    <span className="sf-label" id="logo-label">Logo <small>Optional</small></span>
                    {preview
                        ? <div className="cf__logo">
                            <img src={preview} alt="Collection logo preview" />
                            <button type="button" className="cf__remove" onClick={() => { setLogo(""); setPreview(""); }} aria-label="Remove logo" title="Remove logo">
                                <X size={16} weight="bold" />
                            </button>
                          </div>
                        : <label className="cf__drop">
                            <ImageSquare size={26} />
                            <span>Choose image</span>
                            <input type="file" accept="image/*" onChange={handleLogo} className="cf__file" aria-labelledby="logo-label" />
                          </label>
                    }
                </div>

                <div className="sf-field">
                    <label className="sf-label" htmlFor="collection-title">Title</label>
                    <input id="collection-title" className="sf-input" type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Alpha, Voyageur, Harrison"
                        aria-invalid={titleErr ? "true" : undefined} aria-describedby={titleErr ? "collection-title-error" : undefined} />
                    {titleErr && <p id="collection-title-error" className="sf-error" role="alert">{error}</p>}
                </div>

                {error && !titleErr && <p className="sf-error" role="alert">{error}</p>}

                <div className="cf__actions">
                    <button type="submit" className="sf-btn sf-btn--primary" disabled={loading} aria-busy={loading}>
                        {loading ? "Saving…" : "Save collection"}
                    </button>
                    <button type="button" className="sf-btn sf-btn--ghost" onClick={() => navigate("/admin/dashboard")}>Cancel</button>
                </div>
            </form>
        </AdminShell>
    );
}

const COLLECTION_FORM_CSS = `
    .cf { display: grid; gap: 22px; }
    .cf__drop, .cf__logo { width: 132px; height: 132px; border-radius: var(--sf-r-card); }
    .cf__drop { position: relative; display: grid; place-content: center; justify-items: center; gap: 8px; cursor: pointer;
        border: 1px dashed var(--sf-line-2); background: var(--sf-surface); color: var(--sf-text-2); font-size: 13.5px; transition: border-color .2s, color .2s; }
    .cf__drop:hover { border-color: rgba(217, 178, 111, 0.6); color: var(--sf-text); }
    .cf__drop:focus-within { outline: 2px solid var(--sf-gold); outline-offset: 3px; }
    .cf__drop svg { color: var(--sf-gold); }
    .cf__file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
    .cf__logo { position: relative; background: var(--sf-tile); overflow: hidden; }
    .cf__logo img { width: 100%; height: 100%; object-fit: contain; padding: 12px; }
    .cf__remove { position: absolute; top: 6px; right: 6px; width: 30px; height: 30px; border-radius: 999px; border: 0; display: grid; place-items: center;
        background: rgba(17, 17, 17, 0.85); color: var(--sf-danger); cursor: pointer; }
    .cf__remove:hover { background: #111; }
    .cf__change { position: absolute; left: 6px; bottom: 6px; height: 28px; padding: 0 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px;
        background: rgba(17, 17, 17, 0.85); color: #fff; font-size: 12.5px; font-weight: 500; cursor: pointer; }
    .cf__change:hover { background: #111; }
    .cf__change:focus-within { outline: 2px solid var(--sf-gold); outline-offset: 2px; }
    .cf__actions { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 22px; border-top: 1px solid var(--sf-line); }
    @media (max-width: 560px) { .cf__actions .sf-btn { flex: 1 1 140px; } }
`;
