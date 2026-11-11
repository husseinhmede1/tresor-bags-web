// Compresses a product video in the admin's browser before it is uploaded, so ImageKit only
// stores and serves a small MP4 and never spends its monthly video processing units on it.
// Nothing is saved on the device: the result lives in memory until it is uploaded.
// Returns null when this browser can't compress; the caller then uploads the original file.

export const VIDEO_PRESETS = {
    saver:    { label: "Saver",    long: 1280, videoBps: 1_100_000, audioBps: 96_000,  note: "Smallest files, softer fine detail" },
    balanced: { label: "Balanced", long: 1280, videoBps: 1_700_000, audioBps: 128_000, note: "Sharp on phones, like Instagram" },
    high:     { label: "High",     long: 1920, videoBps: 3_500_000, audioBps: 128_000, note: "1080p, about twice the size" },
};
export const DEFAULT_PRESET = "balanced";

export const canCompress = () =>
    typeof window !== "undefined" && window.isSecureContext && typeof window.VideoEncoder === "function";

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

// Size that fits the preset's long side, never upscaled.
const fitSize = (w, h, long) => {
    const scale = Math.min(1, long / Math.max(w, h));
    return { width: even(w * scale), height: even(h * scale) };
};

/**
 * @returns {Promise<null | { file: File, width: number, height: number, duration: number, hdr: boolean, audio: boolean }>}
 */
export const compressVideo = async (file, presetKey = DEFAULT_PRESET, { onProgress, signal } = {}) => {
    if (!canCompress()) return null;
    const preset = VIDEO_PRESETS[presetKey] || VIDEO_PRESETS[DEFAULT_PRESET];
    const mb = await import("mediabunny");  // loaded only when an admin adds a video

    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    try {
        const track = await input.getPrimaryVideoTrack();
        if (!track || !(await track.canDecode())) return null;
        const [w, h] = [await track.getDisplayWidth(), await track.getDisplayHeight()];
        const { width, height } = fitSize(w, h, preset.long);
        const videoQuality = new mb.Quality({ bitrate: preset.videoBps, bitrateMode: "variable" });
        if (!(await mb.canEncodeVideo("avc", { width, height, quality: videoQuality }))) return null;
        const canAac = await mb.canEncodeAudio("aac", { quality: new mb.Quality({ bitrate: preset.audioBps }) });

        const output = new mb.Output({
            format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),  // plays before it fully downloads
            target: new mb.BufferTarget(),
        });
        const conversion = await mb.Conversion.init({
            input, output, tracks: "primary", showWarnings: false,
            video: {
                width, height, fit: "fill", codec: "avc", quality: videoQuality,
                forceTranscode: true, allowTransformationMetadata: false,
            },
            // Phones record AAC: copy it as is when this browser can't encode AAC (some iPhones).
            audio: (a) => a.codec === "aac" && !canAac ? { codec: "aac" }
                : canAac ? { codec: "aac", quality: new mb.Quality({ bitrate: preset.audioBps }) }
                : { discard: true },
        });
        if (!conversion.isValid || conversion.discardedTracks.some(d => d.track.type === "video")) return null;

        const cancel = () => conversion.cancel();
        signal?.addEventListener("abort", cancel, { once: true });
        conversion.onProgress = (p) => onProgress?.(Math.min(99, Math.round(p * 100)));
        try {
            await conversion.execute();
        } finally {
            signal?.removeEventListener("abort", cancel);
        }
        if (signal?.aborted) throw new DOMException("Canceled", "AbortError");

        const base = (file.name || "video").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "_").slice(0, 60) || "video";
        return {
            file: new File([output.target.buffer], `opt_${base}.mp4`, { type: "video/mp4" }),
            width, height,
            duration: await input.computeDuration(),
            hdr: await track.hasHighDynamicRange().catch(() => false),
            audio: conversion.utilizedTracks.some(t => t.type === "audio"),
        };
    } finally {
        input.dispose();
    }
};

// A JPEG cover from about one second in, made on the device (ImageKit charges for its own
// video thumbnails). Resolves to null if this browser can't show the video.
export const capturePoster = (file, long = 1280) => new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;
    const done = (blob) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        v.removeAttribute("src");
        resolve(blob);
    };
    const timer = setTimeout(() => done(null), 15000);
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadedmetadata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
    v.onseeked = () => {
        try {
            const { width, height } = fitSize(v.videoWidth, v.videoHeight, long);
            const c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            c.getContext("2d").drawImage(v, 0, 0, width, height);
            c.toBlob((b) => done(b), "image/jpeg", 0.85);
        } catch {
            done(null);
        }
    };
    v.onerror = () => done(null);
    v.src = url;
});
