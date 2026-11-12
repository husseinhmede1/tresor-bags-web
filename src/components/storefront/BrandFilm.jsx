import { useEffect, useRef, useState } from "react";

// The shop's film, under the homepage hero. It is a vertical phone video, so it plays in a
// tall frame (stretched across a laptop screen it would be blurry and cut off people's heads).
// Nothing is downloaded until the customer scrolls near it, and it only plays while in view.
const SRC = "/brand-film.mp4";
const POSTER = "/brand-film.webp";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function BrandFilm() {
    const boxRef = useRef(null);
    const videoRef = useRef(null);
    const [near, setNear] = useState(false);
    const [still] = useState(reducedMotion);   // reduced motion: no autoplay, the customer presses play
    const [blocked, setBlocked] = useState(false);   // the phone refused to autoplay (e.g. Low Power Mode)

    // Start loading a little before it scrolls into view.
    useEffect(() => {
        const el = boxRef.current;
        if (!el || near) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "300px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [near]);

    // Play while at least a third of it is on screen, pause otherwise.
    useEffect(() => {
        const v = videoRef.current;
        if (!v || !near || still) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.intersectionRatio >= 0.35) v.play().catch(err => { if (err?.name === "NotAllowedError") setBlocked(true); });
            else v.pause();
        }, { threshold: [0, 0.35] });
        io.observe(v);
        return () => io.disconnect();
    }, [near, still]);

    return (
        <section className="film" ref={boxRef} aria-labelledby="film-h">
            <style>{CSS}</style>
            <div className="film__bg" style={{ backgroundImage: `url(${POSTER})` }} aria-hidden="true" />
            <div className="sf-container film__inner">
                <div className="film__copy">
                    <h2 id="film-h" className="sf-h2">Inside the shop</h2>
                    <p className="sf-lead film__lead">A look around Trésor and some of the bags we carry.</p>
                </div>
                <div className="film__frame">
                    <video
                        ref={videoRef}
                        src={near ? SRC : undefined}
                        poster={POSTER}
                        muted loop playsInline
                        preload="none"
                        controls={still || blocked}
                        aria-label="A short film of the Trésor shop"
                    />
                    <img className="film__logo" src="/tresor_logo.webp" alt="" />
                </div>
            </div>
        </section>
    );
}

const CSS = `
.film { position: relative; overflow: hidden; isolation: isolate; padding-block: 56px; border-block: 1px solid rgba(255,255,255,0.06); }
.film__bg { position: absolute; inset: -40px; z-index: -1; background-size: cover; background-position: center; filter: blur(48px) saturate(1.1); opacity: .35; transform: scale(1.1); }
.film::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, #0B0B0C 0%, rgba(11,11,12,.8) 50%, rgba(11,11,12,.6) 100%); }
.film__inner { display: grid; grid-template-columns: minmax(0, 440px) auto; justify-content: center; align-items: center; gap: clamp(40px, 8vw, 120px); }
.film__copy { align-self: start; padding-top: 24px; }
.film__lead { margin-top: 14px; max-width: 34ch; }
.film__frame { position: relative; height: min(620px, 78vh); aspect-ratio: 9 / 16; border-radius: 20px; overflow: hidden; background: #0b0b0c;
    border: 1px solid rgba(255,255,255,0.10); box-shadow: 0 40px 90px rgba(0,0,0,.55); }
.film__frame video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.film__frame::after { content: ""; position: absolute; inset: auto 0 0; height: 30%; background: linear-gradient(to top, rgba(8,8,8,.85), transparent); pointer-events: none; }
.film__logo { position: absolute; left: 18px; bottom: 16px; z-index: 1; height: 34px; width: 96px; object-fit: contain; object-position: left center; pointer-events: none; }
@media (max-width: 900px) {
    .film { padding-block: 32px 40px; }
    .film::after { background: linear-gradient(180deg, #0B0B0C 0%, rgba(11,11,12,.75) 40%, rgba(11,11,12,.6) 100%); }
    .film__inner { grid-template-columns: 1fr; gap: 20px; }
    .film__copy { padding-top: 0; }
    .film__frame { height: auto; width: 100%; aspect-ratio: 4 / 5; }
}
`;
