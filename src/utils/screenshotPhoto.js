// The shop owner often screenshots the supplier's photos in WeChat instead of saving them. Such a
// screenshot is one photo across the screen, on black, with the phone's status bar, a date line
// and a caption around it. This finds the photo by its pixels and returns it cut out of the
// screenshot, so the admin never crops by hand.
//
// How: a row (or column) belongs to the photo when most of it is not black. Status bars, date
// lines and captions are thin strokes of text on black, so they never fill a row; the photo
// does. The photo is everything between the first and the last solid stretch of filled rows.

const DARK = 48;          // a pixel this dark (0-255) counts as the viewer's black background
const FILLED = 0.6;       // a row is "filled" when this share of its pixels is not black
const SOLID = 0.02;       // a stretch of filled rows this long (share of the side) is photo, not text
const MIN_SIDE = 0.2;     // a photo smaller than this share of the screenshot is not trusted
const MAX_AREA = 0.92;    // nearly the whole screenshot "filled" means no black frame was found
export const SOFT_BELOW = 800;   // a cut-out narrower than this (px) looks soft on the product page

const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

// First and last index of the photo along one side, or null. `filled(i)` says if line i is filled.
const span = (length, filled) => {
    const need = Math.max(3, Math.round(length * SOLID));
    let first = -1, last = -1, run = 0;
    for (let i = 0; i < length; i++) {
        run = filled(i) ? run + 1 : 0;
        if (run === need) {
            if (first < 0) first = i - need + 1;
        }
        if (run >= need) last = i;
    }
    return first < 0 ? null : [first, last];
};

/** The photo inside a viewer screenshot: { src (JPEG data URL), width, height }, or null if none is clear. */
export const cropViewerPhoto = async (src) => {
    const img = await load(src);
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, W, H).data;
    const lit = (x, y) => { const i = (y * W + x) * 4; return Math.max(px[i], px[i + 1], px[i + 2]) > DARK; };

    const STEP = 3;   // every third pixel is plenty to judge a line
    const rows = span(H, (y) => { let n = 0, t = 0; for (let x = 0; x < W; x += STEP) { t++; if (lit(x, y)) n++; } return n / t >= FILLED; });
    if (!rows) return null;
    const [top, bottom] = rows;
    const cols = span(W, (x) => { let n = 0, t = 0; for (let y = top; y <= bottom; y += STEP) { t++; if (lit(x, y)) n++; } return n / t >= FILLED; });
    if (!cols) return null;
    const [left, right] = cols;

    // One pixel in on each side, so no sliver of the black frame is left on an edge.
    const x = left + 1, y = top + 1, w = right - left - 1, h = bottom - top - 1;
    if (w < W * MIN_SIDE || h < H * MIN_SIDE || (w * h) / (W * H) > MAX_AREA) return null;

    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    out.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
    return { src: out.toDataURL("image/jpeg", 0.92), width: w, height: h };
};
