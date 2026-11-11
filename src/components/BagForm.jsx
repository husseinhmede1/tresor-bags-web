import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FilmSlate, ImageSquare, Play, Plus, Star, Trash, X } from "@phosphor-icons/react";
import AdminShell from "./storefront/AdminShell";
import { getAllTypes } from "../services/typeService";
import { getAllCollections } from "../services/collectionService";
import AiQuickAdd from "./AiQuickAdd";
import { getVideoUploadAuth, uploadVideoFile } from "../services/bagService";
import { isCompressedVideo, posterFileOf, videoPoster } from "../utils/image";
import { canCompress, capturePoster, compressVideo } from "../utils/videoCompress";
import { compressImage } from "../utils/imageCompress";

const MAX_VIDEOS = 5;
const MAX_VIDEO_MB = 100;   // ImageKit free plan upload limit (for the file that is uploaded)
const MAX_SOURCE_MB = 2048; // before compression on this device
const NO_COMPRESS = "This device can't prepare videos. Add it from a laptop (Chrome) or an iPhone";
const LONG_VIDEO_S = 45;    // longer clips use more of the monthly bandwidth when watched

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Length of a local video file in seconds, or null if the browser can't tell.
const readDuration = (file) => new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (d) => { clearTimeout(t); URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : null); };
    const t = setTimeout(() => done(null), 8000);
    v.preload = "metadata";
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done(null);
    v.src = url;
});

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
    const [preparingPhotos, setPreparingPhotos]     = useState(0);
    // Each video: { key, url?, preview?, name?, status: "done" | "uploading" | "error", progress?, error?, long? }
    const [videos, setVideos] = useState(() =>
        (initialData?.videos || []).map(url => ({ key: url, url, status: "done" })));
    const draftIdRef = useRef(null);         // id reserved for a new bag, so its videos share its folder
    const uploadsRef = useRef(new Map());    // key -> AbortController of the running upload
    const removedRef = useRef(new Set());    // keys removed while still queued
    const previewsRef = useRef([]);

    useEffect(() => () => {
        uploadsRef.current.forEach(c => c.abort());
        previewsRef.current.forEach(u => URL.revokeObjectURL(u));
    }, []);

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
        // Photos of the bag (whole-bag shots and details), in the order given: main first,
        // the rest go to the gallery.
        const photoNums = (d.images || []).filter(i => i.kind === "product" || i.kind === "detail").map(i => i.number);
        if (photoNums.length) {
            const mainNum = d.mainImage || photoNums[0];
            const main = uploaded[mainNum - 1];
            const gallery = photoNums.filter(n => n !== mainNum).map(n => uploaded[n - 1]).slice(0, 10);
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

    // Photos are shrunk on this device before saving (see utils/imageCompress).
    const handleMainImageChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        setPreparingPhotos(n => n + 1);
        try {
            const src = await compressImage(file);
            setFormData(p => ({ ...p, mainImage: src }));
            setImagePreview(src);
            setErrors(p => { const n = { ...p }; delete n.mainImage; return n; });
        } catch {
            setErrors(p => ({ ...p, mainImage: "Could not read this photo, please try another" }));
        } finally {
            setPreparingPhotos(n => n - 1);
        }
    };

    const handleSideImageAdd = async (e) => {
        const files = Array.from(e.target.files);
        e.target.value = "";
        if (sideImagePreviews.length + files.length > 10) {
            setErrors(p => ({ ...p, sideImages: "Maximum 10 side images allowed" }));
            return;
        }
        setPreparingPhotos(n => n + 1);
        try {
            const srcs = (await Promise.all(files.map(f => compressImage(f).catch(() => null)))).filter(Boolean);
            setSideImagePreviews(p => [...p, ...srcs]);
            setFormData(p => ({ ...p, sideImages: [...p.sideImages, ...srcs] }));
            if (srcs.length < files.length) setErrors(p => ({ ...p, sideImages: "Some photos could not be read" }));
        } finally {
            setPreparingPhotos(n => n - 1);
        }
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

    // Saved before compression existed: ImageKit would have to convert it.
    const isOld = (v) => v.status === "done" && v.url && !isCompressedVideo(v.url);
    const patchVideo = (key, patch) => setVideos(p => p.map(v => v.key === key ? { ...v, ...patch } : v));

    // Compress on this device (nothing is saved on it), make the cover, then upload both.
    // Only compressed videos are uploaded: ImageKit would use its monthly processing units to
    // convert anything else, so a device that can't compress is asked to use another one.
    const uploadVideo = async (key, file) => {
        if (removedRef.current.has(key)) return;
        const controller = new AbortController();
        const { signal } = controller;
        uploadsRef.current.set(key, controller);
        try {
            let upload = null;
            let posterBlob = null;
            const notes = [];
            patchVideo(key, { stage: "compressing", progress: 0 });
            try {
                const out = await compressVideo(file, undefined, {
                    signal, onProgress: (progress) => patchVideo(key, { progress }),
                });
                if (out) {
                    upload = out.file;
                    posterBlob = out.poster;
                    if (!out.audio) notes.push("saved without sound (this browser can't keep it)");
                }
            } catch (err) {
                if (signal.aborted) throw err;
                console.warn("Video compression failed:", err);
            }
            if (!upload) throw new Error(NO_COMPRESS);
            if (upload.size > MAX_VIDEO_MB * 1024 * 1024) {
                throw new Error(`Still larger than ${MAX_VIDEO_MB} MB after compressing. Trim it, then try again`);
            }

            patchVideo(key, { stage: "uploading", progress: 0 });
            const poster = posterBlob || await capturePoster(upload);
            const auth = await getVideoUploadAuth(bagId || draftIdRef.current);
            if (!bagId) draftIdRef.current = auth.bagId;
            const url = await uploadVideoFile(upload, auth, {
                signal, fileName: upload.name, onProgress: (progress) => patchVideo(key, { progress }),
            });
            // The cover is named after the video, so the shop finds it without asking ImageKit.
            if (poster) {
                const posterAuth = await getVideoUploadAuth(auth.bagId);
                const posterName = posterFileOf(url).split("/").pop();
                await uploadVideoFile(new File([poster], posterName, { type: "image/jpeg" }), posterAuth, { signal, fileName: posterName, unique: false })
                    .catch(() => notes.push("its cover could not be saved"));
            }
            patchVideo(key, { status: "done", url, note: notes.join("; ") || null });
        } catch (err) {
            if (!signal.aborted) patchVideo(key, { status: "error", error: err?.message || "Upload failed" });
        } finally {
            uploadsRef.current.delete(key);
        }
    };

    const handleVideoAdd = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        const room = MAX_VIDEOS - videos.length;
        setErrors(p => { const n = { ...p }; delete n.videos; delete n.submit; return n; });
        if (files.length > room) setErrors(p => ({ ...p, videos: `Maximum ${MAX_VIDEOS} videos per bag` }));

        const queue = [];
        const added = files.slice(0, Math.max(0, room)).map((file, i) => {
            const key = `new-${Date.now()}-${i}`;
            const name = file.name || "video";
            if (!file.type.startsWith("video/")) return { key, name, status: "error", error: "This file is not a video" };
            if (!canCompress()) return { key, name, status: "error", error: NO_COMPRESS };
            if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
                return { key, name, status: "error", error: `Larger than ${MAX_SOURCE_MB / 1024} GB. Trim it, then try again` };
            }
            const preview = URL.createObjectURL(file);
            previewsRef.current.push(preview);
            queue.push([key, file]);
            readDuration(file).then(d => { if (d > LONG_VIDEO_S) patchVideo(key, { long: d }); });
            return { key, name, preview, status: "uploading", progress: null };
        });
        setVideos(p => [...p, ...added]);
        // One at a time: a slow connection does better, and a new bag reserves its id only once.
        for (const [key, file] of queue) await uploadVideo(key, file);
    };

    const handleRemoveVideo = (key) => {
        removedRef.current.add(key);
        uploadsRef.current.get(key)?.abort();
        setVideos(p => p.filter(v => v.key !== key));
    };

    const uploadingVideos = videos.filter(v => v.status === "uploading").length;

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
        if (uploadingVideos) {
            setErrors(p => ({ ...p, submit: "Please wait until the video finishes uploading" }));
            return;
        }
        if (!validateForm()) {
            // The Save button is at the bottom; bring the first missing field into view.
            setTimeout(() => document.querySelector(".bf-field-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
            return;
        }
        setLoading(true);
        try {
            const res = await onSubmit({
                ...formData,
                videos: videos.filter(v => v.status === "done").map(v => v.url),
                ...(!bagId && draftIdRef.current && { _id: draftIdRef.current }),
            });
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

                        <section className="sf-panel bf-panel" aria-labelledby="bf-videos-h">
                            <div className="bf-panel__head">
                                <h2 id="bf-videos-h" className="sf-h3">Videos</h2>
                                <span className="sf-faint sf-num bf-meta">{videos.length}/{MAX_VIDEOS}</span>
                            </div>
                            <p className="sf-muted bf-sub">
                                Optional. Short clips that show the bag from every side and inside, up to {LONG_VIDEO_S} seconds. Customers tap to play.
                                {" "}Videos are compressed on this device before upload.
                            </p>
                            <div className="bf-gallery">
                                {videos.map((v, i) => (
                                    <div key={v.key} className={`bf-thumb bf-vid${v.status === "error" ? " bf-vid--err" : ""}`}>
                                        <div className="sf-tile bf-vid__tile">
                                            <FilmSlate size={26} weight="light" className="bf-vid__icon" aria-hidden="true" />
                                            {v.preview ? (
                                                <video src={`${v.preview}#t=0.5`} muted playsInline preload="metadata" aria-hidden="true" />
                                            ) : videoPoster(v.url, 300) ? (
                                                <img src={videoPoster(v.url, 300)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                            ) : null}
                                            {v.status === "done" && (
                                                <a className="bf-vid__play" href={v.url} target="_blank" rel="noreferrer" aria-label={`Watch video ${i + 1}`}>
                                                    <Play size={16} weight="fill" />
                                                </a>
                                            )}
                                            {v.status === "uploading" && (
                                                <div className="bf-vid__progress" role="progressbar"
                                                    aria-label={`${v.stage === "compressing" ? "Compressing" : "Uploading"} video ${i + 1}`}
                                                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={v.progress || 0}>
                                                    <span className="sf-num">
                                                        {!v.stage ? "Waiting" : `${v.stage === "compressing" ? "Compressing" : "Uploading"} ${v.progress || 0}%`}
                                                    </span>
                                                    <i style={{ width: `${v.progress || 0}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" className="bf-thumb__remove"
                                            onClick={() => handleRemoveVideo(v.key)}
                                            aria-label={v.status === "uploading" ? `Cancel video ${i + 1}` : `Remove video ${i + 1}`}>
                                            <X size={14} weight="bold" />
                                        </button>
                                    </div>
                                ))}
                                {videos.length < MAX_VIDEOS && (
                                    <label className="bf-add bf-vid__add">
                                        <Plus size={22} />
                                        <span>Add video</span>
                                        <input type="file" accept="video/*" multiple
                                            onChange={handleVideoAdd} hidden />
                                    </label>
                                )}
                            </div>
                            {videos.some(v => v.status === "error" || v.long || v.note || isOld(v)) && (
                                <ul className="bf-vid__notes">
                                    {videos.filter(v => v.status === "error").map(v => (
                                        <li key={v.key} className="sf-error"><b dir="auto">{v.name}</b>: {v.error}</li>
                                    ))}
                                    {videos.filter(v => v.long && v.status !== "error").map(v => (
                                        <li key={v.key} className="bf-vid__warn">
                                            <b dir="auto">{v.name}</b> is {clock(v.long)} long. Videos over {LONG_VIDEO_S} seconds use more of the monthly bandwidth when customers watch them.
                                        </li>
                                    ))}
                                    {videos.filter(v => v.note && v.status === "done").map(v => (
                                        <li key={`${v.key}-note`} className="bf-vid__warn"><b dir="auto">{v.name}</b>: {v.note}.</li>
                                    ))}
                                    {videos.filter(isOld).map(v => (
                                        <li key={`${v.key}-old`} className="bf-vid__warn">
                                            Video {videos.indexOf(v) + 1} was uploaded before videos were compressed. Remove it and add it again, so it plays faster and costs nothing to show.
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {errors.videos && <p className="sf-error bf-err-gap">{errors.videos}</p>}
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
                                <button type="submit" className="sf-btn sf-btn--primary bf-save" disabled={loading || uploadingVideos > 0 || preparingPhotos > 0}>
                                    {(loading || uploadingVideos > 0 || preparingPhotos > 0) && <span className="bf-spinner" aria-hidden="true" />}
                                    {loading ? "Saving…" : uploadingVideos ? "Uploading video…" : preparingPhotos ? "Preparing photos…" : "Save bag"}
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

    .bf-vid__tile { aspect-ratio: 3 / 4; cursor: default; position: relative; display: grid; place-items: center; background: var(--sf-surface-2); }
    .bf-vid__tile video, .bf-vid__tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; padding: 0 !important; }
    .bf-vid__icon { color: var(--sf-text-3); }
    .bf-vid--err .bf-vid__tile { outline: 1.5px solid var(--sf-danger); outline-offset: -1.5px; }
    .bf-vid__play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; border-radius: 999px; display: grid; place-items: center; background: rgba(17,17,17,.78); color: var(--sf-gold); border: 1px solid rgba(217,178,111,.45); transition: transform .2s, background-color .2s; }
    .bf-vid__play:hover { background: #111; transform: translate(-50%, -50%) scale(1.06); }
    .bf-vid__progress { position: absolute; inset: auto 0 0 0; padding: 8px 8px 0; background: linear-gradient(transparent, rgba(17,17,17,.85)); display: grid; gap: 6px; }
    .bf-vid__progress span { font-size: 12px; font-weight: 600; color: #fff; }
    .bf-vid__progress i { display: block; height: 3px; background: var(--sf-gold); border-radius: 3px; transition: width .2s; margin-bottom: 8px; }
    .bf-vid__add { aspect-ratio: 3 / 4; }
    .bf-vid__notes { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; font-size: 13px; }
    .bf-vid__notes b { font-weight: 600; word-break: break-all; }
    .bf-vid__warn { color: var(--sf-text-2); }

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
