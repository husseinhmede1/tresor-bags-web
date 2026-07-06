import { useState, useEffect, useRef, useCallback } from "react";
import heroBagImg from "../assets/hero_final1.png";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { getAllBags, deleteBag } from "../services/bagService";
import { getAllCategories, deleteCategory } from "../services/categoryService";
import { getAllTypes } from "../services/typeService";
import HeroParticleReveal from "../components/HeroParticleReveal";
import TypeSelectorModal from "../components/TypeSelectorModal";

/* ── Logo with animated zipper canvas overlay ── */
const LogoWithZipper = ({ src }) => {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = 320, H = 80, dpr = window.devicePixelRatio || 1;
        canvas.style.width = W + "px"; canvas.style.height = H + "px";
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.scale(dpr, dpr);
        let t = 0, zp = 0, zd = 1; const sparks = [];
        const addSpark = (x, y) => sparks.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 1.4) * 1.5, life: 1, r: Math.random() * 1.5 + 0.5 });
        const draw = () => {
            t += 0.016; zp += zd * 0.006;
            if (zp >= 1) { zp = 1; zd = -1; } if (zp <= 0) { zp = 0; zd = 1; }
            ctx.clearRect(0, 0, W, H);
            const zy = H - 6, zx1 = 4, zx2 = W - 4, headX = zx1 + (zx2 - zx1) * zp;
            ctx.strokeStyle = "rgba(80,70,50,0.4)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(zx1, zy); ctx.lineTo(zx2, zy); ctx.stroke();
            ctx.strokeStyle = "#dfa94b"; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(zx1, zy); ctx.lineTo(headX, zy); ctx.stroke();
            for (let i = 0; i <= 20; i++) {
                const tx = zx1 + (zx2 - zx1) * (i / 20), open = tx < headX;
                ctx.fillStyle = open ? "rgba(223,169,75,0.75)" : "rgba(100,90,70,0.5)";
                ctx.beginPath(); ctx.arc(tx, zy + (open ? -2.5 : 0), 1.6, 0, Math.PI * 2); ctx.fill();
                if (open) { ctx.beginPath(); ctx.arc(tx, zy + 2.5, 1.6, 0, Math.PI * 2); ctx.fill(); }
            }
            const hg = ctx.createRadialGradient(headX, zy, 0, headX, zy, 9);
            hg.addColorStop(0, "rgba(223,169,75,0.85)"); hg.addColorStop(1, "rgba(223,169,75,0)");
            ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(headX, zy, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#dfa94b"; ctx.beginPath(); ctx.arc(headX, zy, 3.5, 0, Math.PI * 2); ctx.fill();
            const sx = ((t * 45) % (W + 60)) - 30;
            const shg = ctx.createLinearGradient(sx - 20, 0, sx + 20, 0);
            shg.addColorStop(0, "rgba(255,240,190,0)"); shg.addColorStop(0.5, "rgba(255,240,190,0.18)"); shg.addColorStop(1, "rgba(255,240,190,0)");
            ctx.fillStyle = shg; ctx.fillRect(0, 0, W, H - 10);
            if (Math.random() < 0.3) addSpark(headX + (Math.random() - 0.5) * 4, zy);
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.life -= 0.05;
                if (s.life <= 0) { sparks.splice(i, 1); continue; }
                ctx.save(); ctx.globalAlpha = s.life; ctx.fillStyle = "#e5c48a";
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);
    return (
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
            <img src={src} alt="Trésor Outlet Store" style={{ height: 60, width: 120, objectFit: "contain", objectPosition: "left center", display: "block", borderRadius: "300px" }} />
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: 220, height: 40, pointerEvents: "none" }} />
        </div>
    );
};

/* ── Tokens ── */
const GOLD   = "#dfa94b";
const GOLD_L = "#E5C48A";
const GOLD_D = "#C9A86A";
const BG     = "transparent";
const CARD   = "#0e0e0e";
const BORDER = "rgba(255,255,255,0.06)";
const BORDER_GOLD = "rgba(201,168,106,0.18)";
const MUTED  = "#6B6560";
const TEXT   = "#F5F1E8";
const SERIF  = "'Cormorant Garamond', serif";
const SANS   = "'Inter', sans-serif";

const inputBase = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,168,106,0.15)",
    borderRadius: 0,
    color: TEXT,
    fontSize: 13,
    fontFamily: SANS,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    letterSpacing: "0.04em",
};

/* ── SliderGroup ── */
const SliderGroup = ({ label, minVal, maxVal, setMin, setMax, range, unit }) => (
    <div style={S.filterGroup}>
        <label style={S.filterLabel}>{label}</label>
        <div style={S.sliderGroup}>
            <input type="range" min={range.min} max={maxVal || range.max} value={minVal || range.min}
                onChange={(e) => { const v = e.target.value; setMin(v); if (maxVal && Number(v) > Number(maxVal)) setMax(v); }} />
            <input type="range" min={minVal || range.min} max={range.max} value={maxVal || range.max}
                onChange={(e) => { const v = e.target.value; setMax(v); if (minVal && Number(v) < Number(minVal)) setMin(v); }} />
        </div>
        <div style={S.sliderValues}><span>{minVal || range.min} {unit}</span><span>{maxVal || range.max} {unit}</span></div>
    </div>
);

/* ── RevealCard ── */
const RevealCard = ({ children, index }) => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.style.transitionDelay = `${(index % 3) * 80}ms`;
                el.classList.add("card-revealed");
                observer.unobserve(el);
            }
        }, { threshold: 0.08 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [index]);
    return <div ref={ref} className="card-reveal-wrapper">{children}</div>;
};

/* ── HeroCanvas ── */
const HeroCanvas = () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", overflow: "hidden" }}>
        <img src={heroBagImg} alt="" style={{
            height: "92%", width: "auto", objectFit: "contain",
            filter: "drop-shadow(0 32px 64px rgba(0,0,0,0.85)) drop-shadow(0 0 40px rgba(201,168,106,0.18))",
            animation: "heroBagFloat 6s ease-in-out infinite",
            transformOrigin: "center bottom",
        }} />
        <style>{`
            @keyframes heroBagFloat {
                0%   { transform: translateY(0px)   rotate(-1deg)  scale(1);     }
                25%  { transform: translateY(-14px) rotate(0.5deg) scale(1.012); }
                50%  { transform: translateY(-22px) rotate(1.5deg) scale(1.018); }
                75%  { transform: translateY(-10px) rotate(0.2deg) scale(1.008); }
                100% { transform: translateY(0px)   rotate(-1deg)  scale(1);     }
            }
            @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        `}</style>
    </div>
);

