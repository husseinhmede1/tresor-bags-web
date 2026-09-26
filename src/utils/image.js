// Images on ImageKit can be resized on the fly: ask for roughly the size shown
// (x2 for sharp phone screens) instead of downloading the full photo.
// Anything else (old base64, other hosts) is returned unchanged.
export const sized = (src, width) =>
    typeof src === "string" && src.startsWith("https://ik.imagekit.io/")
        ? `${src}${src.includes("?") ? "&" : "?"}tr=w-${width}`
        : src;
