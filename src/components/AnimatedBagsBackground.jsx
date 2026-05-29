import { useEffect, useRef } from "react";
import bag1 from "../assets/bag1.png";
import bag2 from "../assets/bag2.png";
import bag3 from "../assets/bag3.png";
import bag4 from "../assets/bag4.png";
import bag5 from "../assets/bag5.png";
import bag6 from "../assets/bag6.png";
import bag7 from "../assets/bag7.png";
import bag8 from "../assets/bag8.png";

const BAGS = [bag1, bag2, bag3, bag4, bag5, bag6, bag7, bag8];

// Each bag: position (%), size, drift amplitude, rotation, opacity, animation phase
const CONFIGS = [
  { img:0, left:1,  top:2,  size:210, tx:22, ty:28, rx: 8, ry:-10, rz:-5, opacity:0.60, dur:15, phase:0    },
  { img:1, left:74, top:0,  size:195, tx:-20,ty:24, rx:-6, ry: 12, rz: 4, opacity:0.55, dur:18, phase:-4.2 },
  { img:2, left:55, top:56, size:240, tx:26, ty:-30,rx: 5, ry: -8, rz:-3, opacity:0.52, dur:20, phase:-8.1 },
  { img:3, left:16, top:62, size:220, tx:-24,ty:22, rx:-8, ry: 13, rz: 6, opacity:0.58, dur:16, phase:-2.7 },
  { img:4, left:83, top:40, size:185, tx:20, ty:-26,rx: 7, ry:-11, rz:-4, opacity:0.50, dur:22, phase:-11.3},
  { img:5, left:36, top:16, size:230, tx:-26,ty:20, rx:-4, ry:  9, rz: 3, opacity:0.48, dur:17, phase:-6.5 },
  { img:6, left:87, top:70, size:175, tx:18, ty:-22,rx: 6, ry: -9, rz:-3, opacity:0.45, dur:14, phase:-3.8 },
  { img:7, left:4,  top:36, size:200, tx:-22,ty:26, rx:-7, ry: 11, rz: 5, opacity:0.53, dur:19, phase:-9.6 },
  { img:0, left:62, top:80, size:190, tx:24, ty:-24,rx: 9, ry: -7, rz:-4, opacity:0.42, dur:21, phase:-14.0},
  { img:2, left:90, top:8,  size:170, tx:-18,ty:20, rx:-5, ry:  8, rz: 3, opacity:0.40, dur:16, phase:-5.2 },
];

export default function AnimatedBagsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const imgs = BAGS.map((src) => {
      const el = new window.Image();
      el.src = src;
      return el;
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W, H;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    let raf;

    const drawBag = (cfg, t) => {
      const img = imgs[cfg.img];
      if (!img.complete || !img.naturalWidth) return;

      const aspect = img.naturalHeight / img.naturalWidth;

      // Organic multi-frequency motion
      const bob   = Math.sin(t * 1.0) * cfg.ty * 0.6 + Math.sin(t * 0.37) * cfg.ty * 0.4;
      const sway  = Math.cos(t * 0.8) * cfg.tx * 0.6 + Math.cos(t * 0.51) * cfg.tx * 0.4;
      const scale = 1 + Math.sin(t * 0.6) * 0.025 + Math.sin(t * 1.3) * 0.01;

      // 3-axis rotation
      const rzRad = (cfg.rz + Math.sin(t * 0.5) * 3) * Math.PI / 180;
      const ryRad = (cfg.ry + Math.cos(t * 0.4) * 5) * Math.PI / 180;
      const rxFactor = 1 - Math.abs(cfg.rx + Math.sin(t * 0.45) * 4) * 0.005; // Y compression = rotX

      const cx = (cfg.left / 100) * W + sway;
      const cy = (cfg.top  / 100) * H + bob;
      const w  = cfg.size;
      const h  = w * aspect;

      ctx.save();
      ctx.globalAlpha = cfg.opacity;
      ctx.translate(cx, cy);

      // Simulate 3D: rotate Z + skew for Y-axis tilt
      ctx.rotate(rzRad);
      ctx.transform(
        Math.cos(ryRad), 0,
        Math.sin(ryRad) * 0.45, rxFactor,
        0, 0
      );
      ctx.scale(scale, scale);

      // Deep shadow
      ctx.shadowColor = "rgba(0,0,0,0.80)";
      ctx.shadowBlur  = 45;
      ctx.shadowOffsetY = 28;
      ctx.shadowOffsetX = sway * 0.3;

      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // Gold light sweep
      const sweepPos = ((Math.sin(t * 0.2) + 1) / 2) * w * 1.6 - w * 0.3;
      const sheen = ctx.createLinearGradient(-w/2 + sweepPos, -h/2, -w/2 + sweepPos + w*0.35, h/2);
      sheen.addColorStop(0,   "rgba(201,168,106,0)");
      sheen.addColorStop(0.5, "rgba(201,168,106,0.07)");
      sheen.addColorStop(1,   "rgba(201,168,106,0)");
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowOffsetX = 0;
      ctx.fillStyle = sheen;
      ctx.fillRect(-w/2, -h/2, w, h);

      ctx.restore();
    };

    const frame = () => {
      t += 0.007;
      ctx.clearRect(0, 0, W, H);
      CONFIGS.forEach((cfg, i) => drawBag(cfg, t + cfg.phase));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, background:"#070707", pointerEvents:"none" }} />
      <canvas ref={canvasRef} aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", display:"block" }} />
      <svg aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, width:"100%", height:"100%", opacity:0.035, pointerEvents:"none" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)"/>
      </svg>
    </>
  );
}