/* ══════════════════════════════════════════ */
const BagListing = () => {
    const { isAdmin, logout } = useAuth();
    const { getQuantity, setQuantity, totalItems } = useCart();
    const navigate = useNavigate();

    /* ── Category selector modal ── */
    const alreadySeen = sessionStorage.getItem('tresor-modal-seen') === '1';
    const savedCategory = sessionStorage.getItem('tresor-selected-category') || null;
    const [showModal, setShowModal]                       = useState(!alreadySeen);
    const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState(savedCategory);
    const [pageRevealed, setPageRevealed]                 = useState(alreadySeen);

    useEffect(() => {
        if (pageRevealed) {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }
    }, [pageRevealed]);

    const revealPage = () => {
        sessionStorage.setItem('tresor-modal-seen', '1');
        setShowModal(false);
        setTimeout(() => setPageRevealed(true), 650);
    };

    const handleModalStart = (cat) => {
        setSelectedPrimaryCategory(cat.title);
        setSelectedCollection(null);
        sessionStorage.setItem('tresor-selected-category', cat.title);
        revealPage();
    };
    const handleModalSkip = () => {
        setSelectedPrimaryCategory(null);
        setSelectedCollection(null);
        sessionStorage.removeItem('tresor-selected-category');
        revealPage();
    };

    const [activeTab, setActiveTab] = useState("items");
    const [heroReady, setHeroReady] = useState(false);
    const [clipRadius, setClipRadius] = useState(0);   // 0 → 200 during burst
    const [heroScale, setHeroScale] = useState(1);     // micro-scale pulse
    const clipRafRef = useRef(null);

    const onHeroDone = useCallback(() => setHeroReady(true), []);

    const onBurst = useCallback(({ maxRadius }) => {
        /* Micro-scale pulse: expand then settle */
        setHeroScale(1.028);
        setTimeout(() => setHeroScale(1), 650);

        /* Clip-path reveal from center outward, matching shockwave speed */
        let r = 0;
        const target = 200;
        const step = target / (maxRadius / 16); // ~same speed as burstR grows
        const animate = () => {
            r = Math.min(r + step, target);
            setClipRadius(r);
            if (r < target) clipRafRef.current = requestAnimationFrame(animate);
        };
        clipRafRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => () => cancelAnimationFrame(clipRafRef.current), []);

    const [bags, setBags] = useState([]);
    const [loadingBags, setLoadingBags] = useState(true);
    const [errorBags, setErrorBags] = useState("");
    const [bagPage, setBagPage] = useState(1);
    const [bagTotalPages, setBagTotalPages] = useState(1);
    const [bagTotal, setBagTotal] = useState(0);
    const LIMIT = 12;

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collections, setCollections] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debounceRef = useRef(null);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minHeight, setMinHeight] = useState("");
    const [maxHeight, setMaxHeight] = useState("");
    const [minWidth, setMinWidth] = useState("");
    const [maxWidth, setMaxWidth] = useState("");
    const [minWeight, setMinWeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [color, setColor] = useState("");
    const [capacity, setCapacity] = useState("");
    const [expandedBag, setExpandedBag] = useState(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [catSearch, setCatSearch] = useState("");
    const [catSearchQuery, setCatSearchQuery] = useState("");
    const catDebounceRef = useRef(null);
    const [hasDiscount, setHasDiscount] = useState(false);
    const [catPage, setCatPage] = useState(1);
    const [catTotalPages, setCatTotalPages] = useState(1);
    const [catTotal, setCatTotal] = useState(0);
    const CAT_LIMIT = 12;

    const HEIGHT_RANGE = { min: 10, max: 80 };
    const WIDTH_RANGE  = { min: 10, max: 60 };
    const WEIGHT_RANGE = { min: 0,  max: 6  };

    const LOGO_SRC = (() => {
        try { return new URL("../assets/tresor_icon.png", import.meta.url).href; }
        catch { return "/tresor_icon.png"; }
    })();

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            .card-reveal-wrapper { opacity:0; transform:translateY(36px); transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
            .card-reveal-wrapper.card-revealed { opacity:1; transform:translateY(0); }
            input[type="range"] { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:rgba(201,168,106,0.2); outline:none; cursor:pointer; }
            input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#dfa94b; border:none; cursor:pointer; }
            input[type="range"]::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#dfa94b; border:none; cursor:pointer; }
            input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; }
            input[type="number"] { -moz-appearance:textfield; }
            ::-webkit-scrollbar { width:4px; }
            ::-webkit-scrollbar-track { background:transparent; }
            ::-webkit-scrollbar-thumb { background:rgba(201,168,106,0.2); }
            @keyframes spin { to { transform:rotate(360deg); } }
            .tresor-card { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1) !important; }
            .tresor-card:hover { transform:translateY(-6px) !important; }
            .tresor-card:hover .tresor-img { transform:scale(1.06) !important; }
            .cat-card:hover { transform:translateY(-4px) !important; opacity:0.88 !important; }
            @media (max-width:900px) {
                .t-hero-title  { font-size:2.6rem !important; }
                .t-grid        { grid-template-columns:repeat(2,1fr) !important; }
                .t-filter-grid { grid-template-columns:repeat(2,1fr) !important; }
                .card-reveal-wrapper { transition-delay:0ms !important; }
            }
            @media (max-width:600px) {
                .t-header      { padding:10px 14px !important; flex-wrap:nowrap !important; overflow:hidden; }
                .t-header-right { gap:8px !important; flex-wrap:nowrap !important; }
                .t-header-right button { font-size:9px !important; letter-spacing:0.08em !important; padding:5px 8px !important; white-space:nowrap !important; }
                .t-hero-wrap   { min-height:420px !important; }
                .t-hero-title  { font-size:1.9rem !important; }
                .t-filter-wrap { margin:8px !important; padding:20px 16px !important; }
                .t-filter-grid { grid-template-columns:1fr !important; gap:20px !important; }
                .t-grid        { grid-template-columns:1fr !important; padding:0 12px !important; gap:1px !important; }
                .card-reveal-wrapper { transition-delay:0ms !important; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const swipeStartX = useRef(null);
    const handleSwipeStart = (e) => { swipeStartX.current = e.touches[0].clientX; };
    const handleSwipeEnd = (e) => {
        if (swipeStartX.current === null) return;
        const diff = swipeStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) setActiveTab("categories");
        else if (diff < -50) setActiveTab("items");
        swipeStartX.current = null;
    };

    const fetchBags = async () => {
        setLoadingBags(true); setErrorBags("");
        try {
            const params = {
                page: bagPage, limit: LIMIT,
                ...(searchQuery && { search: searchQuery }),
                ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }),
                ...(minHeight && { minHeight }), ...(maxHeight && { maxHeight }),
                ...(minWidth && { minWidth }), ...(maxWidth && { maxWidth }),
                ...(minWeight && { minWeight }), ...(maxWeight && { maxWeight }),
                ...(color && { color }), ...(capacity && { capacity }),
                ...(selectedCategory && { categoryId: selectedCategory._id }),
                ...(selectedPrimaryCategory && { productCategory: selectedPrimaryCategory }),
                ...(selectedCollection && { typeId: selectedCollection._id }),
            };
            const result = await getAllBags(params);
            setBags(result.data); setBagTotalPages(result.totalPages); setBagTotal(result.total);
        } catch (err) { setErrorBags(err.message || "Failed to fetch bags"); }
        finally { setLoadingBags(false); }
    };

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const result = await getAllCategories({ page: catPage, limit: CAT_LIMIT, search: catSearchQuery, hasDiscount: hasDiscount || undefined, ...(selectedCollection && { typeId: selectedCollection._id }) });
            setCategories(result.data); setCatTotalPages(result.totalPages); setCatTotal(result.total);
        } catch {} finally { setLoadingCats(false); }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value; setSearchInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearchQuery(val), 800);
    };
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleCatSearchChange = (e) => {
        const val = e.target.value; setCatSearch(val);
        clearTimeout(catDebounceRef.current);
        catDebounceRef.current = setTimeout(() => setCatSearchQuery(val), 600);
    };

    useEffect(() => {
        getAllTypes().then(res => { if (res.success) setCollections(res.data); }).catch(() => {});
    }, []);

    useEffect(() => { setBagPage(1); }, [searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory, selectedPrimaryCategory, selectedCollection]);
    useEffect(() => { if (activeTab === "items") fetchBags(); }, [bagPage, searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory, selectedPrimaryCategory, selectedCollection, activeTab]);
    useEffect(() => { setCatPage(1); }, [catSearchQuery, hasDiscount]);
    useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [catPage, catSearchQuery, hasDiscount, selectedCollection, activeTab]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this bag?")) return;
        try { await deleteBag(id); fetchBags(); } catch (err) { alert("Failed: " + err.message); }
    };
    const handleDeleteCategory = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this category?")) return;
        try { await deleteCategory(id); fetchCategories(); } catch (err) { alert("Failed: " + err.message); }
    };
    const resetFilters = () => {
        setSearchInput(""); setSearchQuery(""); clearTimeout(debounceRef.current);
        setMinPrice(""); setMaxPrice(""); setMinHeight(""); setMaxHeight("");
        setMinWidth(""); setMaxWidth(""); setMinWeight(""); setMaxWeight("");
        setColor(""); setCapacity("");
    };
    const handleCategoryClick = (cat) => { setSelectedCategory(cat); setActiveTab("items"); };
    const resetCategoryFilter = () => { setSelectedCategory(null); resetFilters(); };

    /* Minimal pagination renderer */
    const Pagination = ({ page, totalPages, setPage }) => {
        if (totalPages <= 1) return null;
        const pageStr = String(page).padStart(2, "0");
        const totalStr = String(totalPages).padStart(2, "0");
        return (
            <div style={S.pagination}>
                <button style={{ ...S.pageArrow, opacity: page === 1 ? 0.25 : 1 }}
                    disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>←</button>
                <span style={S.pageIndicator}>{pageStr} <span style={S.pageDivider}>/</span> {totalStr}</span>
                <button style={{ ...S.pageArrow, opacity: page === totalPages ? 0.25 : 1 }}
                    disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>→</button>
            </div>
        );
    };

    return (
        <div style={S.page} onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
            <style>{`
                @keyframes pageReveal {
                    from { opacity: 0; filter: blur(8px); transform: scale(0.985); }
                    to   { opacity: 1; filter: blur(0px); transform: scale(1);     }
                }
                .page-content-wrap {
                    animation: ${pageRevealed ? "pageReveal 0.75s cubic-bezier(0.22,1,0.36,1) forwards" : "none"};
                    opacity: ${showModal && !pageRevealed ? "0" : "1"};
                }
            `}</style>

            {/* ── Type Selector Modal — rendered outside the dimmed content ── */}
            {showModal && (
                <TypeSelectorModal
                    onStart={handleModalStart}
                    onSkip={handleModalSkip}
                />
            )}

            {/* ── Floating "Choose Type" pill — outside page-content-wrap so position:fixed works ── */}
            <button
                onClick={() => setShowModal(true)}
                title="Switch category"
                style={{
                    position: "fixed",
                    bottom: 24,
                    left: 20,
                    zIndex: 200,
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(8,8,8,0.92)",
                    border: `1px solid rgba(201,168,106,${selectedPrimaryCategory ? "0.45" : "0.2"})`,
                    borderRadius: 100,
                    padding: "10px 18px 10px 14px",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: selectedPrimaryCategory ? GOLD_L : MUTED,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: selectedPrimaryCategory
                        ? "0 8px 32px rgba(201,168,106,0.18), 0 2px 8px rgba(0,0,0,0.6)"
                        : "0 4px 20px rgba(0,0,0,0.5)",
                    transition: "border-color 0.25s, color 0.25s, box-shadow 0.25s",
                    whiteSpace: "nowrap",
                }}
            >
                <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: selectedPrimaryCategory ? GOLD_D : "rgba(107,101,96,0.5)",
                    boxShadow: selectedPrimaryCategory ? `0 0 6px ${GOLD_D}` : "none",
                    transition: "background 0.25s",
                }} />
                {selectedPrimaryCategory || "All Categories"}
                <span style={{ fontSize: 7, opacity: 0.45 }}>▼</span>
            </button>

            {/* ── All page content — hidden while modal is open, revealed after ── */}
            <div className="page-content-wrap">

            <header style={S.header} className="t-header">
                <LogoWithZipper src={LOGO_SRC} />
                <div style={S.headerRight} className="t-header-right">
                    {isAdmin && (
                        <>
                            <button style={S.addBtn} onClick={() => navigate("/admin/add")}>Add Bag</button>
                            <button style={S.addBtnSecondary} onClick={() => navigate("/admin/category/add")}>Add Category</button>
                            <button style={S.logoutBtn} onClick={logout}>Logout</button>
                        </>
                    )}
                    <button style={S.cartBtn} onClick={() => navigate("/cart")} title="Shopping Bag">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                        {totalItems > 0 && <span style={S.cartBadge}>{totalItems > 99 ? "99+" : totalItems}</span>}
                    </button>
                </div>
            </header>

            {/* ── Hero ── */}
            {/* ── Static Hero Image ── */}
            <div style={{
                position: "relative",
                minHeight: 520,
                background: "#0D0A0E",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: "1400px",
            }}>
                {/* ── Radial glow ── */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse 70% 60% at 62% 38%, rgba(180,120,220,0.07), transparent)",
                    pointerEvents: "none",
                    zIndex: 0,
                }} />

                {/* ── Bottom fade ── */}
                <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 180,
                    background: "linear-gradient(to top, #0D0A0E 0%, transparent 100%)",
                    pointerEvents: "none",
                    zIndex: 0,
                }} />

                {/* ── Top edge vignette ── */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 100,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
                    pointerEvents: "none",
                    zIndex: 0,
                }} />

                {/* ── Hero text ── */}
                <section style={{
                    position: "absolute",
                    zIndex: 3,
                    textAlign: "center",
                    padding: "0 24px",
                    maxWidth: 760,
                    width: "100%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}>
                    <p style={{
                        fontSize: 10,
                        letterSpacing: "0.44em",
                        textTransform: "uppercase",
                        color: "rgba(201,168,106,0.45)",
                        margin: "0 0 20px",
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Curated luxury travel &amp; executive essentials
                    </p>
                    <h2 style={{
                        fontSize: "clamp(1.9rem, 5.5vw, 3.8rem)",
                        lineHeight: 1.04,
                        margin: "0 0 18px",
                        fontFamily: "'Cormorant Garamond', serif",
                        letterSpacing: "0.07em",
                        background: "linear-gradient(135deg,#8B6914 0%,#C9A84C 25%,#E8C96A 45%,#F5DFA0 55%,#C9A84C 75%,#8B6914 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontWeight: 700,
                    }}>
                        TRÉSOR BAGS<br />COLLECTION
                    </h2>
                    <p style={{
                        fontSize: 13,
                        color: "rgba(216,201,161,0.5)",
                        lineHeight: 1.9,
                        margin: 0,
                        fontStyle: "italic",
                        fontFamily: "'Cormorant Garamond', serif",
                        letterSpacing: "0.02em",
                    }}>
                        Premium business, travel, and luxury bags<br />designed for the modern executive.
                    </p>
                </section>

                {/* ── Hero image ── */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                }}>
                    <img
                        src={heroBagImg}
                        alt="Trésor Bags Collection"
                        style={{
                            position: "absolute",
                            height: "clamp(260px, 58vh, 440px)",
                            width: "auto",
                            maxWidth: "58%",
                            objectFit: "contain",
                            animation: "h3dFloat 6s ease-in-out infinite",
                            filter: "drop-shadow(0 44px 88px rgba(0,0,0,0.82)) drop-shadow(0 0 56px rgba(201,168,106,0.1))",
                            userSelect: "none",
                            pointerEvents: "none",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                </div>
            </div>
            <style>{`
                @keyframes h3dFloat {
                    0%,100% { transform: translateX(-50%) translateY(0px)  rotate(-0.5deg) scale(1);     }
                    25%     { transform: translateX(-50%) translateY(-18px) rotate(0.4deg)  scale(1.014); }
                    50%     { transform: translateX(-50%) translateY(-28px) rotate(1deg)    scale(1.019); }
                    75%     { transform: translateX(-50%) translateY(-12px) rotate(0.2deg)  scale(1.009); }
                }
            `}</style>

            {/* ── Tab Switcher — text-only with underline ── */}
            <div style={S.tabSwitcher}>
                <button onClick={() => setActiveTab("items")} style={{ ...S.tabBtn, ...(activeTab === "items" ? S.tabBtnActive : {}) }}>
                    ITEMS{bagTotal > 0 && <sup style={S.tabSup}>{bagTotal}</sup>}
                </button>
                <div style={S.tabDivider} />
                <button onClick={() => setActiveTab("categories")} style={{ ...S.tabBtn, ...(activeTab === "categories" ? S.tabBtnActive : {}) }}>
                    CATEGORIES{catTotal > 0 && <sup style={S.tabSup}>{catTotal}</sup>}
                </button>
            </div>
            {/* Underline indicator */}
            <div style={S.tabUnderlineTrack}>
                <div style={{ ...S.tabUnderline, left: activeTab === "items" ? "0%" : "50%" }} />
            </div>

            {/* ── Collection chips ── */}
            {collections.length > 0 && (
                <div style={{ overflowX: "auto", padding: "14px 24px 0", display: "flex", gap: 8, maxWidth: 1200, margin: "0 auto", scrollbarWidth: "none" }}>
                    <button
                        onClick={() => setSelectedCollection(null)}
                        style={{
                            padding: "5px 14px", flexShrink: 0,
                            border: `1px solid ${!selectedCollection ? "rgba(201,168,106,0.5)" : BORDER}`,
                            background: !selectedCollection ? "rgba(201,168,106,0.08)" : "transparent",
                            color: !selectedCollection ? GOLD_L : MUTED,
                            borderRadius: 100, cursor: "pointer",
                            fontFamily: SANS, fontSize: 10,
                            letterSpacing: "0.12em", textTransform: "uppercase",
                            whiteSpace: "nowrap", transition: "all 0.2s",
                        }}
                    >All</button>
                    {collections.map(col => {
                        const active = selectedCollection?._id === col._id;
                        return (
                            <button
                                key={col._id}
                                onClick={() => setSelectedCollection(active ? null : col)}
                                style={{
                                    padding: "5px 14px", flexShrink: 0,
                                    border: `1px solid ${active ? "rgba(201,168,106,0.5)" : BORDER}`,
                                    background: active ? "rgba(201,168,106,0.08)" : "transparent",
                                    color: active ? GOLD_L : MUTED,
                                    borderRadius: 100, cursor: "pointer",
                                    fontFamily: SANS, fontSize: 10,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    whiteSpace: "nowrap", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}
                            >
                                {col.logo && <img src={col.logo} alt="" style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 2, flexShrink: 0 }} />}
                                {col.title}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ══════ ITEMS TAB ══════ */}
            {activeTab === "items" && (
                <>
                    {/* Category editorial banner */}
                    {selectedCategory && (
                        <div style={S.catBanner}>
                            <div style={S.catBannerInner}>
                                <div style={S.catBannerMeta}>
                                    <p style={S.catBannerEyebrow}>Currently browsing</p>
                                    <h2 style={S.catBannerTitle}>{selectedCategory.title}</h2>
                                    {selectedCategory.discount > 0 ? (
                                        <p style={S.catBannerDiscount}>
                                            {selectedCategory.discount}% exclusive discount applied
                                        </p>
                                    ) : (
                                        <p style={S.catBannerNoDiscount}>No discount on this collection</p>
                                    )}
                                    {selectedCategory.note && (
                                        <p style={S.catBannerNote}>{selectedCategory.note}</p>
                                    )}
                                </div>
                                <button style={S.backArrowBtn} onClick={resetCategoryFilter} title="Return to all items">←</button>
                            </div>
                        </div>
                    )}

                    {/* ── Filters ── */}
                    <div style={S.filterWrap} className="t-filter-wrap">
                        <div style={S.searchRow}>
                            <div style={S.searchInputWrap}>
                                <input type="text"
                                    placeholder="Search the collection…"
                                    value={searchInput} onChange={handleSearchChange}
                                    style={S.searchInput} />
                                {searchInput !== searchQuery && <span style={S.searchSpinner} />}
                            </div>
                            <button onClick={() => setFilterOpen(o => !o)} style={S.collapseToggle}>
                                {filterOpen ? "— Less" : "+ Refine"}
                            </button>
                        </div>

                        <div style={S.collapseBody(filterOpen)}>
                            <div style={S.collapseDivider} />
                            <div style={S.filterGrid} className="t-filter-grid">
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Price  ($)</label>
                                    <div style={S.priceRow}>
                                        <input type="number" placeholder="From" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={S.priceInput} />
                                        <span style={S.dash}>–</span>
                                        <input type="number" placeholder="To" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={S.priceInput} />
                                    </div>
                                </div>
                                <SliderGroup label="Height (cm)" minVal={minHeight} maxVal={maxHeight} setMin={setMinHeight} setMax={setMaxHeight} range={HEIGHT_RANGE} unit="cm" />
                                <SliderGroup label="Width (cm)"  minVal={minWidth}  maxVal={maxWidth}  setMin={setMinWidth}  setMax={setMaxWidth}  range={WIDTH_RANGE}  unit="cm" />
                                <SliderGroup label="Weight (kg)" minVal={minWeight} maxVal={maxWeight} setMin={setMinWeight} setMax={setMaxWeight} range={WEIGHT_RANGE} unit="kg" />
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Colour</label>
                                    <input type="text" placeholder="Noir, Ivory…" value={color} onChange={(e) => setColor(e.target.value)} style={S.textInput} />
                                </div>
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Capacity</label>
                                    <input type="text" placeholder="20L, 30L…" value={capacity} onChange={(e) => setCapacity(e.target.value)} style={S.textInput} />
                                </div>
                            </div>
                            <div style={S.filterFooter}>
                                <button onClick={resetFilters} style={S.resetBtn}>Clear all</button>
                            </div>
                        </div>
                    </div>

                    {errorBags && <div style={S.errorBox}>{errorBags}</div>}

                    <Pagination page={bagPage} totalPages={bagTotalPages} setPage={setBagPage} />

                    {loadingBags ? (
                        <div style={S.loadingBox}><div style={S.spinner} /></div>
                    ) : bags.length === 0 ? (
                        <div style={S.emptyBox}>
                            <p style={S.emptyTitle}>No pieces found</p>
                            <p style={S.emptyMuted}>Refine your selection or explore our full collection.</p>
                        </div>
                    ) : (
                        <main style={S.grid} className="t-grid">
                            {bags.map((bag, index) => {
                                const qty = getQuantity(bag._id);
                                const outOfStock = (bag.stock ?? 0) <= 0;
                                return (
                                <RevealCard key={bag._id} index={index}>
                                    <div style={S.card} className="tresor-card">
                                        {isAdmin && (
                                            <div style={S.adminActions}>
                                                <button style={S.editBtn} onClick={() => navigate(`/admin/edit/${bag._id}`)}>✏️</button>
                                                <button style={S.deleteBtn} onClick={() => handleDelete(bag._id)}>🗑️</button>
                                            </div>
                                        )}
                                        {/* Image — no bounding box, bleeds into card */}
                                        <div style={S.imgWrap} onClick={() => navigate(`/gallery/${bag._id}`)}>
                                            <img src={bag.mainImage} alt={bag.title} style={S.img} className="tresor-img" />
                                            <div style={S.imgOverlay}>
                                                <span style={S.viewLabel}>Discover</span>
                                            </div>
                                        </div>

                                        <div style={S.cardBody}>
                                            {bag.categoryId?.title && (
                                                <p style={S.catBadge}>{bag.categoryId.title}</p>
                                            )}
                                            <h3 style={S.cardTitle}>{bag.title}</h3>
                                            <p style={S.cardDesc}>{bag.description?.substring(0, 80)}…</p>

                                            {/* Price */}
                                            {bag.categoryId?.discount > 0 ? (
                                                <div style={S.priceWrap}>
                                                    <span style={S.cardPriceOld}>${bag.price}</span>
                                                    <span style={S.cardPriceNew}>${(bag.price * (1 - bag.categoryId.discount / 100)).toFixed(2)}</span>
                                                    <span style={S.discountLabel}>−{bag.categoryId.discount}%</span>
                                                </div>
                                            ) : (
                                                <p style={S.cardPrice}>${bag.price}</p>
                                            )}

                                            {/* Quantity selector */}
                                            {outOfStock ? (
                                                <p style={S.outOfStock}>Out of stock</p>
                                            ) : (
                                                <div style={S.qtyRow}>
                                                    <button
                                                        style={{ ...S.qtyBtn, opacity: qty <= 0 ? 0.3 : 1 }}
                                                        onClick={(e) => { e.stopPropagation(); setQuantity(bag, qty - 1); }}
                                                        disabled={qty <= 0}
                                                    >−</button>
                                                    <span style={S.qtyNum}>{qty}</span>
                                                    <button
                                                        style={{ ...S.qtyBtn, opacity: qty >= bag.stock ? 0.3 : 1 }}
                                                        onClick={(e) => { e.stopPropagation(); setQuantity(bag, qty + 1); }}
                                                        disabled={qty >= bag.stock}
                                                    >+</button>
                                                </div>
                                            )}

                                            {/* Accordion — minimal specs grid */}
                                            <button style={S.expandBtn}
                                                onClick={() => setExpandedBag(expandedBag === bag._id ? null : bag._id)}>
                                                {expandedBag === bag._id ? "— specifications" : "+ specifications"}
                                            </button>
                                            {expandedBag === bag._id && (
                                                <div style={S.specsGrid}>
                                                    {[
                                                        ["H", `${bag.dimensions?.height || "—"} cm`],
                                                        ["W", `${bag.dimensions?.width  || "—"} cm`],
                                                        ["D", `${bag.dimensions?.depth  || "—"} cm`],
                                                        ["Wt", `${bag.weight || "—"} kg`],
                                                        ["Colour", bag.color || "—"],
                                                        ["Vol", bag.capacity || "—"],
                                                    ].map(([k, v]) => (
                                                        <div key={k} style={S.specCell}>
                                                            <span style={S.specKey}>{k}</span>
                                                            <span style={S.specVal}>{v}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </RevealCard>
                                );
                            })}
                        </main>
                    )}
                </>
            )}

            {/* ══════ CATEGORIES TAB ══════ */}
            {activeTab === "categories" && (
                <>
                    <div style={S.filterWrap} className="t-filter-wrap">
                        <div style={S.searchRow}>
                            <div style={S.searchInputWrap}>
                                <input type="text" placeholder="Search collections…"
                                    value={catSearch} onChange={handleCatSearchChange} style={S.searchInput} />
                                {catSearch !== catSearchQuery && <span style={S.searchSpinner} />}
                            </div>
                            <label style={S.discountToggle}>
                                <div style={{ ...S.roundCheck, ...(hasDiscount ? S.roundCheckActive : {}) }}
                                    onClick={() => setHasDiscount(v => !v)}>
                                    {hasDiscount && <span style={S.roundCheckMark}>✓</span>}
                                </div>
                                <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", letterSpacing: "0.08em", textTransform: "uppercase" }}>On offer</span>
                            </label>
                        </div>
                    </div>

                    <Pagination page={catPage} totalPages={catTotalPages} setPage={setCatPage} />

                    {loadingCats ? (
                        <div style={S.loadingBox}><div style={S.spinner} /></div>
                    ) : categories.length === 0 ? (
                        <div style={S.emptyBox}>
                            <p style={S.emptyTitle}>No collections found</p>
                        </div>
                    ) : (
                        <main style={S.catGrid}>
                            {categories.map((cat, index) => (
                                <RevealCard key={cat._id} index={index}>
                                    <div style={S.catCard} className="cat-card" onClick={() => handleCategoryClick(cat)}>
                                        {isAdmin && (
                                            <div style={S.adminActions}>
                                                <button style={S.editBtn} onClick={e => { e.stopPropagation(); navigate(`/admin/category/edit/${cat._id}`); }}>✏️</button>
                                                <button style={S.deleteBtn} onClick={e => handleDeleteCategory(cat._id, e)}>🗑️</button>
                                            </div>
                                        )}
                                        {/* Editorial discount headline */}
                                        {cat.discount > 0 && (
                                            <p style={S.catDiscountHeadline}>
                                                {cat.discount}
                                                <span style={S.catDiscountPct}>%</span>
                                            </p>
                                        )}
                                        <h3 style={S.catCardTitle}>{cat.title}</h3>
                                        {cat.discount > 0 && (
                                            <p style={S.catDiscountSub}>Exclusive discount on this collection</p>
                                        )}
                                        {cat.note && <p style={S.catNote}>{cat.note}</p>}
                                        <p style={S.catCardHint}>Explore →</p>
                                    </div>
                                </RevealCard>
                            ))}
                        </main>
                    )}
                </>
            )}

            </div>{/* end page-content-wrap */}
        </div>
    );
};

const S = {
    page: { minHeight: "100vh", background: BG, color: TEXT, fontFamily: SANS, paddingBottom: 80, overflowX: "hidden", position: "relative", zIndex: 1 },

    /* Header */
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", background: "rgba(7,7,7,0.96)", borderBottom: "1px solid rgba(201,168,106,0.08)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", gap: 12, flexWrap: "nowrap", overflow: "hidden" },
    headerRight: { display: "flex", alignItems: "center", gap: 16, flexWrap: "nowrap", justifyContent: "flex-end", flexShrink: 1, minWidth: 0 },
    addBtn: { background: "transparent", color: GOLD_L, border: "none", borderBottom: `1px solid rgba(229,196,138,0.4)`, padding: "4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" },
    addBtnSecondary: { background: "transparent", color: MUTED, border: "none", borderBottom: "1px solid rgba(167,161,154,0.25)", padding: "4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" },
    logoutBtn: { background: "transparent", color: MUTED, border: "none", padding: "4px 0", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" },
    cartBtn: { position: "relative", background: "none", border: "none", color: GOLD_L, cursor: "pointer", padding: "6px 8px", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center" },
    cartBadge: { position: "absolute", top: 0, right: 0, background: GOLD_D, color: "#070707", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, fontFamily: SANS, pointerEvents: "none" },

    /* Quantity selector */
    qtyRow: { display: "flex", alignItems: "center", margin: "10px 0 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,106,0.18)", borderRadius: 8, overflow: "hidden", width: "fit-content" },
    qtyBtn: { background: "none", border: "none", color: GOLD_L, cursor: "pointer", fontSize: 18, padding: "4px 14px", fontWeight: 300, lineHeight: 1, fontFamily: SERIF, transition: "opacity 0.2s" },
    qtyNum: { fontSize: 13, color: TEXT, minWidth: 28, textAlign: "center", fontFamily: SANS, padding: "4px 0", userSelect: "none" },
    outOfStock: { fontSize: 10, color: "#C9957A", letterSpacing: "0.12em", textTransform: "uppercase", margin: "10px 0 12px", fontFamily: SANS },

    /* Hero */
    heroWrap: { position: "relative", minHeight: 460, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(7,7,7,0.55) 0%,rgba(7,7,7,0.22) 40%,rgba(7,7,7,0.22) 60%,rgba(7,7,7,0.7) 100%)", zIndex: 1, pointerEvents: "none" },
    heroSection: { position: "relative", zIndex: 2, textAlign: "center", padding: "60px 24px", maxWidth: 760 },
    heroEyebrow: { fontSize: 10, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(201,168,106,0.6)", margin: "0 0 20px", fontFamily: SANS },
    heroTitle: { fontSize: "3.6rem", lineHeight: 1.04, margin: "0 0 20px", fontFamily: SERIF, letterSpacing: "0.07em", background: "linear-gradient(135deg,#8B6914 0%,#C9A84C 25%,#E8C96A 45%,#F5DFA0 55%,#C9A84C 75%,#8B6914 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 },
    heroSub: { fontSize: 14, color: "rgba(216,201,161,0.7)", lineHeight: 1.9, margin: 0, fontStyle: "italic", fontFamily: SERIF, letterSpacing: "0.02em" },

    /* Tab switcher — text only */
    tabSwitcher: { display: "flex", alignItems: "center", justifyContent: "center", gap: 48, padding: "32px 24px 0", maxWidth: 1200, margin: "0 auto", position: "relative" },
    tabBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", color: MUTED, padding: "4px 0", transition: "color 0.3s ease", fontFamily: SANS, textTransform: "uppercase", position: "relative" },
    tabBtnActive: { color: GOLD_L },
    tabSup: { fontSize: 9, verticalAlign: "super", marginLeft: 3, color: GOLD_D, fontWeight: 400 },
    tabDivider: { width: 1, height: 12, background: "rgba(201,168,106,0.2)" },
    tabUnderlineTrack: { position: "relative", maxWidth: 1200, margin: "6px auto 0", height: 1, background: "rgba(255,255,255,0.04)", overflow: "visible" },
    tabUnderline: { position: "absolute", top: 0, width: "50%", height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_L}, transparent)`, transition: "left 0.4s cubic-bezier(0.4,0,0.2,1)" },

    /* Category editorial banner */
    catBanner: { maxWidth: 1200, margin: "32px auto 0", padding: "0 16px" },
    catBannerInner: { borderTop: `1px solid ${BORDER_GOLD}`, borderBottom: `1px solid ${BORDER_GOLD}`, padding: "28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 },
    catBannerMeta: { display: "flex", flexDirection: "column", gap: 6 },
    catBannerEyebrow: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, margin: 0, fontFamily: SANS },
    catBannerTitle: { fontSize: 28, fontWeight: 400, color: TEXT, margin: 0, fontFamily: SERIF, letterSpacing: "0.06em" },
    catBannerDiscount: { fontSize: 12, color: "#C9957A", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, fontFamily: SANS },
    catBannerNoDiscount: { fontSize: 12, color: MUTED, letterSpacing: "0.08em", margin: 0, fontFamily: SANS },
    catBannerNote: { fontSize: 13, color: MUTED, fontStyle: "italic", fontFamily: SERIF, margin: 0, maxWidth: 480, lineHeight: 1.7 },
    backArrowBtn: { background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 20, flexShrink: 0, padding: 0, lineHeight: 1 },

    /* Filters */
    filterWrap: { margin: "20px auto 0", padding: "20px 24px", background: "transparent", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, maxWidth: 1200 },
    collapseToggle: { background: "none", border: "none", cursor: "pointer", fontSize: 11, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 0", fontFamily: SANS, flexShrink: 0, whiteSpace: "nowrap" },
    collapseBody: (open) => ({ overflow: "hidden", maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0, transition: "max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease" }),
    collapseDivider: { height: "1px", background: BORDER, margin: "16px 0" },
    searchRow: { display: "flex", gap: 20, alignItems: "center" },
    searchInputWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
    searchInput: { ...inputBase, padding: "10px 36px 10px 0", background: "transparent", borderLeft: "none", borderRight: "none", borderTop: "none", borderRadius: 0 },
    searchSpinner: { position: "absolute", right: 0, width: 14, height: 14, border: "1px solid rgba(201,168,106,0.2)", borderTop: `1px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", pointerEvents: "none" },
    filterGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px 32px", marginBottom: 16 },
    filterGroup: { display: "flex", flexDirection: "column", gap: 10 },
    filterLabel: { fontSize: 9, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.16em" },
    priceRow: { display: "flex", alignItems: "center", gap: 10 },
    priceInput: { ...inputBase, flex: 1, minWidth: 0, padding: "8px 0", textAlign: "center", background: "transparent", borderLeft: "none", borderRight: "none", borderTop: "none", borderRadius: 0 },
    dash: { color: MUTED, fontSize: 14, flexShrink: 0 },
    textInput: { ...inputBase, padding: "8px 0", background: "transparent", borderLeft: "none", borderRight: "none", borderTop: "none", borderRadius: 0 },
    sliderGroup: { display: "flex", flexDirection: "column", gap: 8 },
    sliderValues: { display: "flex", justifyContent: "space-between", color: MUTED, fontSize: 10, letterSpacing: "0.06em" },
    filterFooter: { display: "flex", justifyContent: "flex-end", paddingTop: 4 },
    resetBtn: { background: "none", border: "none", color: MUTED, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", padding: "4px 0", fontFamily: SANS, borderBottom: "1px solid rgba(107,101,96,0.3)" },

    /* Discount round checkbox */
    discountToggle: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 },
    roundCheck: { width: 16, height: 16, borderRadius: "50%", border: "1px solid rgba(201,168,106,0.3)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 },
    roundCheckActive: { background: GOLD_D, border: `1px solid ${GOLD_D}` },
    roundCheckMark: { color: "#070707", fontSize: 9, fontWeight: 900, lineHeight: 1 },

    /* State boxes */
    errorBox: { margin: "16px auto", padding: "12px 24px", color: "#C9957A", fontSize: 12, letterSpacing: "0.06em", maxWidth: 1200, borderLeft: "1px solid rgba(201,149,122,0.4)" },
    loadingBox: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 },
    spinner: { width: 24, height: 24, border: "1px solid rgba(255,255,255,0.06)", borderTop: `1px solid ${GOLD}`, borderRadius: "50%", animation: "spin 1s linear infinite" },
    emptyBox: { textAlign: "center", padding: "80px 24px" },
    emptyTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: "rgba(245,241,232,0.4)", margin: "0 0 8px", letterSpacing: "0.04em" },
    emptyMuted: { fontSize: 12, color: MUTED, letterSpacing: "0.06em" },

    /* Pagination — minimal arrows */
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "28px 16px" },
    pageArrow: { background: "none", border: "none", color: GOLD_L, fontSize: 18, cursor: "pointer", padding: "4px 8px", transition: "opacity 0.2s", fontFamily: SERIF },
    pageIndicator: { fontSize: 11, color: MUTED, letterSpacing: "0.18em", fontFamily: SANS },
    pageDivider: { color: "rgba(107,101,96,0.4)", margin: "0 6px" },

    /* Product grid */
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1px", padding: "0", marginBottom: 0, maxWidth: 1240, marginLeft: "auto", marginRight: "auto", background: BORDER },
    card: { background: CARD, overflow: "hidden", position: "relative", transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" },
    adminActions: { position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 10 },
    editBtn: { background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 12, color: TEXT, backdropFilter: "blur(8px)" },
    deleteBtn: { background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 12, color: "#C9957A", backdropFilter: "blur(8px)" },
    imgWrap: { position: "relative", overflow: "hidden", height: 300, cursor: "pointer", background: "#0a0a0a" },
    img: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)", display: "block" },
    imgOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 50%,rgba(7,7,7,0.85) 100%)", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: "20px", opacity: 0, transition: "opacity 0.35s ease", pointerEvents: "none" },
    viewLabel: { color: GOLD_L, fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: SANS },
    cardBody: { padding: "20px 20px 24px", borderTop: `1px solid ${BORDER}` },
    catBadge: { fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: SANS },
    cardTitle: { fontSize: 16, fontWeight: 400, color: TEXT, margin: "0 0 6px", fontFamily: SERIF, letterSpacing: "0.03em", lineHeight: 1.3 },
    cardDesc: { fontSize: 12, color: MUTED, margin: "0 0 14px", lineHeight: 1.7, minHeight: 40, fontStyle: "italic", fontFamily: SERIF },
    cardPrice: { fontSize: 18, fontWeight: 300, color: GOLD_L, margin: "0 0 16px", fontFamily: SERIF, letterSpacing: "0.04em" },
    priceWrap: { display: "flex", alignItems: "baseline", gap: 10, margin: "0 0 16px", flexWrap: "wrap" },
    cardPriceOld: { fontSize: 13, color: MUTED, textDecoration: "line-through", fontFamily: SERIF },
    cardPriceNew: { fontSize: 18, fontWeight: 300, color: GOLD_L, fontFamily: SERIF },
    discountLabel: { fontSize: 9, color: "#C9957A", letterSpacing: "0.1em", textTransform: "uppercase" },
    expandBtn: { background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", padding: "0 0 2px", borderBottom: "1px solid rgba(107,101,96,0.25)", fontFamily: SANS, display: "block", marginBottom: 14 },

    /* Specs — 3-column minimal grid */
    specsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: BORDER, borderTop: `1px solid ${BORDER}`, marginTop: 12 },
    specCell: { background: CARD, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 },
    specKey: { fontSize: 9, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase" },
    specVal: { fontSize: 12, color: TEXT, fontFamily: SERIF, fontWeight: 300 },

    /* Category grid */
    catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1px", padding: 0, marginBottom: 0, maxWidth: 1240, marginLeft: "auto", marginRight: "auto", background: BORDER },
    catCard: { background: CARD, padding: "40px 32px", cursor: "pointer", position: "relative", transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease", minHeight: 200 },
    catDiscountHeadline: { fontFamily: SERIF, fontSize: 64, fontWeight: 300, color: "rgba(201,168,106,0.12)", margin: "0 0 4px", lineHeight: 1, letterSpacing: "-0.02em" },
    catDiscountPct: { fontSize: 32, verticalAlign: "super" },
    catCardTitle: { fontSize: 22, fontWeight: 400, color: TEXT, margin: "0 0 10px", fontFamily: SERIF, letterSpacing: "0.04em" },
    catDiscountSub: { fontSize: 10, color: "#C9957A", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: SANS },
    catNote: { fontSize: 13, color: MUTED, fontStyle: "italic", fontFamily: SERIF, lineHeight: 1.7, margin: "0 0 16px", maxWidth: 320 },
    catCardHint: { fontSize: 10, color: "rgba(107,101,96,0.5)", margin: "16px 0 0", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: SANS },
};

export default BagListing;
