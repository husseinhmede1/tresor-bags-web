// Makes a cleaned photo sharper when its bag came from a small picture. A photo cut out of a
// phone screenshot holds a bag only a few hundred pixels tall; the cleaner then enlarges it
// several times to fill its square, and that is what makes it look soft on the product page.
//
// This runs after the cleaner and never changes what was cut out: the cleaned photo's bag is
// brought back to the size it had in the supplier's picture, enlarged 4x by Real-ESRGAN
// "general x4v3" (BSD-3-Clause, Xintao Wang) and laid over the cleaned photo. The model's
// picture is mixed with the cleaned one, which keeps it from redrawing fine fabric as bold
// stripes. The white around the bag is left exactly as the cleaner made it.
//
// The model is open and small (5 MB): it ships with the site, is kept in the browser's cache
// and runs in the browser through onnxruntime-web like the cleaner, on the graphics card when
// there is one, else on the processor. Customers never load any of this.

const MODEL_URL = "/models/photo-sharpen-x4.onnx";
const CACHE = "tresor-photo-sharpen-v1";
const SCALE = 4;             // what the model does
const MIN_ENLARGED = 2;      // a bag enlarged less than this by the cleaner is sharp enough
const SHARE = 0.6;           // how much of the result is the model's picture; the rest is the cleaned one
const WHITE = 250;           // the cleaner's background (and anything this light) is never touched
const AROUND = 8;            // model pixels of background kept around the bag
const PAD = 16;              // each piece sees this much of its neighbours, so no seam shows
const PIECE = 368;           // longest side of a piece handed to the model (memory stays low)
const MAX_INPUT = 320000;    // pixels handed to the model: past this the bag is big enough as it is

const fetchModel = async () => {
    const cache = typeof caches !== "undefined" ? await caches.open(CACHE).catch(() => null) : null;
    const hit = await cache?.match(MODEL_URL);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`Sharpener download failed (${res.status})`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // A host that answers every unknown address with the site's own page must not get cached as the model.
    if (bytes.length < 1000000) throw new Error("Sharpener download was not the model");
    await cache?.put(MODEL_URL, new Response(bytes.slice(), { headers: { "content-type": "application/octet-stream" } })).catch(() => {});
    return bytes;
};

let worker = null;
let nextId = 0;
let ready = null;
const pending = new Map();
const ask = (message, transfer = []) => new Promise((resolve, reject) => {
    if (!worker) {
        worker = new Worker(new URL("./sharpenWorker.js", import.meta.url), { type: "module" });
        worker.onmessage = ({ data }) => {
            const p = pending.get(data.id);
            pending.delete(data.id);
            if (data.ok) p?.resolve(data); else p?.reject(new Error(data.error));
        };
        worker.onerror = (e) => {
            const err = new Error(e.message || "The photo sharpener stopped");
            pending.forEach((p) => p.reject(err));
            pending.clear();
            worker.terminate();
            worker = null;
            ready = null;
        };
    }
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ ...message, id }, transfer);
});
const prepare = () => {
    ready ??= fetchModel().then((bytes) => ask({ type: "init", bytes }, [bytes.buffer])).catch((err) => { ready = null; throw err; });
    return ready;
};

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the photo"));
    img.src = src;
});
const canvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });

// Part of a picture made smaller, by halves and then the rest: one big step would skip pixels.
const shrink = (source, sx, sy, sw, sh, w, h) => {
    let cur = canvas(sw, sh);
    cur.getContext("2d").drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    while (cur.width >= w * 2 && cur.height >= h * 2) {
        const half = canvas(Math.ceil(cur.width / 2), Math.ceil(cur.height / 2));
        const hctx = half.getContext("2d");
        hctx.imageSmoothingQuality = "high";
        hctx.drawImage(cur, 0, 0, half.width, half.height);
        cur = half;
    }
    const out = canvas(w, h);
    const octx = out.getContext("2d", { willReadFrequently: true });
    octx.imageSmoothingQuality = "high";
    octx.drawImage(cur, 0, 0, w, h);
    return octx.getImageData(0, 0, w, h).data;
};

