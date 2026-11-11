// Shrinks a product photo on the admin's device before it is saved: at most 2000 px on the
// long side (the site never shows them bigger), JPEG at high quality. A phone photo goes from
// about 3 MB to about 0.4 MB. Photos with transparency stay transparent (WebP, or PNG).
// Small photos (e.g. from WhatsApp) and anything that can't be read are kept as they are.

const MAX_EDGE = 2000;
const QUALITY = 0.85;
const KEEP_BELOW = 400 * 1024;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
});

// An <img> applies the photo's EXIF rotation, so phone photos stay upright.
const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const hasTransparency = (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
};

export const compressImage = async (file) => {
    const original = await readAsDataUrl(file);
    if (file.size <= KEEP_BELOW || file.type === "image/gif" || file.type === "image/svg+xml") return original;
    const url = URL.createObjectURL(file);
    try {
        const img = await loadImage(url);
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        let out;
        if (/png|webp/.test(file.type) && hasTransparency(ctx, w, h)) {
            out = canvas.toDataURL("image/webp", QUALITY);
            if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/png");
        } else {
            out = canvas.toDataURL("image/jpeg", QUALITY);
        }
        return out.length < original.length ? out : original;
    } catch {
        return original;
    } finally {
        URL.revokeObjectURL(url);
    }
};
