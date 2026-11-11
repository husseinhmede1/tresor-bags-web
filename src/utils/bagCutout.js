// Professional product photo, made on the admin's device: the bag is cut out of the supplier's
// photo (wall, floor, the supplier's red text and logos all go), then placed in the middle of a
// white square with a soft shadow under it. The shop's photo tiles blend white into their own
// light grey (mix-blend-mode: multiply), so on the site the bag sits on exactly the tile grey.
//
// The bag itself is never redrawn: its pixels are copied as they are. The cut-out comes from
// ISNet "general use" (DIS, Apache-2.0), an open model run in the browser by onnxruntime-web
// (served to the logged-in admin by our server, see the backend's routes/modelRoutes.js):
// on the graphics card (WebGPU) when there is one, else on the processor (a few seconds a photo).
// The model (~180 MB) is downloaded the first time and kept in the browser's cache.
// Customers never load any of this.

import { TOKEN_KEY } from "../services/serverErrors";

const MODEL_URL = import.meta.env.VITE_CLEANER_MODEL_URL
    || `${(import.meta.env.VITE_APP_API_URL || "http://localhost:5000").replace(/\/$/, "")}/models/isnet-general-use.onnx`;
const CACHE = "tresor-photo-cleaner-v2";
const SIZE = 1024;                          // the model works on 1024×1024
const MEAN = [0.5, 0.5, 0.5];               // ISNet input: pixel/255 - 0.5
const STD = [1, 1, 1];

export const canClean = () => typeof window !== "undefined" && typeof WebAssembly === "object";
export const NO_CLEANER = "This browser can't run the photo cleaner. Use Chrome on a laptop, or Safari on an iPhone.";

const BACKGROUND = "#FFFFFF";               // turns into the tile grey on the site (see above)
const OUT = 1600;                           // output square, sharp enough for the product page
const MARGIN = 0.08;                        // space around the bag, on each side

/* ── Model ─────────────────────────────────────────────────────────────── */