// A tw×th piece of the small picture starting at (x0, y0), as the model's input (0..1, planes).
// Past the picture's edge the nearest pixel is repeated.
const pieceInput = (px, w, h, x0, y0, tw, th) => {
    const plane = tw * th;
    const input = new Float32Array(3 * plane);
    for (let y = 0; y < th; y++) {
        const sy = Math.min(h - 1, Math.max(0, y0 + y));
        for (let x = 0; x < tw; x++) {
            const at = (sy * w + Math.min(w - 1, Math.max(0, x0 + x))) * 4, i = y * tw + x;
            input[i] = px[at] / 255;
            input[plane + i] = px[at + 1] / 255;
            input[2 * plane + i] = px[at + 2] / 255;
        }
    }
    return input;
};

/**
 * A sharper copy of a cleaned photo (a JPEG data URL), given how many times the cleaner enlarged
 * its bag. Resolves to the same photo when there is nothing to gain. Rejects if the sharpener
 * can't run on this device: the caller then keeps the cleaned photo.
 */
export const sharpenCleaned = async (cleaned, enlarged) => {
    if (!(enlarged >= MIN_ENLARGED)) return cleaned;
    const img = await loadImage(cleaned);
    const W = img.naturalWidth, H = img.naturalHeight;
    const page = canvas(W, H);
    const pctx = page.getContext("2d", { willReadFrequently: true });
    pctx.drawImage(img, 0, 0);
    const before = pctx.getImageData(0, 0, W, H);

    // Where the bag (and its shadow) is: everything that is not the white background.
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const at = (y * W + x) * 4;
            if (Math.min(before.data[at], before.data[at + 1], before.data[at + 2]) < WHITE) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }
        }
    }
    if (x1 < 0) return cleaned;

    // Back to the size the bag had before the cleaner enlarged it (never smaller than that:
    // nothing real is thrown away), with a little background around it.
    const down = Math.min(SCALE, enlarged);
    const around = Math.ceil(AROUND * down);
    x0 = Math.max(0, x0 - around); y0 = Math.max(0, y0 - around);
    x1 = Math.min(W - 1, x1 + around); y1 = Math.min(H - 1, y1 + around);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const sw = Math.max(8, Math.round(bw / down)), sh = Math.max(8, Math.round(bh / down));
    if (sw * sh > MAX_INPUT) return cleaned;

    await prepare();
    const small = shrink(page, x0, y0, bw, bh, sw, sh);
    const cols = Math.ceil(sw / PIECE), rows = Math.ceil(sh / PIECE);
    const cw = Math.ceil(sw / cols), ch = Math.ceil(sh / rows);       // the part of each piece that is kept
    const tw = cw + 2 * PAD, th = ch + 2 * PAD, plane = tw * SCALE * th * SCALE;
    const big = canvas(sw * SCALE, sh * SCALE);
    const bctx = big.getContext("2d");
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const { output } = await ask({ type: "run", input: pieceInput(small, sw, sh, c * cw - PAD, r * ch - PAD, tw, th), width: tw, height: th });
            const kw = Math.min(cw, sw - c * cw) * SCALE, kh = Math.min(ch, sh - r * ch) * SCALE;
            const piece = bctx.createImageData(kw, kh);
            for (let y = 0; y < kh; y++) {
                for (let x = 0; x < kw; x++) {
                    const i = (y + PAD * SCALE) * tw * SCALE + (x + PAD * SCALE), at = (y * kw + x) * 4;
                    piece.data[at] = output[i] * 255;                // kept within 0..255 by the array
                    piece.data[at + 1] = output[plane + i] * 255;
                    piece.data[at + 2] = output[2 * plane + i] * 255;
                    piece.data[at + 3] = 255;
                }
            }
            bctx.putImageData(piece, c * cw * SCALE, r * ch * SCALE);
        }
    }

    // The model's picture, at the cleaned photo's size, mixed in everywhere but on the white.
    const sharp = canvas(bw, bh);
    const sctx = sharp.getContext("2d", { willReadFrequently: true });
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(big, 0, 0, bw, bh);
    const ai = sctx.getImageData(0, 0, bw, bh).data;
    const part = pctx.getImageData(x0, y0, bw, bh);
    for (let at = 0; at < ai.length; at += 4) {
        if (Math.min(part.data[at], part.data[at + 1], part.data[at + 2]) >= WHITE) continue;
        part.data[at] += (ai[at] - part.data[at]) * SHARE;
        part.data[at + 1] += (ai[at + 1] - part.data[at + 1]) * SHARE;
        part.data[at + 2] += (ai[at + 2] - part.data[at + 2]) * SHARE;
    }
    pctx.putImageData(part, x0, y0);
    return page.toDataURL("image/jpeg", 0.9);
};
