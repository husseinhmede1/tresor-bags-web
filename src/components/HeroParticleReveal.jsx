import { useEffect, useRef } from "react";

const HeroParticleReveal = ({ onComplete, onBurst }) => {
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

        /* ── Render text offscreen ── */
        const off = document.createElement("canvas");
        off.width = W; off.height = H;
        const oct = off.getContext("2d");
        const isMobile = W < 600;
        const titleSize = isMobile ? Math.floor(W * 0.095) : Math.min(Math.floor(W * 0.072), 86);
        const centerX = W / 2;
        const centerY = H / 2;
        const textCY = centerY + titleSize * 0.2; // visual center of the title block

        oct.textAlign = "center"; oct.textBaseline = "middle";
        oct.font = `400 ${isMobile ? 9 : 11}px 'Inter', sans-serif`;
        oct.fillStyle = "rgba(201,168,106,0.75)";
        oct.fillText("CURATED LUXURY TRAVEL & EXECUTIVE ESSENTIALS", centerX, centerY - titleSize * 1.52);
        oct.font = `700 ${titleSize}px 'Cormorant Garamond', serif`;
        oct.fillStyle = "white";
        oct.fillText("TRÉSOR BAGS", centerX, centerY - titleSize * 0.35);
        oct.fillText("COLLECTION", centerX, centerY + titleSize * 0.75);
        oct.font = `400 ${isMobile ? 11 : 14}px 'Inter', sans-serif`;
        oct.fillStyle = "rgba(216,201,161,0.8)";
        oct.fillText("Premium business, travel, and luxury bags designed for the modern executive.", centerX, centerY + titleSize * 1.58);

        /* ── Sample pixels ── */
        const data = oct.getImageData(0, 0, W, H).data;
        const allPixels = [];
        const stride = 3;
        for (let y = 0; y < H; y += stride) {
            for (let x = 0; x < W; x += stride) {
                const i = (y * W + x) * 4;
                if (data[i + 3] > 80) allPixels.push({ x, y });
            }
        }

        /* ── Split into 4 directional groups ── */
        const groups = { left: [], right: [], top: [], bottom: [] };
        for (const p of allPixels) {
            const dx = Math.min(p.x, W - p.x);
            const dy = Math.min(p.y, H - p.y);
            if (dx < dy) { if (p.x < centerX) groups.left.push(p); else groups.right.push(p); }
            else { if (p.y < centerY) groups.top.push(p); else groups.bottom.push(p); }
        }
        groups.left.sort((a, b) => a.x - b.x);
        groups.right.sort((a, b) => b.x - a.x);
        groups.top.sort((a, b) => a.y - b.y);
        groups.bottom.sort((a, b) => b.y - a.y);

        const makePath = (arr) => {
            const step = Math.max(1, Math.floor(arr.length / 300));
            return arr.filter((_, i) => i % step === 0);
        };
        const streaks = [
            { path: makePath(groups.left),   idx: 0, done: false },
            { path: makePath(groups.right),  idx: 0, done: false },
            { path: makePath(groups.top),    idx: 0, done: false },
            { path: makePath(groups.bottom), idx: 0, done: false },
        ];

        /* ── Particles ── */
        const particles = [];
        const COLORS = [[201,168,106],[229,196,138],[245,223,160],[255,240,185]];

        const emit = (x, y, count, energized = false) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = energized ? Math.random() * 4 + 1.5 : Math.random() * 1.2 + 0.2;
                const size  = energized ? Math.random() * 3 + 1   : Math.random() * 2 + 0.4;
                const life  = energized ? Math.random() * 50 + 30  : Math.random() * 70 + 50;
                particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-(energized?.6:.3), size, life, maxLife: life, color: COLORS[Math.floor(Math.random()*COLORS.length)], energized });
            }
        };

        /* ── Lens flare state ── */
        let flareAlpha = 0;       // 0→1→0
        let flarePhase = "off";   // off → rise → fall

        const drawLensFlares = (alpha) => {
            if (alpha <= 0) return;
            ctx.save();
            ctx.globalCompositeOperation = "lighter";

            // Horizontal beam
            const hg = ctx.createLinearGradient(0, textCY, W, textCY);
            hg.addColorStop(0,   "rgba(245,223,160,0)");
            hg.addColorStop(0.35,"rgba(229,196,138,0)");
            hg.addColorStop(0.45,`rgba(255,245,200,${alpha * 0.55})`);
            hg.addColorStop(0.5, `rgba(255,255,230,${alpha * 0.9})`);
            hg.addColorStop(0.55,`rgba(255,245,200,${alpha * 0.55})`);
            hg.addColorStop(0.65,"rgba(229,196,138,0)");
            hg.addColorStop(1,   "rgba(245,223,160,0)");
            ctx.fillStyle = hg;
            ctx.fillRect(0, textCY - 1.5, W, 3);

            // Soft halo around beam
            const hh = ctx.createLinearGradient(0, textCY, W, textCY);
            hh.addColorStop(0,   "rgba(245,223,160,0)");
            hh.addColorStop(0.4, `rgba(201,168,106,${alpha * 0.12})`);
            hh.addColorStop(0.5, `rgba(229,196,138,${alpha * 0.22})`);
            hh.addColorStop(0.6, `rgba(201,168,106,${alpha * 0.12})`);
            hh.addColorStop(1,   "rgba(245,223,160,0)");
            ctx.fillStyle = hh;
            ctx.fillRect(0, textCY - 10, W, 20);

            // Vertical beam
            const vg = ctx.createLinearGradient(centerX, 0, centerX, H);
            vg.addColorStop(0,    "rgba(245,223,160,0)");
            vg.addColorStop(0.25, `rgba(201,168,106,${alpha * 0.15})`);
            vg.addColorStop(0.45, `rgba(255,245,200,${alpha * 0.5})`);
            vg.addColorStop(0.5,  `rgba(255,255,230,${alpha * 0.75})`);
            vg.addColorStop(0.55, `rgba(255,245,200,${alpha * 0.5})`);
            vg.addColorStop(0.75, `rgba(201,168,106,${alpha * 0.15})`);
            vg.addColorStop(1,    "rgba(245,223,160,0)");
            ctx.fillStyle = vg;
            ctx.fillRect(centerX - 1.5, 0, 3, H);

            // Vertical halo
            const vh = ctx.createLinearGradient(centerX, 0, centerX, H);
            vh.addColorStop(0,    "rgba(245,223,160,0)");
            vh.addColorStop(0.35, `rgba(201,168,106,${alpha * 0.1})`);
            vh.addColorStop(0.5,  `rgba(229,196,138,${alpha * 0.18})`);
            vh.addColorStop(0.65, `rgba(201,168,106,${alpha * 0.1})`);
            vh.addColorStop(1,    "rgba(245,223,160,0)");
            ctx.fillStyle = vh;
            ctx.fillRect(centerX - 8, 0, 16, H);

            // Center starburst
            const cg = ctx.createRadialGradient(centerX, textCY, 0, centerX, textCY, 60);
            cg.addColorStop(0,   `rgba(255,255,240,${alpha * 0.95})`);
            cg.addColorStop(0.08,`rgba(255,240,190,${alpha * 0.7})`);
            cg.addColorStop(0.3, `rgba(229,196,138,${alpha * 0.2})`);
            cg.addColorStop(1,   "rgba(201,168,106,0)");
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.arc(centerX, textCY, 60, 0, Math.PI * 2);
            ctx.fill();

            // Diagonal glints ×4
            for (const angle of [Math.PI/4, -Math.PI/4, 3*Math.PI/4, -3*Math.PI/4]) {
                const len = Math.min(W, H) * 0.5;
                const x2 = centerX + Math.cos(angle) * len;
                const y2 = textCY  + Math.sin(angle) * len;
                const dg = ctx.createLinearGradient(centerX, textCY, x2, y2);
                dg.addColorStop(0,   `rgba(255,245,200,${alpha * 0.6})`);
                dg.addColorStop(0.15,`rgba(229,196,138,${alpha * 0.25})`);
                dg.addColorStop(0.5, `rgba(201,168,106,${alpha * 0.06})`);
                dg.addColorStop(1,   "rgba(201,168,106,0)");
                ctx.strokeStyle = dg;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX, textCY);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            ctx.globalCompositeOperation = "source-over";
            ctx.restore();
        };

        /* ── State ── */
        let phase = "trace";
        let burstR = 0; let burstA = 1;
        let globalFade = 1;
        let burstFired = false;
        let rafId;
        const SPEED = 4;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            /* TRACE */
            if (phase === "trace") {
                let allDone = true;
                for (const s of streaks) {
                    if (s.done) continue;
                    allDone = false;
                    for (let i = 0; i < SPEED && s.idx < s.path.length; i++, s.idx++) emit(s.path[s.idx].x, s.path[s.idx].y, 2);
                    if (s.idx >= s.path.length) s.done = true;
                }
                for (const s of streaks) {
                    if (s.done || !s.path.length) continue;
                    const pt = s.path[Math.min(s.idx, s.path.length - 1)];
                    const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 14);
                    g.addColorStop(0, "rgba(255,245,200,1)");
                    g.addColorStop(0.3, "rgba(229,196,138,0.85)");
                    g.addColorStop(1, "rgba(201,168,106,0)");
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
                }
                if (allDone) { phase = "burst"; }
            }

            /* BURST */
            if (phase === "burst") {
                if (!burstFired) {
                    burstFired = true;
                    onBurst?.({ centerX, centerY: textCY, maxRadius: Math.max(W, H) * 0.7 });
                    flarePhase = "rise";
                }

                burstR += 16;
                burstA = Math.max(0, 1 - burstR / (Math.max(W, H) * 0.7));

                // Flare rise/fall
                if (flarePhase === "rise") {
                    flareAlpha = Math.min(flareAlpha + 0.12, 1);
                    if (flareAlpha >= 1) flarePhase = "fall";
                } else if (flarePhase === "fall") {
                    flareAlpha = Math.max(flareAlpha - 0.06, 0);
                }

                if (burstR < 35) {
                    const all = streaks.flatMap(s => s.path);
                    all.filter((_, i) => i % 4 === 0).forEach(pt => emit(pt.x, pt.y, 1, true));
                }

                // Ripple rings
                for (const [mult, a] of [[1, 0.7],[0.65, 0.35]]) {
                    ctx.save();
                    ctx.globalAlpha = burstA * a;
                    ctx.strokeStyle = "rgba(229,196,138,0.9)";
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = "rgba(229,196,138,1)";
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(centerX, textCY, burstR * mult, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                // Edge rays
                const eA = burstA * 0.5;
                if (eA > 0.01) {
                    ctx.save(); ctx.globalAlpha = eA;
                    ctx.strokeStyle = "rgba(245,223,160,0.8)"; ctx.lineWidth = 1;
                    ctx.shadowColor = "rgba(229,196,138,1)"; ctx.shadowBlur = 10;
                    for (const [x1,y1,x2,y2] of [[0,textCY,centerX-burstR,textCY],[W,textCY,centerX+burstR,textCY],[centerX,0,centerX,textCY-burstR],[centerX,H,centerX,textCY+burstR]]) {
                        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
                    }
                    ctx.restore();
                }

                if (burstA <= 0) phase = "fade";
            }

            /* Particles */
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.97; p.life--;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                const lr = p.life / p.maxLife;
                const alpha = lr * (phase === "fade" ? globalFade : 1);
                if (alpha < 0.01) continue;
                const [r, g, b] = p.color;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
                ctx.shadowBlur = p.energized ? 12 : 5;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * lr, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            /* Lens flares (drawn on top of particles) */
            drawLensFlares(flareAlpha);

            /* FADE */
            if (phase === "fade") {
                flareAlpha = Math.max(flareAlpha - 0.04, 0);
                globalFade -= 0.016;
                if (globalFade <= 0 && particles.length === 0) {
                    cancelAnimationFrame(rafId);
                    onComplete?.();
                    return;
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        const t = setTimeout(() => { rafId = requestAnimationFrame(draw); }, 300);
        return () => { clearTimeout(t); cancelAnimationFrame(rafId); };
    }, [onComplete, onBurst]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }}
        />
    );
};

export default HeroParticleReveal;
