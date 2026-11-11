// Images on ImageKit can be resized on the fly: ask for roughly the size shown
// (x2 for sharp phone screens) instead of downloading the full photo.
// Anything else (old base64, other hosts) is returned unchanged.
export const sized = (src, width) =>
    typeof src === "string" && src.startsWith("https://ik.imagekit.io/")
        ? `${src}${src.includes("?") ? "&" : "?"}tr=w-${width}`
        : src;

// Product videos on ImageKit: served as one MP4 that fits in 1280×1280 (720p for phone
// videos), so every browser can play it and ImageKit converts each video only once.
const isIk = (src) => typeof src === "string" && src.startsWith("https://ik.imagekit.io/");
export const videoSrc = (src) => isIk(src) ? `${src}?tr=w-1280,h-1280,c-at_max,f-mp4` : src;
// A frame from the first second, as the cover shown before the customer presses play.
export const videoPoster = (src, width = 800) => isIk(src) ? `${src}/ik-thumbnail.jpg?tr=so-1,w-${width}` : undefined;
