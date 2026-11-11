// Images on ImageKit can be resized on the fly: ask for roughly the size shown
// (x2 for sharp phone screens) instead of downloading the full photo.
// Anything else (old base64, other hosts) is returned unchanged.
export const sized = (src, width) =>
    typeof src === "string" && src.startsWith("https://ik.imagekit.io/")
        ? `${src}${src.includes("?") ? "&" : "?"}tr=w-${width}`
        : src;

// Product videos on ImageKit.
// - "opt_" videos were compressed in the admin's browser: served as they are, at no ImageKit
//   processing cost, with a cover "<same name>.jpg" made on the device.
// - "raw_" videos could not be compressed: ImageKit converts them once to an MP4 that fits
//   1280×1280; their cover was still made on the device.
// - Older videos (no prefix) also get ImageKit's own cover, in one size only, because
//   ImageKit charges processing units for every cover size it makes.
const isIk = (src) => typeof src === "string" && src.startsWith("https://ik.imagekit.io/");
const fileOf = (src) => src.split("?")[0].split("/").pop();
const isOptimized = (src) => isIk(src) && fileOf(src).startsWith("opt_");
const hasOwnPoster = (src) => isIk(src) && /^(opt|raw)_/.test(fileOf(src));
export const posterFileOf = (src) => src.split("?")[0].replace(/\.[^./]+$/, ".jpg");

export const videoSrc = (src) => !isIk(src) || isOptimized(src) ? src : `${src}?tr=w-1280,h-1280,c-at_max,f-mp4`;
export const videoPoster = (src, width = 800) =>
    !isIk(src) ? undefined
        : hasOwnPoster(src) ? sized(posterFileOf(src), width)
        : `${src}/ik-thumbnail.jpg?tr=so-1,w-800`;