// Download with progress, once; later visits read it from the browser's cache.
const fetchModel = async (url, onProgress) => {
    const cache = typeof caches !== "undefined" ? await caches.open(CACHE).catch(() => null) : null;
    const hit = await cache?.match(url);
    if (hit) return new Uint8Array(await hit.arrayBuffer());

    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status})`);
    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)));
    }
    const bytes = new Uint8Array(loaded);
    let at = 0;
    for (const c of chunks) { bytes.set(c, at); at += c.length; }
    await cache?.put(url, new Response(bytes, { headers: { "content-type": "application/octet-stream" } })).catch(() => {});
    onProgress?.(100);
    return bytes;
};

let ready = null;   // Promise<{ ort, session, ep }>, shared by every photo

const createSession = async (ort, bytes, ep) => ort.InferenceSession.create(bytes, { executionProviders: [ep] });

const loadSession = async (onProgress, { skipGpu = false } = {}) => {
    const ort = await import("onnxruntime-web");
    ort.env.logLevel = "error";
    const bytes = await fetchModel(MODEL_URL, onProgress);
    const gpu = !skipGpu && typeof navigator !== "undefined" && navigator.gpu
        && await navigator.gpu.requestAdapter().catch(() => null);
    if (gpu) {
        try {
            return { ort, session: await createSession(ort, bytes, "webgpu"), ep: "webgpu" };
        } catch (err) {
            console.warn("Photo cleaner: graphics card not usable, using the processor", err);
        }
    }
    return { ort, session: await createSession(ort, bytes, "wasm"), ep: "wasm" };
};

export const prepareCleaner = (onProgress, opts) => {
    ready ??= loadSession(onProgress, opts).catch((err) => { ready = null; throw err; });
    return ready;
};

/* ── Mask ──────────────────────────────────────────────────────────────── */

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo could not be read"));
    img.src = src;
});

const canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
};

// 0-255 "how much of this pixel is the bag", at the photo's own size.
const predictMask = async ({ ort, session }, img) => {
    const small = canvas(SIZE, SIZE).getContext("2d", { willReadFrequently: true });
    small.drawImage(img, 0, 0, SIZE, SIZE);
    const px = small.getImageData(0, 0, SIZE, SIZE).data;
    const plane = SIZE * SIZE;
    const input = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
        for (let c = 0; c < 3; c++) input[c * plane + i] = (px[i * 4 + c] / 255 - MEAN[c]) / STD[c];
    }
    const name = session.inputNames[0];
    const out = await session.run({ [name]: new ort.Tensor("float32", input, [1, 3, SIZE, SIZE]) });
    const prob = out[session.outputNames[0]].data;   // the first output is the finest mask

    // Stretch to the full 0-255 range.
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < plane; i++) {
        if (prob[i] < lo) lo = prob[i];
        if (prob[i] > hi) hi = prob[i];
    }
    if (!(hi > lo)) throw new Error("The cleaner found no bag");
    const maskSmall = canvas(SIZE, SIZE);
    const mctx = maskSmall.getContext("2d");
    const md = mctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < plane; i++) {
        const v = Math.round(((prob[i] - lo) / (hi - lo)) * 255);
        md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = v;
        md.data[i * 4 + 3] = 255;
    }
    mctx.putImageData(md, 0, 0);

    // Smooth resize back to the photo's size.
    const w = img.naturalWidth, h = img.naturalHeight;
    const big = canvas(w, h).getContext("2d", { willReadFrequently: true });
    big.imageSmoothingQuality = "high";
    big.drawImage(maskSmall, 0, 0, w, h);
    const bd = big.getImageData(0, 0, w, h).data;
    const alpha = new Uint8ClampedArray(w * h);
    for (let i = 0; i < alpha.length; i++) alpha[i] = bd[i * 4];
    return alpha;
};

// Keep the bag and drop the rest: specks and leftovers (a bit of the supplier's text, a mark on
// the floor) much smaller than the bag, and faint ghost pixels.
const tidyMask = (alpha, w, h) => {
    const label = new Int32Array(w * h);
    const sizes = [0];
    const stack = [];
    for (let start = 0; start < w * h; start++) {
        if (label[start] || alpha[start] <= 128) continue;
        const id = sizes.length;
        let size = 0;
        label[start] = id;
        stack.push(start);
        while (stack.length) {
            const i = stack.pop();
            size++;
            const x = i % w;
            const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1];
            for (const j of next) if (j >= 0 && !label[j] && alpha[j] > 128) { label[j] = id; stack.push(j); }
        }
        sizes.push(size);
    }
    const biggest = Math.max(...sizes);
    for (let i = 0; i < alpha.length; i++) {
        if ((label[i] && sizes[label[i]] < biggest * 0.02) || alpha[i] < 40) alpha[i] = 0;
    }
};

// Parts of the bag that look like the background (a grey wheel cap, a light lining seen through
// a gap) can come out as holes. A small hole whose colour is not the background's colour at that
// height is part of the bag: its own pixels are kept. Bigger openings (inside a handle loop, where
// scenery may show through) always stay see-through.
const fillBagHoles = (alpha, rgba, w, h) => {
    const solid = (i) => alpha[i] > 128;
    const seen = new Uint8Array(w * h);           // 1 = background reachable from the edge
    const stack = [];
    const push = (i) => { if (!seen[i] && !solid(i)) { seen[i] = 1; stack.push(i); } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    const flood = (out) => {
        while (stack.length) {
            const i = stack.pop();
            out?.push(i);
            const x = i % w;
            if (x > 0) out ? pushHole(i - 1) : push(i - 1);
            if (x < w - 1) out ? pushHole(i + 1) : push(i + 1);
            if (i >= w) out ? pushHole(i - w) : push(i - w);
            if (i < w * (h - 1)) out ? pushHole(i + w) : push(i + w);
        }
    };
    const pushHole = (i) => { if (!seen[i] && !solid(i)) { seen[i] = 2; stack.push(i); } };
    flood(null);

    const bagArea = alpha.reduce((n, a) => n + (a > 128 ? 1 : 0), 0);
    for (let start = 0; start < w * h; start++) {
        if (seen[start] || solid(start)) continue;
        const hole = [];
        seen[start] = 2;
        stack.push(start);
        flood(hole);
        if (hole.length < bagArea * 0.0005 || hole.length > bagArea * 0.0035) continue;  // specks; handle loops
        let y0 = h, y1 = 0, hr = 0, hg = 0, hb = 0;
        for (const i of hole) {
            const y = (i / w) | 0;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            hr += rgba[i * 4]; hg += rgba[i * 4 + 1]; hb += rgba[i * 4 + 2];
        }
        let br = 0, bg = 0, bb = 0, n = 0;
        for (let y = Math.max(0, y0 - 20); y < Math.min(h, y1 + 20); y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (alpha[i] < 10) { br += rgba[i * 4]; bg += rgba[i * 4 + 1]; bb += rgba[i * 4 + 2]; n++; }
            }
        }
        if (!n) continue;
        const k = hole.length;
        const dist = Math.hypot(hr / k - br / n, hg / k - bg / n, hb / k - bb / n);
        if (dist > 30) for (const i of hole) alpha[i] = 255;
    }
};

/* ── Composition ───────────────────────────────────────────────────────── */

const compose = (img, alpha) => {
    const w = img.naturalWidth, h = img.naturalHeight;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (alpha[y * w + x] > 128) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }
        }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    // Nothing found, or the "bag" is the whole photo: not a photo this can improve.
    if (x1 < 0 || bw * bh < w * h * 0.03 || (bw > w * 0.98 && bh > h * 0.98)) return null;

    // The bag on a transparent layer: its own pixels, only the alpha changes.
    const cut = canvas(w, h);
    const cctx = cut.getContext("2d", { willReadFrequently: true });
    cctx.drawImage(img, 0, 0);
    const data = cctx.getImageData(0, 0, w, h);
    for (let i = 0; i < alpha.length; i++) data.data[i * 4 + 3] = alpha[i];
    cctx.putImageData(data, 0, 0);

    const out = canvas(OUT, OUT);
    const ctx = out.getContext("2d");
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, OUT, OUT);
    const scale = (OUT * (1 - 2 * MARGIN)) / Math.max(bw, bh);
    const dw = bw * scale, dh = bh * scale;
    const dx = (OUT - dw) / 2, dy = (OUT - dh) / 2;

    // Soft contact shadow under the bag (a gradient, so it looks the same in every browser).
    const cy = dy + dh;
    const rx = dw * 0.46, ry = OUT * 0.022;
    ctx.save();
    ctx.translate(OUT / 2, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(60,60,64,0.30)");
    g.addColorStop(0.6, "rgba(60,60,64,0.12)");
    g.addColorStop(1, "rgba(60,60,64,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cut, x0, y0, bw, bh, dx, dy, dw, dh);
    return out.toDataURL("image/jpeg", 0.9);
};

/**
 * Clean one product photo. Returns a JPEG data URL, or null when the photo isn't one this can
 * improve (no clear bag in it). Throws if the cleaner can't run on this device.
 */
export const cleanPhoto = async (src, { onModelProgress } = {}) => {
    let model = await prepareCleaner(onModelProgress);
    const img = await loadImage(src);
    let alpha;
    try {
        alpha = await predictMask(model, img);
    } catch (err) {
        // Some graphics cards open the model but can't run it: use the processor instead.
        if (model.ep !== "webgpu") throw err;
        console.warn("Photo cleaner: graphics card failed, using the processor", err);
        await model.session.release?.().catch(() => {});
        ready = null;
        model = await prepareCleaner(onModelProgress, { skipGpu: true });
        alpha = await predictMask(model, img);
    }
    const w = img.naturalWidth, h = img.naturalHeight;
    const ctx = canvas(w, h).getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    tidyMask(alpha, w, h);
    fillBagHoles(alpha, ctx.getImageData(0, 0, w, h).data, w, h);
    return compose(img, alpha);
};
