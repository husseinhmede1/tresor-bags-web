// Images on ImageKit can be resized on the fly: ask for roughly the size shown
// (x2 for sharp phone screens) instead of downloading the full photo.
// Anything else (old base64, other hosts) is returned unchanged.
export const sized = (src, width) =>
    typeof src === "string" && src.startsWith("https://ik.imagekit.io/")
        ? `${src}${src.includes("?") ? "&" : "?"}tr=w-${width}`
        : src;

// Product videos on ImageKit are always served as they were uploaded: ImageKit never processes
// them, because every video it converts (or makes a cover from) uses its monthly processing units.
// - "opt_" videos were compressed in the admin's browser, with a cover "<same name>.jpg" made on
//   the device. "raw_" videos (older uploads that could not be compressed) have one too.
// - Older videos (no prefix) have no cover: they show a film icon until they're uploaded again.
const isIk = (src) => typeof src === "string" && src.startsWith("https://ik.imagekit.io/");
const fileOf = (src) => src.split("?")[0].split("/").pop();
const hasOwnPoster = (src) => isIk(src) && /^(opt|raw)_/.test(fileOf(src));
export const posterFileOf = (src) => src.split("?")[0].replace(/\.[^./]+$/, ".jpg");
// Compressed in the browser; anything else should be removed and added again.
export const isCompressedVideo = (src) => isIk(src) && fileOf(src).startsWith("opt_");

export const videoPoster = (src, width = 800) => hasOwnPoster(src) ? sized(posterFileOf(src), width) : undefined;
