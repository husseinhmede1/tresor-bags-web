// Compresses a product video in the admin's browser before it is uploaded, so ImageKit only
// stores and serves a small MP4 and never spends its monthly video processing units on it.
// Nothing is saved on the device: the result lives in memory until it is uploaded.
// Returns null when this browser can't compress; the caller then uploads the original file.

// 720p ("Balanced"): sharp on phones, about 6-7 MB per 30 seconds.
const VIDEO_PRESETS = {
    saver:    { long: 1280, videoBps: 1_100_000, audioBps: 96_000 },
    balanced: { long: 1280, videoBps: 1_700_000, audioBps: 128_000 },
    high:     { long: 1920, videoBps: 3_500_000, audioBps: 128_000 },
};
const DEFAULT_PRESET = "balanced";

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
        const buffer = output.target.buffer;
        return {
            file: new File([buffer], `opt_${base}.mp4`, { type: "video/mp4" }),
            poster: await posterFromVideo(mb, buffer, width, height).catch(() => null),
            width, height,
            duration: await input.computeDuration(),
            hdr: await track.hasHighDynamicRange().catch(() => false),
            audio: conversion.utilizedTracks.some(t => t.type === "audio"),
        };
    } finally {
        input.dispose();
    }
};

// --- Cover image -----------------------------------------------------------------------
// A JPEG cover made on the device (ImageKit charges processing units for its own covers).
// Frames are taken from the decoded video itself; a frame that is almost black (the start of
// a clip, or a frame the browser had not drawn yet) is skipped for a later one.

const COVER_TIMES = (d) => [Math.min(1, d / 2), d * 0.25, d * 0.5, d * 0.75, 0.1].filter(t => t >= 0 && t < d);

// Average brightness 0-255 of a downscaled copy.
const brightness = (source) => {
    const c = document.createElement("canvas");
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, 24, 24);
    const d = ctx.getImageData(0, 0, 24, 24).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4);
};
const isDark = (source) => brightness(source) < 12;

const toJpeg = (canvas) => typeof canvas.convertToBlob === "function"
    ? canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 })
    : new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

// From the compressed MP4, decoded with WebCodecs (no <video> element involved).
const posterFromVideo = async (mb, buffer, width, height) => {
    const input = new mb.Input({ source: new mb.BlobSource(new Blob([buffer])), formats: mb.ALL_FORMATS });
    try {
        const track = await input.getPrimaryVideoTrack();
        if (!track) return null;
        const sink = new mb.CanvasSink(track, { width, height, fit: "fill" });
        const duration = await track.computeDuration();
        let fallback = null;
        for (const t of COVER_TIMES(duration)) {
            const frame = await sink.getCanvas(t);
            if (!frame) continue;
            if (!isDark(frame.canvas)) return await toJpeg(frame.canvas);
            fallback ??= frame.canvas;
        }
        return fallback ? await toJpeg(fallback) : null;   // a clip that is dark all along
    } finally {
        input.dispose();
    }
};

// For a video that was not compressed: through a <video> element, waiting until the frame is
// really drawn. Resolves to null if this browser can't show the video.
export const capturePoster = (file, long = 1280) => new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;
    let times = [];
    let fallback = null;
    const done = (blob) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        v.removeAttribute("src");
        resolve(blob);
    };
    const timer = setTimeout(() => done(null), 15000);
    const grab = () => {
        try {
            const { width, height } = fitSize(v.videoWidth, v.videoHeight, long);
            const c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            c.getContext("2d").drawImage(v, 0, 0, width, height);
            if (isDark(c) && times.length) {
                fallback ??= c;
                v.currentTime = times.shift();
                return;
            }
            c.toBlob((b) => done(b), "image/jpeg", 0.85);
        } catch {
            fallback ? fallback.toBlob((b) => done(b), "image/jpeg", 0.85) : done(null);
        }
    };
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadedmetadata = () => {
        times = COVER_TIMES(v.duration || 2);
        v.currentTime = times.shift();
    };
    // "seeked" can fire before the new frame is painted: wait for it when the browser can tell us.
    v.onseeked = () => {
        if (typeof v.requestVideoFrameCallback === "function") {
            let waited = false;
            v.requestVideoFrameCallback(() => { if (!waited) { waited = true; grab(); } });
            setTimeout(() => { if (!waited) { waited = true; grab(); } }, 300);
        } else {
            setTimeout(grab, 150);
        }
    };
    v.onerror = () => done(null);
    v.src = url;
});
