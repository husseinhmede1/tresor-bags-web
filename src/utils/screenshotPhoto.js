// The shop owner often screenshots the supplier's photos in WeChat instead of saving them. Such a
// screenshot is one photo across the screen, on black, with the phone's status bar, a date line
// and a caption around it. This finds the photo by its pixels and returns it cut out of the
// screenshot, so the admin never crops by hand.
//
// How: a row (or column) belongs to the photo when most of it is not black. Status bars, date
// lines and captions are thin strokes of text on black, so they never fill a row; the photo
// does. The photo is everything between the first and the last solid stretch of filled rows.
//
// The AI decides which uploads to try this on, and it can be wrong. So a cut is made only when
// the pixels themselves show a viewer: the photo runs from one side of the screen to the other,
// and what is around it is black. A bag photographed on a black background, a chat, a web page:
// none of these pass, and they are left alone.

const DARK = 48;          // a pixel this dark (0-255) counts as the viewer's black background
const FILLED = 0.6;       // a row is "filled" when this share of its pixels is not black
const SOLID = 0.02;       // a stretch of filled rows this long (share of the side) is photo, not text
const MIN_SIDE = 0.2;     // a photo smaller than this share of the screenshot is not trusted
const MAX_AREA = 0.92;    // nearly the whole screenshot "filled" means no black frame was found
const MAX_SHAPE = 1.9;    // a photo is at most this much longer than wide (or wider than long); a strip is not one
const FULL_WIDTH = 0.96;  // the photo covers at least this share of the screen's width
const EDGE_LIT = 0.15;    // the rows right above and below the photo are black (at most this share lit)
const FRAME_LIT = 0.25;   // and so is everything around the photo, bar some thin text
const PHONE_SHAPE = 1.9;  // height / width of a phone's screen; photos are squarer (16:9 is 1.78)
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

/**
 * Looks for a photo shown in a phone's photo viewer.
 *   photo        the photo cut out: { src (JPEG data URL), width, height }, or null if this is not
 *                clearly a viewer screenshot
 *   phoneScreen  the upload has the shape of a phone's screen (so, with no photo found, it is a
 *                screenshot of something else and not a photo of the bag)
 */
export const cropViewerPhoto = async (src) => {
    const img = await load(src);
    const W = img.naturalWidth, H = img.naturalHeight;
    const none = { photo: null, phoneScreen: H / W >= PHONE_SHAPE };
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, W, H).data;
    const lit = (x, y) => { const i = (y * W + x) * 4; return Math.max(px[i], px[i + 1], px[i + 2]) > DARK; };

    const STEP = 3;   // every third pixel is plenty to judge a line
    const rowLit = (y) => { let n = 0, t = 0; for (let x = 0; x < W; x += STEP) { t++; if (lit(x, y)) n++; } return n / t; };
    const rows = span(H, (y) => rowLit(y) >= FILLED);
    if (!rows) return none;
    const [top, bottom] = rows;
    const cols = span(W, (x) => { let n = 0, t = 0; for (let y = top; y <= bottom; y += STEP) { t++; if (lit(x, y)) n++; } return n / t >= FILLED; });
    if (!cols) return none;
    const [left, right] = cols;

    // One pixel in on each side, so no sliver of the black frame is left on an edge.
    const x = left + 1, y = top + 1, w = right - left - 1, h = bottom - top - 1;
    if (w < W * MIN_SIDE || h < H * MIN_SIDE || (w * h) / (W * H) > MAX_AREA) return none;
    if (w / h > MAX_SHAPE || h / w > MAX_SHAPE) return none;

    // Is this really a viewer? The photo spans the screen, and around it is black: right at its
    // top and bottom edges, and over the whole frame. (`gap` skips the blur where the two meet.)
    if (right - left + 1 < W * FULL_WIDTH) return none;
    const gap = Math.max(3, Math.round(H * 0.004)), band = Math.max(6, Math.round(H * 0.012));
    const litOver = (from, to) => { let s = 0, n = 0; for (let r = Math.max(0, from); r <= Math.min(H - 1, to); r++) { s += rowLit(r); n++; } return { s, n }; };
    const above = litOver(0, top - gap), below = litOver(bottom + gap, H - 1);
    if (above.n + below.n === 0 || (above.s + below.s) / (above.n + below.n) > FRAME_LIT) return none;
    for (const edge of [litOver(top - gap - band, top - gap), litOver(bottom + gap, bottom + gap + band)]) {
        if (edge.n && edge.s / edge.n > EDGE_LIT) return none;
    }

    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    out.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
    return { photo: { src: out.toDataURL("image/jpeg", 0.92), width: w, height: h }, phoneScreen: none.phoneScreen };
};
