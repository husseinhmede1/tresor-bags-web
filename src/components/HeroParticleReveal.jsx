import { useEffect, useRef } from "react";

const HeroParticleReveal = ({ onComplete }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const W = canvas.offsetWidth || window.innerWidth;
        const H = canvas.offsetHeight || 460;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        /* ── Sample text pixels from offscreen canvas ── */
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const oct = off.getContext("2d");

        const isMobile = W < 600;
        const titleSize  = isMobile ? Math.floor(W * 0.095) : Math.min(Math.floor(W * 0.072), 86);
        const eyeSize    = isMobile ? 9 : 11;
        const subSize    = isMobile ? 11 : 14;
        const centerY    = H / 2;

        // eyebrow
        oct.font = `400 ${eyeSize}px 'Inter', sans-serif`;
        oct.letterSpacing = "0.38em";
        oct.fillStyle = "rgba(201,168,106,0.75)";
        oct.textAlign = "center";
        oct.textBaseline = "middle";
        oct.fillText("CURATED LUXURY TRAVEL & EXECUTIVE ESSENTIALS", W / 2, centerY - titleSize * 1.52);

        // main title
        oct.font = `700 ${titleSize}px 'Cormorant Garamond', serif`;
        oct.fillStyle = "white";
        oct.fillText("TRÉSOR BAGS", W / 2, centerY - titleSize * 0.35);
        oct.fillText("COLLECTION", W / 2, centerY + titleSize * 0.75);

        // subtitle
        oct.font = `400 ${subSize}px 'Inter', sans-serif`;
        oct.fillStyle = "rgba(216,201,161,0.8)";
        oct.fillText(
            "Premium business, travel, and luxury bags designed for the modern executive.",
            W / 2, centerY + titleSize * 1.58
        );

        const data = oct.getImageData(0, 0, W, H).data;
        const allPixels = [];
        const stride = 3;
        for (let y = 0; y < H; y += stride) {
            for (let x = 0; x < W; x += stride) {
                const i = (y * W + x) * 4;
                if (data[i + 3] > 80) allPixels.push({ x, y });
            }
        }

        // Sort left→right, top→bottom for typewriter feel
        allPixels.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
        const PATH_STEP = Math.max(1, Math.floor(allPixels.length / 1200));
        const path = allPixels.filter((_, i) => i % PATH_STEP === 0);

        /* ── Particle pool ── */
        const particles = [];

        const COLORS = [
            [201, 168, 106],
            [229, 196, 138],
            [245, 223, 160],
            [255, 240, 185],
        ];

        const emit = (x, y, count, energized = false) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = energized
                    ? Math.random() * 3.5 + 1
                    : Math.random() * 1.2 + 0.2;
                const size = energized
                    ? Math.random() * 3 + 1
                    : Math.random() * 2 + 0.4;
                const life = energized
                    ? Math.random() * 50 + 30
                    : Math.random() * 70 + 50;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (energized ? 0.5 : 0.3),
                    size,
                    life,
                    maxLife: life,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    energized,
                });
            }
        };

        /* ── State ── */
        let pathIndex = 0;
        let phase = "trace"; // trace → burst → fade
        let burstRadius = 0;
        let burstAlpha = 1;
        let globalFade = 1;
        let rafId;

        const TRACE_SPEED = Math.ceil(path.length / 90); // ~90 frames = 1.5s

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            /* ── TRACE phase ── */
            if (phase === "trace") {
                for (let i = 0; i < TRACE_SPEED && pathIndex < path.length; i++, pathIndex++) {
                    emit(path[pathIndex].x, path[pathIndex].y, 2);
                }

                // Glowing streak head
                const head = path[Math.min(pathIndex, path.length - 1)];
                if (head) {
                    const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
                    g.addColorStop(0, "rgba(255,245,200,1)");
                    g.addColorStop(0.35, "rgba(229,196,138,0.9)");
                    g.addColorStop(1, "rgba(201,168,106,0)");
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (pathIndex >= path.length) {
                    phase = "burst";
                }
            }

            /* ── BURST phase ── */
            if (phase === "burst") {
                burstRadius += 14;
                burstAlpha = Math.max(0, 1 - burstRadius / (Math.max(W, H) * 0.75));

                // Burst particles from all text pixels
                if (burstRadius < 30) {
                    const sample = path.filter((_, i) => i % 5 === 0);
                    sample.forEach(pt => emit(pt.x, pt.y, 1, true));
                }

                // Ripple ring
                ctx.save();
                ctx.globalAlpha = burstAlpha * 0.65;
                ctx.strokeStyle = "rgba(229,196,138,0.9)";
                ctx.lineWidth = 1.5;
                ctx.shadowColor = "rgba(229,196,138,1)";
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(W / 2, centerY + titleSize * 0.2, burstRadius, 0, Math.PI * 2);
                ctx.stroke();
                // second ring slightly behind
                ctx.globalAlpha = burstAlpha * 0.35;
                ctx.beginPath();
                ctx.arc(W / 2, centerY + titleSize * 0.2, burstRadius * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                if (burstAlpha <= 0) {
                    phase = "fade";
                }
            }

            /* ── Update & draw particles ── */
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.035;
                p.vx *= 0.97;
                p.life--;

                if (p.life <= 0) { particles.splice(i, 1); continue; }

                const lifeRatio = p.life / p.maxLife;
                const alpha = lifeRatio * (phase === "fade" ? globalFade : 1);
                if (alpha <= 0.01) continue;

                const [r, g, b] = p.color;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
                ctx.shadowBlur = p.energized ? 10 : 5;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            /* ── FADE phase ── */
            if (phase === "fade") {
                globalFade -= 0.018;
                if (globalFade <= 0 && particles.length === 0) {
                    cancelAnimationFrame(rafId);
                    onComplete?.();
                    return;
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        // Small delay to let fonts load
        const t = setTimeout(() => { rafId = requestAnimationFrame(draw); }, 300);

        return () => {
            clearTimeout(t);
            cancelAnimationFrame(rafId);
        };
    }, [onComplete]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 3,
                pointerEvents: "none",
            }}
        />
    );
};

export default HeroParticleReveal;
