import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImageSquare, Plus, Star, Trash, X } from "@phosphor-icons/react";
import AdminShell from "./storefront/AdminShell";
import { getAllTypes } from "../services/typeService";
import { getAllCollections } from "../services/collectionService";
import AiQuickAdd from "./AiQuickAdd";

/* Field must live OUTSIDE BagForm so it isn't recreated on every render. */
const Field = ({ id, label, required, hint, error, children }) => (
    <div className="sf-field">
        <label className="sf-label" htmlFor={id}>
            {label}{required && <span className="sf-gold" aria-hidden="true">*</span>}
            {hint && <small>{hint}</small>}
        </label>
        {children}
        {error && <p id={`${id}-error`} className="sf-error bf-field-error">{error}</p>}
    </div>
);

/* aria props for an input that may carry an error */
const errProps = (id, error) => ({
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
});

const BagForm = ({ bagId = null, initialData = null, onSubmit, title = "Add bag" }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        mainImage: "",
        sideImages: [],
        dimensions: { height: "", width: "", depth: "" },
        weight: "",
        color: "",
        capacity: "",
        typeId: "",
        collectionId: "",
        stock: "",
        gender: "",
    });

    const [errors, setErrors]                       = useState({});
    const [loading, setLoading]                     = useState(false);
    const [imagePreview, setImagePreview]           = useState("");
    const [sideImagePreviews, setSideImagePreviews] = useState([]);
    const [types, setTypes]                         = useState([]);
    const [collections, setCollections]             = useState([]);
    const [supplierPrice, setSupplierPrice]         = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                typeId: initialData.typeId?._id || initialData.typeId || "",
                collectionId: initialData.collectionId?._id || initialData.collectionId || "",
                gender: initialData.gender || "",
            });
            if (initialData.mainImage)  setImagePreview(initialData.mainImage);
            if (initialData.sideImages) setSideImagePreviews(initialData.sideImages);
        }
    }, [initialData]);

    useEffect(() => {
        getAllTypes().then(res => { if (res.success) setTypes(res.data); }).catch(() => {});
        getAllCollections().then(res => { if (res.success) setCollections(res.data); }).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes("dimensions.")) {
            const field = name.split(".")[1];
            setFormData(p => ({ ...p, dimensions: { ...p.dimensions, [field]: value ? Number(value) : "" } }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
        if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
    };

    /* Merge what the AI read from the chat into the form; blanks never overwrite. */
    const applyAiResult = (d, uploaded = []) => {
        // Photos the AI marked as product shots: main first, the rest go to the gallery.
        const productNums = (d.images || []).filter(i => i.kind === "product").map(i => i.number);
        if (productNums.length) {
            const mainNum = d.mainImage || productNums[0];
            const main = uploaded[mainNum - 1];
            const gallery = productNums.filter(n => n !== mainNum).map(n => uploaded[n - 1]).slice(0, 10);
            setFormData(p => ({ ...p, mainImage: main, sideImages: gallery }));
            setImagePreview(main);
            setSideImagePreviews(gallery);
        }

        const has = v => v !== null && v !== undefined && v !== "";
        setFormData(p => ({
            ...p,
            ...(has(d.title)        && { title: d.title }),
            ...(has(d.description)  && { description: d.description }),
            ...(has(d.color)        && { color: d.color }),
            ...(has(d.capacity)     && { capacity: d.capacity }),
            ...(has(d.weight)       && { weight: d.weight }),
            ...(has(d.gender)       && { gender: d.gender }),
            ...(has(d.typeId)       && { typeId: d.typeId }),
            ...(has(d.collectionId) && { collectionId: d.collectionId }),
            dimensions: {
                height: has(d.dimensions?.height) ? d.dimensions.height : p.dimensions.height,
                width:  has(d.dimensions?.width)  ? d.dimensions.width  : p.dimensions.width,
                depth:  has(d.dimensions?.depth)  ? d.dimensions.depth  : p.dimensions.depth,
            },
        }));
        setSupplierPrice(has(d.supplierPrice)
            ? { amount: d.supplierPrice, currency: d.supplierCurrency || "", notes: d.notes }
            : d.notes ? { notes: d.notes } : null);
        setErrors({});
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFormData(p => ({ ...p, mainImage: ev.target.result }));
            setImagePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSideImageAdd = (e) => {
        const files = Array.from(e.target.files);
        if (sideImagePreviews.length + files.length > 10) {
            setErrors(p => ({ ...p, sideImages: "Maximum 10 side images allowed" }));
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSideImagePreviews(p => [...p, ev.target.result]);
                setFormData(p => ({ ...p, sideImages: [...p.sideImages, ev.target.result] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveSideImage = (i) => {
        setSideImagePreviews(p => p.filter((_, j) => j !== i));
        setFormData(p => ({ ...p, sideImages: p.sideImages.filter((_, j) => j !== i) }));
    };

    // Swap a gallery photo with the current main image.
    const handleMakeMain = (i) => {
        const picked = sideImagePreviews[i];
        const rest = sideImagePreviews.filter((_, j) => j !== i);
        const gallery = imagePreview ? [imagePreview, ...rest] : rest;
        setImagePreview(picked);
        setSideImagePreviews(gallery);
        setFormData(p => ({ ...p, mainImage: picked, sideImages: gallery }));
    };

    const handleRemoveMainImage = () => {
        setFormData(p => ({ ...p, mainImage: "" }));
        setImagePreview("");
    };

    const validateForm = () => {
        const e = {};
        if (!formData.title.trim())       e.title       = "Title is required";
        if (!formData.description.trim()) e.description = "Description is required";
        if (!formData.price || formData.price < 0) e.price = "Valid price is required";
        if (!formData.mainImage)          e.mainImage   = "Main image is required";
        if (!formData.color.trim())       e.color       = "Color is required";
        if (!formData.typeId)             e.typeId      = "Type is required";
        if (!formData.collectionId)       e.collectionId = "Collection is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            // The Save button is at the bottom; bring the first missing field into view.
            setTimeout(() => document.querySelector(".bf-field-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
            return;
        }
        setLoading(true);
        try {
            const res = await onSubmit(formData);
            if (res && !res.success) setErrors({ submit: res.message || "Could not save the bag, please try again" });
        }
        catch (err) { setErrors({ submit: err?.message || "Could not save the bag, please try again" }); }
        finally { setLoading(false); }
    };

    const missing = Object.keys(errors).filter(k => k !== "submit").length;

    const handleCancel = () => navigate("/admin/dashboard");

    const typeLabel = (t) => `${t.title} · ${t.category}${t.discount > 0 ? ` (${t.discount}% off)` : ""}`;

    return (
        <AdminShell
            title={title}
            subtitle={bagId ? "Changes go live as soon as you save." : "Add the photos and details, then save to publish."}
            width={1120}
        >
            <style>{BF_CSS}</style>
            <form onSubmit={handleSubmit} className="bf">
                {!bagId && !initialData && <AiQuickAdd onResult={applyAiResult} />}

                <div className="bf-split">

                    {/* Left: images */}
                    <div className="bf-col">

                        <section className="sf-panel bf-panel" aria-labelledby="bf-main-h">
                            <div className="bf-panel__head">
                                <h2 id="bf-main-h" className="sf-h3">Main image</h2>
                                <span className="sf-faint bf-meta">Required</span>
                            </div>
                            {imagePreview ? (
                                <div className="bf-main">
                                    <div className="sf-tile bf-main__tile">
                                        <img src={imagePreview} alt="Main" />
                                    </div>
                                    <button type="button" className="sf-btn sf-btn--ghost sf-btn--sm"
                                        onClick={handleRemoveMainImage}>
                                        <Trash size={16} /> Remove and reupload
                                    </button>
                                </div>
                            ) : (
                                <label className={`bf-drop${errors.mainImage ? " bf-drop--err" : ""}`}>
                                    <ImageSquare size={32} weight="light" className="sf-gold" />
                                    <span className="bf-drop__title">Upload the main image</span>
                                    <span className="sf-faint bf-drop__hint">Click to browse</span>
                                    <input type="file" accept="image/*"
                                        onChange={handleMainImageChange} hidden />
                                </label>
                            )}
                            {errors.mainImage && <p className="sf-error bf-field-error bf-err-gap">{errors.mainImage}</p>}
                        </section>

                        <section className="sf-panel bf-panel" aria-labelledby="bf-gallery-h">
                            <div className="bf-panel__head">
                                <h2 id="bf-gallery-h" className="sf-h3">Gallery</h2>
                                <span className="sf-faint sf-num bf-meta">{sideImagePreviews.length}/10</span>
                            </div>
                            <p className="sf-muted bf-sub">Optional photos for the product slider.</p>
                            <div className="bf-gallery">
                                {sideImagePreviews.map((src, i) => (
                                    <div key={i} className="bf-thumb">
                                        <div className="sf-tile bf-thumb__tile">
                                            <img src={src} alt={`Gallery photo ${i + 1}`} />
                                        </div>
                                        <button type="button" className="bf-thumb__remove"
                                            onClick={() => handleRemoveSideImage(i)}
                                            aria-label={`Remove gallery photo ${i + 1}`}>
                                            <X size={14} weight="bold" />
                                        </button>
                                        <button type="button" className="bf-thumb__main"
                                            onClick={() => handleMakeMain(i)}
                                            title="Make this the main image">
                                            <Star size={12} weight="fill" /> Main
                                        </button>
                                    </div>
                                ))}
                                {sideImagePreviews.length < 10 && (
                                    <label className="bf-add">
                                        <Plus size={22} />
                                        <span>Add</span>
                                        <input type="file" accept="image/*" multiple
                                            onChange={handleSideImageAdd} hidden />
                                    </label>
                                )}
                            </div>
                            {errors.sideImages && <p className="sf-error bf-err-gap">{errors.sideImages}</p>}
                        </section>
                    </div>

                    {/* Right: details */}
                    <div className="bf-col">
                        <section className="sf-panel bf-panel" aria-labelledby="bf-details-h">
                            <h2 id="bf-details-h" className="sf-h3" style={{ marginBottom: 20 }}>Details</h2>

                            {supplierPrice && (
                                <div className="bf-hint">
                                    {supplierPrice.amount != null && (
                                        <div>Supplier price: <b className="sf-num">{supplierPrice.amount} {supplierPrice.currency}</b>. Set your selling price below.</div>
                                    )}
                                    {supplierPrice.notes && <div dir="auto">{supplierPrice.notes}</div>}
                                </div>
                            )}

                            <div className="bf-fields">
                                <Field id="bf-title" label="Title" required error={errors.title}>
                                    <input id="bf-title" className="sf-input" type="text" name="title" dir="auto"
                                        value={formData.title} onChange={handleChange}
                                        placeholder="e.g. Classic leather tote"
                                        {...errProps("bf-title", errors.title)} />
                                </Field>

                                <Field id="bf-description" label="Description" required error={errors.description}>
                                    <textarea id="bf-description" className="sf-input" name="description" dir="auto"
                                        value={formData.description} onChange={handleChange}
                                        placeholder="Materials, size, what fits inside…"
                                        rows={5}
                                        {...errProps("bf-description", errors.description)} />
                                </Field>

                                <div className="bf-2col">
                                    <Field id="bf-price" label="Price" hint="USD" required error={errors.price}>
                                        <input id="bf-price" className="sf-input sf-num" type="number" name="price"
                                            value={formData.price} onChange={handleChange}
                                            placeholder="0.00" min="0" step="0.01" inputMode="decimal"
                                            {...errProps("bf-price", errors.price)} />
                                    </Field>
                                    <Field id="bf-color" label="Color" required error={errors.color}>
                                        <input id="bf-color" className="sf-input" type="text" name="color"
                                            value={formData.color} onChange={handleChange}
                                            placeholder="e.g. Black"
                                            {...errProps("bf-color", errors.color)} />
                                    </Field>
                                </div>

                                <div className="bf-2col">
                                    <Field id="bf-type" label="Type" required error={errors.typeId}>
                                        <select id="bf-type" className="sf-input" name="typeId"
                                            value={formData.typeId || ""} onChange={handleChange}
                                            style={{ color: formData.typeId ? undefined : "var(--sf-text-3)" }}
                                            {...errProps("bf-type", errors.typeId)}>
                                            <option value="">Select type</option>
                                            {types.map(t => (
                                                <option key={t._id} value={t._id}>{typeLabel(t)}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field id="bf-collection" label="Collection" required error={errors.collectionId}>
                                        <select id="bf-collection" className="sf-input" name="collectionId"
                                            value={formData.collectionId || ""} onChange={handleChange}
                                            style={{ color: formData.collectionId ? undefined : "var(--sf-text-3)" }}
                                            {...errProps("bf-collection", errors.collectionId)}>
                                            <option value="">Select collection</option>
                                            {collections.map(c => (
                                                <option key={c._id} value={c._id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <div className="bf-2col">
                                    <Field id="bf-gender" label="Gender" hint="Optional">
                                        <select id="bf-gender" className="sf-input" name="gender"
                                            value={formData.gender || ""} onChange={handleChange}
                                            style={{ color: formData.gender ? undefined : "var(--sf-text-3)" }}>
                                            <option value="">Select gender</option>
                                            <option value="Men's">Men's</option>
                                            <option value="Women's">Women's</option>
                                            <option value="Unisex">Unisex</option>
                                        </select>
                                    </Field>
                                    <Field id="bf-stock" label="Stock" hint="Units">
                                        <input id="bf-stock" className="sf-input sf-num" type="number" name="stock"
                                            value={formData.stock} onChange={handleChange}
                                            placeholder="0" min="0" inputMode="numeric" />
                                    </Field>
                                </div>
                            </div>

                            <h3 className="bf-subhead">Size and weight <span className="sf-faint">Optional</span></h3>
                            <div className="bf-fields">
                                <div className="bf-3col">
                                    <Field id="bf-height" label="Height" hint="cm">
                                        <input id="bf-height" className="sf-input sf-num" type="number" name="dimensions.height"
                                            value={formData.dimensions.height} onChange={handleChange}
                                            placeholder="0" min="0" inputMode="decimal" />
                                    </Field>
                                    <Field id="bf-width" label="Width" hint="cm">
                                        <input id="bf-width" className="sf-input sf-num" type="number" name="dimensions.width"
                                            value={formData.dimensions.width} onChange={handleChange}
                                            placeholder="0" min="0" inputMode="decimal" />
                                    </Field>
                                    <Field id="bf-depth" label="Depth" hint="cm">
                                        <input id="bf-depth" className="sf-input sf-num" type="number" name="dimensions.depth"
                                            value={formData.dimensions.depth} onChange={handleChange}
                                            placeholder="0" min="0" inputMode="decimal" />
                                    </Field>
                                </div>
                                <div className="bf-2col">
                                    <Field id="bf-weight" label="Weight" hint="kg">
                                        <input id="bf-weight" className="sf-input sf-num" type="number" name="weight"
                                            value={formData.weight} onChange={handleChange}
                                            placeholder="0.00" min="0" step="0.01" inputMode="decimal" />
                                    </Field>
                                    <Field id="bf-capacity" label="Capacity">
                                        <input id="bf-capacity" className="sf-input" type="text" name="capacity"
                                            value={formData.capacity} onChange={handleChange}
                                            placeholder="e.g. 20L" />
                                    </Field>
                                </div>
                            </div>
                        </section>

                        {/* Publish */}
                        <section className="sf-panel bf-panel bf-publish" aria-labelledby="bf-publish-h">
                            <h2 id="bf-publish-h" className="sf-h3">Ready to publish</h2>
                            <p className="sf-muted bf-sub">Save once the main image and the details are complete.</p>
                            {errors.submit && <div className="bf-alert" role="alert">{errors.submit}</div>}
                            {missing > 0 && !errors.submit && (
                                <div className="bf-alert" role="alert">
                                    Please fill the {missing === 1 ? "field" : `${missing} fields`} marked in red before saving.
                                </div>
                            )}
                            <div className="bf-actions">
                                <button type="button" className="sf-btn sf-btn--ghost" onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button type="submit" className="sf-btn sf-btn--primary bf-save" disabled={loading}>
                                    {loading && <span className="bf-spinner" aria-hidden="true" />}
                                    {loading ? "Saving…" : "Save bag"}
                                </button>
                            </div>
                        </section>
                    </div>

                </div>
            </form>
        </AdminShell>
    );
};

const BF_CSS = `
    .bf-split { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 24px; align-items: start; }
    .bf-col { display: grid; gap: 24px; min-width: 0; }
    .bf-panel__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .bf-meta { font-size: 13px; }
    .bf-sub { font-size: 14px; margin: -8px 0 16px; }
    .bf-publish .bf-sub { margin: 6px 0 18px; }
    .bf-err-gap { margin-top: 10px !important; }
    .bf-fields { display: grid; gap: 18px; }
    .bf-2col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .bf-3col { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .bf-subhead { margin: 28px 0 16px !important; padding-top: 22px; border-top: 1px solid var(--sf-line); font-size: 15px; font-weight: 550; display: flex; gap: 8px; align-items: baseline; }
    .bf-subhead span { font-size: 13px; font-weight: 400; }
    .bf .sf-label span.sf-gold { margin-left: -4px; }

    .bf-main { display: grid; gap: 12px; justify-items: start; }
    .bf-main__tile { aspect-ratio: 1 / 1; cursor: default; }
    .bf-drop { display: grid; justify-items: center; gap: 6px; padding: 48px 20px; border-radius: var(--sf-r-card); border: 1.5px dashed var(--sf-line-2); background: var(--sf-surface-2); cursor: pointer; text-align: center; transition: border-color .2s, background-color .2s; }
    .bf-drop:hover { border-color: rgba(217, 178, 111, 0.6); background: var(--sf-gold-soft); }
    .bf-drop--err { border-color: var(--sf-danger); }
    .bf-drop__title { font-weight: 550; margin-top: 6px; }
    .bf-drop__hint { font-size: 13px; }

    .bf-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
    .bf-thumb { position: relative; }
    .bf-thumb__tile { aspect-ratio: 1 / 1; cursor: default; }
    .bf-thumb__tile img { padding: 6%; }
    .bf-thumb__remove { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; border-radius: 999px; border: 0; background: rgba(17,17,17,.82); color: #fff; display: grid; place-items: center; cursor: pointer; }
    .bf-thumb__remove:hover { color: var(--sf-danger); }
    .bf-thumb__main { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); height: 26px; padding: 0 10px; border-radius: 999px; border: 0; background: rgba(17,17,17,.82); color: var(--sf-gold); display: inline-flex; align-items: center; gap: 4px; font: 600 12px/1 var(--sf-font); cursor: pointer; white-space: nowrap; }
    .bf-thumb__main:hover { background: #111; color: var(--sf-gold-2); }
    .bf-add { aspect-ratio: 1 / 1; display: grid; place-content: center; justify-items: center; gap: 4px; border-radius: var(--sf-r-card); border: 1.5px dashed var(--sf-line-2); color: var(--sf-text-2); font-size: 13px; font-weight: 500; cursor: pointer; transition: border-color .2s, color .2s, background-color .2s; }
    .bf-add:hover { border-color: rgba(217, 178, 111, 0.6); color: var(--sf-gold); background: var(--sf-gold-soft); }

    .bf-hint { display: grid; gap: 4px; padding: 12px 14px; margin-bottom: 20px; border-radius: var(--sf-r-input); font-size: 14px; color: var(--sf-text); background: var(--sf-gold-soft); border: 1px solid rgba(217, 178, 111, 0.3); }
    .bf-hint b { color: var(--sf-gold); font-weight: 600; }

    .bf-alert { padding: 12px 14px; margin-bottom: 16px; border-radius: var(--sf-r-input); font-size: 14px; color: var(--sf-text); background: rgba(240, 144, 127, 0.1); border: 1px solid rgba(240, 144, 127, 0.35); }
    .bf-actions { display: flex; gap: 12px; }
    .bf-save { flex: 1; }
    .bf-spinner { width: 14px; height: 14px; border-radius: 999px; border: 2px solid rgba(23, 19, 11, 0.3); border-top-color: var(--sf-on-gold); animation: sfSpin .7s linear infinite; }

    @media (max-width: 860px) {
        .bf-split { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
        .bf-2col { grid-template-columns: 1fr; }
        .bf-3col { gap: 8px; }
    }
`;

export default BagForm;
