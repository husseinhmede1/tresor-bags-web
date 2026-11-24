import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Remembers what a list page looked like when the visitor left it (which page of results,
// which filters, how far down they had scrolled), so coming back with "back" or "Cancel" shows
// the same thing instead of the top of page 1.
//
// It is kept per step of the browser's history, in this tab only: coming BACK to a step brings
// its place back, while going to the page afresh (the logo, a menu, a link) starts clean.

const PREFIX = "tresor-place:";
// What a visitor does to move the page themselves.
const HANDS = ["wheel", "touchstart", "pointerdown", "keydown"];
const read = (key) => { try { return JSON.parse(sessionStorage.getItem(PREFIX + key)); } catch { return null; } };

// The page the site was opened on has no step of its own to tell it apart ("default"). Opening
// the site afresh in a tab that was on it before (a typed address, a link) is a new visit, not a
// return: what the earlier visit left there is dropped. A refresh or the browser's back keep it.
try {
    if (performance.getEntriesByType("navigation")[0]?.type === "navigate") sessionStorage.removeItem(PREFIX + "default");
} catch { /* nothing to drop */ }

// Two steps of the history can both be the same page (the shop, then a pick from the shop menu,
// which is the shop again). Going back between them does not open the page anew, so nothing
// would change on screen. This gives a key that changes on such a move: used as the page's
// `key`, the page opens again and shows that step as it was left.
export const useStepKey = () => {
    const { key } = useLocation();
    const cameBack = useNavigationType() === "POP";
    const [seen, setSeen] = useState(key);
    const [step, setStep] = useState(key);
    if (key !== seen) {
        setSeen(key);
        if (cameBack) setStep(key);
    }
    return step;
};

export const useReturnPlace = () => {
    const { key, pathname } = useLocation();
    const cameBack = useNavigationType() === "POP";
    // Read once, when the page opens.
    const [first] = useState(() => (cameBack ? read(key) : null));
    const place = useRef({ view: first?.view ?? null, y: first?.y ?? 0 });
    // The step of the history this page is on now (changing a filter can replace it).
    const keyRef = useRef(key);
    const pathRef = useRef(pathname);

    const write = useCallback(() => {
        try { sessionStorage.setItem(PREFIX + keyRef.current, JSON.stringify(place.current)); } catch { /* private mode: nothing is kept */ }
    }, []);
    useEffect(() => { keyRef.current = key; write(); }, [key, write]);

    // How far down the visitor is, noted as they scroll. Once they have left for another page the
    // browser still reports scrolls for a moment (the new page is shorter): those are not theirs.
    useEffect(() => {
        let timer = 0;
        const onScroll = () => {
            if (window.location.pathname !== pathRef.current) return;
            place.current.y = Math.round(window.scrollY);
            clearTimeout(timer);
            timer = setTimeout(write, 120);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        // And at each click, in case it is the one that leaves: the browser reports a scroll a
        // moment after it happens, which can be after the page has gone.
        window.addEventListener("click", onScroll, true);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("click", onScroll, true); clearTimeout(timer); write(); };
    }, [write]);

    // The page tells what it is showing, each time that changes.
    const remember = useCallback((view) => { place.current.view = view; write(); }, [write]);

    // The page calls this once its content is on screen: back to where the visitor was. The page
    // may still be growing (pictures, a list drawn a moment later), so for a short while it keeps
    // going there until it can, and lets go as soon as the visitor touches the page themselves.
    const restored = useRef(false);
    const stopRestoring = useRef(null);
    const restoreScroll = useCallback(() => {
        if (restored.current) return;
        restored.current = true;
        if (!first) return;
        const y = first.y || 0;
        place.current.y = y;
        const until = performance.now() + 1500;
        let frame = 0, steady = 0;
        const stop = () => {
            cancelAnimationFrame(frame);
            HANDS.forEach((e) => window.removeEventListener(e, stop));
            stopRestoring.current = null;
        };
        const step = () => {
            // At once: the site scrolls smoothly, and gliding down from the top is not "coming back".
            if (Math.abs(window.scrollY - y) > 1) { window.scrollTo({ top: y, behavior: "instant" }); steady = 0; } else steady += 1;
            if (steady > 10 || performance.now() > until) stop();
            else frame = requestAnimationFrame(step);
        };
        HANDS.forEach((e) => window.addEventListener(e, stop, { passive: true }));
        stopRestoring.current = stop;
        frame = requestAnimationFrame(step);
    }, [first]);
    useEffect(() => () => stopRestoring.current?.(), []);

    return { view: first?.view ?? null, remember, restoreScroll };
};
