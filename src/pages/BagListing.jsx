import { useState, useEffect, useRef } from "react";
import heroBagImg from "../assets/hero_final1.png";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllBags, deleteBag } from "../services/bagService";
import { getAllCategories, deleteCategory } from "../services/categoryService";

/* ── Logo with animated zipper canvas overlay ── */
const LogoWithZipper = ({ src }) => {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = 320, H = 80;
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.scale(dpr, dpr);

        let t = 0, zp = 0, zd = 1;
        const sparks = [];

        const addSpark = (x, y) => sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 1.4) * 1.5,
            life: 1,
            r: Math.random() * 1.5 + 0.5,
        });

        const draw = () => {
            t += 0.016;
            zp += zd * 0.006;
            if (zp >= 1) { zp = 1; zd = -1; }
            if (zp <= 0) { zp = 0; zd = 1; }

            ctx.clearRect(0, 0, W, H);
            const zy = H - 6, zx1 = 4, zx2 = W - 4;
            const headX = zx1 + (zx2 - zx1) * zp;

            ctx.strokeStyle = "rgba(80,70,50,0.4)";
            ctx.lineWidth = 2.5; ctx.lineCap = "round";
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
            shg.addColorStop(0, "rgba(255,240,190,0)");
            shg.addColorStop(0.5, "rgba(255,240,190,0.18)");
            shg.addColorStop(1, "rgba(255,240,190,0)");
            ctx.fillStyle = shg; ctx.fillRect(0, 0, W, H - 10);

            if (Math.random() < 0.3) addSpark(headX + (Math.random() - 0.5) * 4, zy);
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.life -= 0.05;
                if (s.life <= 0) { sparks.splice(i, 1); continue; }
                ctx.save(); ctx.globalAlpha = s.life;
                ctx.fillStyle = "#e5c48a"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }

            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
            <img src={src} alt="Trésor Outlet Store"
                style={{ height: 60, width: 120, objectFit: "contain", objectPosition: "left center", display: "block", borderRadius: "300px 300px 300px 300px" }} />
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: 220, height: 40, pointerEvents: "none" }} />
        </div>
    );
};

/* ── Tokens ── */
const GOLD   = "#dfa94b";
const GOLD_L = "#E5C48A";
const BG     = "transparent";
const CARD   = "#111111";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED  = "#A7A19A";
const TEXT   = "#F5F1E8";

const inputBase = {
    background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
    borderRadius: 14, color: TEXT, fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box",
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
                const delay = (index % 3) * 90;
                el.style.transitionDelay = `${delay}ms`;
                el.classList.add("card-revealed");
                observer.unobserve(el);
            }
        }, { threshold: 0.08 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [index]);
    return <div ref={ref} className="card-reveal-wrapper">{children}</div>;
};

/* ── Ticker (scrolling text) ── */
const Ticker = ({ text, color = "#E5C48A" }) => {
    if (!text) return null;
    const repeated = `${text}   •   ${text}   •   ${text}   •   `;
    return (
        <div style={{ overflow: "hidden", width: "100%" }}>
            <div style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                animation: "tickerScroll 18s linear infinite",
                color, fontSize: 13, fontWeight: 600,
            }}>
                {repeated}
            </div>
        </div>
    );
};

/* ── HeroCanvas ── */
const HeroCanvas = () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-start", pointerEvents: "none", overflow: "hidden" }}>
        <img src={heroBagImg} alt="" style={{
            height: "100%", width: "auto", maxWidth: "55%", objectFit: "contain",
            filter: "drop-shadow(0 32px 64px rgba(0,0,0,0.85)) drop-shadow(0 0 40px rgba(201,168,106,0.18))",
            animation: "heroBagFloat 6s ease-in-out infinite",
            transformOrigin: "center bottom",
        }} />
        <style>{`
            @keyframes heroBagFloat {
                0%   { transform: translateY(0px)   rotate(-1deg)  scale(1);     }
                25%  { transform: translateY(-14px)  rotate(0.5deg) scale(1.012); }
                50%  { transform: translateY(-22px)  rotate(1.5deg) scale(1.018); }
                75%  { transform: translateY(-10px)  rotate(0.2deg) scale(1.008); }
                100% { transform: translateY(0px)    rotate(-1deg)  scale(1);     }
            }
            @keyframes tickerScroll {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-33.33%); }
            }
        `}</style>
    </div>
);

/* ── LogoWithZipper ── */
/* ══════════════════════════════════════════════════════ */
const BagListing = () => {
    const { isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    /* ── Tab: "items" | "categories" ── */
    const [activeTab, setActiveTab] = useState("items");

    /* ── Items state ── */
    const [bags, setBags] = useState([]);
    const [loadingBags, setLoadingBags] = useState(true);
    const [errorBags, setErrorBags] = useState("");
    const [bagPage, setBagPage] = useState(1);
    const [bagTotalPages, setBagTotalPages] = useState(1);
    const [bagTotal, setBagTotal] = useState(0);
    const LIMIT = 12;

    /* ── Category filter on items ── */
    const [selectedCategory, setSelectedCategory] = useState(null); // { _id, title, discount, note }

    /* ── Item filters ── */
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

    /* ── Category tab state ── */
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

    /* ── Global CSS ── */
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            .card-reveal-wrapper { opacity:0; transform:translateY(48px) scale(0.96); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); will-change:opacity,transform; }
            .card-reveal-wrapper.card-revealed { opacity:1; transform:translateY(0) scale(1); }
            input[type="range"] { -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background:rgba(223,169,75,0.2); outline:none; cursor:pointer; }
            input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:#dfa94b; border:3px solid rgba(223,169,75,0.35); box-shadow:0 0 10px rgba(223,169,75,0.4); cursor:pointer; }
            input[type="range"]::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:#dfa94b; border:3px solid rgba(223,169,75,0.35); box-shadow:0 0 10px rgba(223,169,75,0.4); cursor:pointer; }
            input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; }
            input[type="number"] { -moz-appearance:textfield; }
            ::-webkit-scrollbar { width:6px; }
            ::-webkit-scrollbar-track { background:#0a0a0a; }
            ::-webkit-scrollbar-thumb { background:rgba(223,169,75,0.3); border-radius:999px; }
            @keyframes spin { to { transform:rotate(360deg); } }
            .tresor-card:hover { transform:translateY(-5px) scale(1.01); box-shadow:0 48px 90px rgba(0,0,0,0.5) !important; }
            .tresor-card:hover .tresor-img { transform:scale(1.05); }
            .cat-card:hover { transform:translateY(-4px); box-shadow:0 32px 70px rgba(0,0,0,0.45) !important; border-color:rgba(229,196,138,0.25) !important; }
            .tab-btn:hover { background:rgba(229,196,138,0.08) !important; }
            @media (max-width:900px) {
                .t-hero-title  { font-size:2.8rem !important; }
                .t-grid        { grid-template-columns:repeat(2,1fr) !important; }
                .t-filter-grid { grid-template-columns:repeat(2,1fr) !important; }
                .card-reveal-wrapper { transition-delay:0ms !important; }
            }
            @media (max-width:600px) {
                .t-header      { padding:14px 16px !important; }
                .t-hero-wrap   { min-height:380px !important; }
                .t-hero-title  { font-size:1.9rem !important; letter-spacing:0.03em !important; }
                .t-hero-sub    { font-size:13px !important; }
                .t-filter-wrap { margin:10px !important; padding:16px !important; border-radius:16px !important; }
                .t-filter-grid { grid-template-columns:1fr !important; gap:14px !important; }
                .t-grid        { grid-template-columns:1fr !important; padding:0 10px !important; gap:16px !important; }
                .t-pagination  { gap:6px !important; padding:24px 10px !important; }
                .t-page-btn    { padding:8px 10px !important; font-size:11px !important; }
                .t-badge       { display:none !important; }
                .card-reveal-wrapper { transition-delay:0ms !important; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    /* ── Global swipe handler (whole page) ── */
    useEffect(() => {
        let startX = null;
        const onStart = (e) => { startX = e.touches[0].clientX; };
        const onEnd = (e) => {
            if (startX === null) return;
            const diff = startX - e.changedTouches[0].clientX;
            if (diff > 60) setActiveTab("categories");
            if (diff < -60) setActiveTab("items");
            startX = null;
        };
        document.addEventListener("touchstart", onStart, { passive: true });
        document.addEventListener("touchend", onEnd, { passive: true });
        return () => {
            document.removeEventListener("touchstart", onStart);
            document.removeEventListener("touchend", onEnd);
        };
    }, []);

    /* ── Fetch bags ── */
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
            };
            const result = await getAllBags(params);
            setBags(result.data); setBagTotalPages(result.totalPages); setBagTotal(result.total);
        } catch (err) { setErrorBags(err.message || "Failed to fetch bags"); }
        finally { setLoadingBags(false); }
    };

    /* ── Fetch categories ── */
    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const result = await getAllCategories({ page: catPage, limit: CAT_LIMIT, search: catSearchQuery, hasDiscount: hasDiscount || undefined });
            setCategories(result.data); setCatTotalPages(result.totalPages); setCatTotal(result.total);
        } catch {}
        finally { setLoadingCats(false); }
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

    useEffect(() => { setBagPage(1); }, [searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory]);
    useEffect(() => { if (activeTab === "items") fetchBags(); }, [bagPage, searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory, activeTab]);

    useEffect(() => { setCatPage(1); }, [catSearchQuery, hasDiscount]);
    useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [catPage, catSearchQuery, hasDiscount, activeTab]);

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

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        setActiveTab("items");
    };

    const resetCategoryFilter = () => {
        setSelectedCategory(null);
        resetFilters();
    };

    return (
        <div style={S.page}>

            {/* ── Header ── */}
            <header style={S.header} className="t-header">
                <LogoWithZipper src={LOGO_SRC} />
                <div style={S.headerRight}>
                    {isAdmin && (
                        <>
                            <span style={S.adminBadge} className="t-badge">Admin</span>
                            <button style={S.addBtn} onClick={() => navigate("/admin/add")}>+ Add Bag</button>
                            <button style={{ ...S.addBtn, background: "rgba(229,196,138,0.12)", color: GOLD_L, border: `1px solid rgba(229,196,138,0.3)` }} onClick={() => navigate("/admin/category/add")}>+ Add Category</button>
                            <button style={S.logoutBtn} onClick={logout}>Logout</button>
                        </>
                    )}
                </div>
            </header>

            {/* ── Hero ── */}
            <div style={S.heroWrap} className="t-hero-wrap">
                <HeroCanvas />
                <div style={S.heroOverlay} />
                <section style={S.heroSection}>
                    <p style={S.heroEyebrow}>Curated luxury travel &amp; executive essentials</p>
                    <h2 style={S.heroTitle} className="t-hero-title">TRÉSOR BAGS COLLECTION</h2>
                    <p style={S.heroSub} className="t-hero-sub">Premium business, travel, and luxury bags designed for the modern executive.</p>
                </section>
            </div>

            {/* ── Tab Switcher ── */}
            <div style={S.tabSwitcher}>
                <div style={S.tabTrack}>
                    <button
                        className="tab-btn"
                        onClick={() => setActiveTab("items")}
                        style={{ ...S.tabBtn, ...(activeTab === "items" ? S.tabBtnActive : {}) }}
                    >
                        <span style={S.tabIcon}>🎒</span> Items
                        {activeTab === "items" && bagTotal > 0 && <span style={S.tabCount}>{bagTotal}</span>}
                    </button>
                    <button
                        className="tab-btn"
                        onClick={() => setActiveTab("categories")}
                        style={{ ...S.tabBtn, ...(activeTab === "categories" ? S.tabBtnActive : {}) }}
                    >
                        <span style={S.tabIcon}>🏷️</span> Categories
                        {activeTab === "categories" && catTotal > 0 && <span style={S.tabCount}>{catTotal}</span>}
                    </button>
                </div>
                <div style={{ ...S.tabIndicator, left: activeTab === "items" ? "2px" : "50%" }} />
            </div>

            {/* ══════════ ITEMS TAB ══════════ */}
            {activeTab === "items" && (
                <>
                    {/* Category banner */}
                    {selectedCategory && (
                        <div style={S.catBanner}>
                            <div style={S.catBannerLeft}>
                                <div style={S.catBannerRow}>
                                    <span style={S.catBannerTitle}>{selectedCategory.title}</span>
                                    <button style={S.backArrowBtn} onClick={resetCategoryFilter} title="Back to all items">←</button>
                                </div>
                                <span style={S.catBannerDiscount}>
                                    {selectedCategory.discount > 0
                                        ? `${selectedCategory.discount}% discount`
                                        : "No discount on this category"}
                                </span>
                                {selectedCategory.note && (
                                    <div style={S.catBannerNoteTicker}>
                                        <Ticker text={selectedCategory.note} color={MUTED} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Filters ── */}
                    <div style={S.filterWrap} className="t-filter-wrap">
                        <div style={S.searchRow}>
                            <div style={S.searchInputWrap}>
                                <input type="text" placeholder="Search by title or description…"
                                    value={searchInput} onChange={handleSearchChange} style={S.searchInput} />
                                {searchInput !== searchQuery && <span style={S.searchSpinner} />}
                            </div>
                            <button onClick={() => setFilterOpen(o => !o)} style={S.collapseToggle}>
                                <span style={S.collapseToggleIcon(filterOpen)}>⌃</span>
                                <span>{filterOpen ? "Hide Filters" : "Show Filters"}</span>
                            </button>
                        </div>

                        <div style={S.collapseBody(filterOpen)}>
                            <div style={S.collapseDivider} />
                            <div style={S.filterGrid} className="t-filter-grid">
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Price Range ($)</label>
                                    <div style={S.priceRow}>
                                        <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={S.priceInput} />
                                        <span style={S.dash}>—</span>
                                        <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={S.priceInput} />
                                    </div>
                                </div>
                                <SliderGroup label="Height (cm)" minVal={minHeight} maxVal={maxHeight} setMin={setMinHeight} setMax={setMaxHeight} range={HEIGHT_RANGE} unit="cm" />
                                <SliderGroup label="Width (cm)"  minVal={minWidth}  maxVal={maxWidth}  setMin={setMinWidth}  setMax={setMaxWidth}  range={WIDTH_RANGE}  unit="cm" />
                                <SliderGroup label="Weight (kg)" minVal={minWeight} maxVal={maxWeight} setMin={setMinWeight} setMax={setMaxWeight} range={WEIGHT_RANGE} unit="kg" />
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Color</label>
                                    <input type="text" placeholder="e.g., Black, Red" value={color} onChange={(e) => setColor(e.target.value)} style={S.textInput} />
                                </div>
                                <div style={S.filterGroup}>
                                    <label style={S.filterLabel}>Capacity</label>
                                    <input type="text" placeholder="e.g., 20L, 30L" value={capacity} onChange={(e) => setCapacity(e.target.value)} style={S.textInput} />
                                </div>
                            </div>
                            <div style={S.filterFooter}>
                                <span style={S.resultCount}>{bagTotal} bag{bagTotal !== 1 ? "s" : ""} found</span>
                                <button onClick={resetFilters} style={S.resetBtn}>Reset Filters</button>
                            </div>
                        </div>

                        {!filterOpen && (
                            <div style={{ padding: "10px 0 2px", display: "flex", justifyContent: "space-between" }}>
                                <span style={S.resultCount}>{bagTotal} bag{bagTotal !== 1 ? "s" : ""} found</span>
                            </div>
                        )}
                    </div>

                    {errorBags && <div style={S.errorBox}>{errorBags}</div>}

                    {bagTotalPages > 1 && (
                        <div style={S.pagination} className="t-pagination">
                            <button className="t-page-btn" onClick={() => setBagPage(p => Math.max(1, p - 1))} disabled={bagPage === 1} style={{ ...S.pageBtn, opacity: bagPage === 1 ? 0.4 : 1 }}>← Prev</button>
                            {Array.from({ length: bagTotalPages }, (_, i) => i + 1).slice(Math.max(0, bagPage - 3), Math.min(bagTotalPages, bagPage + 3)).map(p => (
                                <button key={p} className="t-page-btn" onClick={() => setBagPage(p)} style={{ ...S.pageBtn, ...(p === bagPage ? S.pageActive : {}) }}>{p}</button>
                            ))}
                            <button className="t-page-btn" onClick={() => setBagPage(p => Math.min(bagTotalPages, p + 1))} disabled={bagPage === bagTotalPages} style={{ ...S.pageBtn, opacity: bagPage === bagTotalPages ? 0.4 : 1 }}>Next →</button>
                        </div>
                    )}

                    {loadingBags ? (
                        <div style={S.loadingBox}><div style={S.spinner} /><p style={{ color: MUTED, marginTop: 16 }}>Loading bags…</p></div>
                    ) : bags.length === 0 ? (
                        <div style={S.emptyBox}><p style={{ fontSize: 40, marginBottom: 12 }}>🎒</p><p style={{ color: MUTED }}>No bags found. Try adjusting your filters.</p></div>
                    ) : (
                        <main style={S.grid} className="t-grid">
                            {bags.map((bag, index) => (
                                <RevealCard key={bag._id} index={index}>
                                    <div style={S.card} className="tresor-card">
                                        {isAdmin && (
                                            <div style={S.adminActions}>
                                                <button style={S.editBtn} onClick={() => navigate(`/admin/edit/${bag._id}`)}>✏️</button>
                                                <button style={S.deleteBtn} onClick={() => handleDelete(bag._id)}>🗑️</button>
                                            </div>
                                        )}
                                        <div style={S.imgWrap} onClick={() => navigate(`/gallery/${bag._id}`)}>
                                            <img src={bag.mainImage} alt={bag.title} style={S.img} className="tresor-img" />
                                            <div style={S.imgOverlay}><span style={S.viewLabel}>View Details</span></div>
                                        </div>
                                        <div style={S.cardBody}>
                                            <h3 style={S.cardTitle}>{bag.title}</h3>
                                            <p style={S.cardDesc}>{bag.description?.substring(0, 72)}…</p>
                                            <p style={S.cardPrice}>${bag.price}</p>
                                            <button style={S.expandBtn} onClick={() => setExpandedBag(expandedBag === bag._id ? null : bag._id)}>
                                                {expandedBag === bag._id ? "View Less ▲" : "View More ▼"}
                                            </button>
                                            {expandedBag === bag._id && (
                                                <div style={S.details}>
                                                    {[["Height", `${bag.dimensions?.height || "N/A"} cm`], ["Width", `${bag.dimensions?.width || "N/A"} cm`], ["Depth", `${bag.dimensions?.depth || "N/A"} cm`], ["Weight", `${bag.weight || "N/A"} kg`], ["Color", bag.color], ["Capacity", bag.capacity || "N/A"]].map(([k, v]) => (
                                                        <div key={k} style={S.detailRow}><span style={S.detailKey}>{k}</span><span style={S.detailVal}>{v}</span></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </RevealCard>
                            ))}
                        </main>
                    )}
                </>
            )}

            {/* ══════════ CATEGORIES TAB ══════════ */}
            {activeTab === "categories" && (
                <>
                    {/* Category search + discount filter */}
                    <div style={S.filterWrap} className="t-filter-wrap">
                        <div style={S.searchRow}>
                            <div style={S.searchInputWrap}>
                                <input type="text" placeholder="Search categories…"
                                    value={catSearch} onChange={handleCatSearchChange} style={S.searchInput} />
                                {catSearch !== catSearchQuery && <span style={S.searchSpinner} />}
                            </div>
                            {/* Round checkbox — has discount */}
                            <label style={S.discountToggle}>
                                <div style={{ ...S.roundCheck, ...(hasDiscount ? S.roundCheckActive : {}) }}
                                    onClick={() => setHasDiscount(v => !v)}>
                                    {hasDiscount && <span style={S.roundCheckMark}>✓</span>}
                                </div>
                                <span style={{ fontSize: 13, color: MUTED, whiteSpace: "nowrap" }}>With discount</span>
                            </label>
                        </div>
                        <div style={{ padding: "10px 0 2px" }}>
                            <span style={S.resultCount}>{catTotal} categor{catTotal !== 1 ? "ies" : "y"} found</span>
                        </div>
                    </div>

                    {catTotalPages > 1 && (
                        <div style={S.pagination} className="t-pagination">
                            <button className="t-page-btn" onClick={() => setCatPage(p => Math.max(1, p - 1))} disabled={catPage === 1} style={{ ...S.pageBtn, opacity: catPage === 1 ? 0.4 : 1 }}>← Prev</button>
                            {Array.from({ length: catTotalPages }, (_, i) => i + 1).slice(Math.max(0, catPage - 3), Math.min(catTotalPages, catPage + 3)).map(p => (
                                <button key={p} className="t-page-btn" onClick={() => setCatPage(p)} style={{ ...S.pageBtn, ...(p === catPage ? S.pageActive : {}) }}>{p}</button>
                            ))}
                            <button className="t-page-btn" onClick={() => setCatPage(p => Math.min(catTotalPages, p + 1))} disabled={catPage === catTotalPages} style={{ ...S.pageBtn, opacity: catPage === catTotalPages ? 0.4 : 1 }}>Next →</button>
                        </div>
                    )}

                    {loadingCats ? (
                        <div style={S.loadingBox}><div style={S.spinner} /><p style={{ color: MUTED, marginTop: 16 }}>Loading categories…</p></div>
                    ) : categories.length === 0 ? (
                        <div style={S.emptyBox}><p style={{ fontSize: 40, marginBottom: 12 }}>🏷️</p><p style={{ color: MUTED }}>No categories found.</p></div>
                    ) : (
                        <main style={S.catGrid}>
                            {categories.map((cat, index) => (
                                <RevealCard key={cat._id} index={index}>
                                    <div
                                        style={S.catCard}
                                        className="cat-card"
                                        onClick={() => handleCategoryClick(cat)}
                                    >
                                        {/* Admin actions */}
                                        {isAdmin && (
                                            <div style={S.adminActions}>
                                                <button style={S.editBtn} onClick={e => { e.stopPropagation(); navigate(`/admin/category/edit/${cat._id}`); }}>✏️</button>
                                                <button style={S.deleteBtn} onClick={e => handleDeleteCategory(cat._id, e)}>🗑️</button>
                                            </div>
                                        )}
                                        {/* Title */}
                                        <h3 style={S.catCardTitle}>{cat.title}</h3>
                                        {/* Discount ticker */}
                                        <div style={S.catDiscountTicker}>
                                            <Ticker
                                                text={cat.discount > 0 ? `${cat.discount}% DISCOUNT` : "No discount"}
                                                color={cat.discount > 0 ? "#FF6B6B" : MUTED}
                                            />
                                        </div>
                                        {/* Note ticker */}
                                        {cat.note && (
                                            <div style={S.catNoteTicker}>
                                                <Ticker text={cat.note} color={MUTED} />
                                            </div>
                                        )}
                                        <p style={S.catCardHint}>Click to view bags →</p>
                                    </div>
                                </RevealCard>
                            ))}
                        </main>
                    )}
                </>
            )}
        </div>
    );
};

const S = {
    page: { minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter',sans-serif", paddingBottom: 60, overflowX: "hidden", position: "relative", zIndex: 1 },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", background: "rgba(7,7,7,0.94)", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", gap: 12 },
    headerRight: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
    adminBadge: { background: "rgba(223,169,75,0.12)", color: GOLD_L, padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid rgba(223,169,75,0.22)`, whiteSpace: "nowrap" },
    addBtn: { background: `linear-gradient(135deg,#C9A86A,${GOLD_L})`, color: "#070707", border: "none", padding: "9px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
    logoutBtn: { background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, padding: "9px 30px", borderRadius: 999, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },

    heroWrap: { position: "relative", minHeight: 460, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(7,7,7,0.55) 0%,rgba(7,7,7,0.22) 40%,rgba(7,7,7,0.22) 60%,rgba(7,7,7,0.7) 100%)", zIndex: 1, pointerEvents: "none" },
    heroSection: { position: "relative", zIndex: 2, textAlign: "center", padding: "60px 24px", maxWidth: 760 },
    heroEyebrow: { fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(201,168,106,0.75)", margin: "0 0 16px" },
    heroTitle: { fontSize: "3.6rem", lineHeight: 1.04, margin: "0 0 16px", fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.07em", background: "linear-gradient(135deg,#8B6914 0%,#C9A84C 25%,#E8C96A 45%,#F5DFA0 55%,#C9A84C 75%,#8B6914 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textShadow: "none", fontWeight: 700 },
    heroSub: { fontSize: 15, color: "#D8C9A1", lineHeight: 1.8, margin: 0, textShadow: "0 1px 10px rgba(0,0,0,0.6)" },

    /* Tab switcher */
    tabSwitcher: { position: "relative", margin: "20px auto 0", maxWidth: 1200, padding: "0 16px" },
    tabTrack: { display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: `1px solid ${BORDER}`, padding: 4, gap: 2, position: "relative" },
    tabBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", borderRadius: 12, border: "none", background: "transparent", color: MUTED, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.25s ease", letterSpacing: "0.04em" },
    tabBtnActive: { background: "rgba(229,196,138,0.12)", color: GOLD_L, border: `1px solid rgba(229,196,138,0.25)` },
    tabIcon: { fontSize: 16 },
    tabCount: { background: "rgba(229,196,138,0.15)", color: GOLD_L, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
    tabIndicator: { position: "absolute", bottom: -2, height: 2, width: "50%", background: `linear-gradient(90deg,transparent,${GOLD_L},transparent)`, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", pointerEvents: "none" },

    /* Category banner */
    catBanner: { margin: "16px auto 0", maxWidth: 1200, padding: "0 16px" },
    catBannerLeft: { background: "rgba(16,16,16,0.97)", borderRadius: 16, border: `1px solid rgba(229,196,138,0.18)`, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 6 },
    catBannerRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    catBannerTitle: { fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.06em" },
    backArrowBtn: { background: "rgba(229,196,138,0.1)", border: `1px solid rgba(229,196,138,0.3)`, color: GOLD_L, borderRadius: 999, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    catBannerDiscount: { fontSize: 14, fontWeight: 700, color: "#FF6B6B" },
    catBannerNoteTicker: { overflow: "hidden", marginTop: 4 },

    /* Filters */
    filterWrap: { margin: "16px auto 0", padding: "20px", background: "rgba(16,16,16,0.97)", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 24px 60px rgba(0,0,0,0.22)", maxWidth: 1200 },
    collapseToggle: { display: "flex", alignItems: "center", gap: 7, padding: "12px 20px", borderRadius: 12, cursor: "pointer", background: "rgba(229,196,138,0.07)", border: `1px solid rgba(229,196,138,0.25)`, color: GOLD_L, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.25s ease" },
    collapseToggleIcon: (open) => ({ display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", fontSize: 16, lineHeight: 1 }),
    collapseBody: (open) => ({ overflow: "hidden", maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0, transition: "max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease" }),
    collapseDivider: { height: 1, background: `linear-gradient(90deg,transparent,rgba(229,196,138,0.2),transparent)`, margin: "16px 0" },
    searchRow: { display: "flex", gap: 10, marginBottom: 0, alignItems: "center" },
    searchInputWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
    searchInput: { ...inputBase, padding: "14px 44px 14px 18px", borderRadius: 14, fontSize: 14 },
    searchSpinner: { position: "absolute", right: 14, width: 16, height: 16, border: "2px solid rgba(223,169,75,0.2)", borderTop: `2px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", pointerEvents: "none" },
    filterGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 },
    filterGroup: { display: "flex", flexDirection: "column", gap: 8 },
    filterLabel: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" },
    priceRow: { display: "flex", alignItems: "center", gap: 8 },
    priceInput: { ...inputBase, flex: 1, minWidth: 0, padding: "12px 10px", textAlign: "center" },
    dash: { color: "#5C5A55", fontSize: 18, flexShrink: 0 },
    textInput: { ...inputBase, padding: "12px 14px" },
    sliderGroup: { display: "flex", flexDirection: "column", gap: 8 },
    sliderValues: { display: "flex", justifyContent: "space-between", color: MUTED, fontSize: 11 },
    filterFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 4 },
    resultCount: { color: MUTED, fontSize: 12 },
    resetBtn: { background: "transparent", color: GOLD_L, border: `1px solid rgba(229,196,138,0.4)`, borderRadius: 999, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" },

    /* Discount round checkbox */
    discountToggle: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 },
    roundCheck: { width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(229,196,138,0.4)`, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 },
    roundCheckActive: { background: `linear-gradient(135deg,#C9A86A,${GOLD_L})`, border: "none" },
    roundCheckMark: { color: "#070707", fontSize: 13, fontWeight: 900, lineHeight: 1 },

    /* Bag grid */
    errorBox: { margin: "16px auto", padding: 16, background: "rgba(184,58,58,0.1)", color: TEXT, borderRadius: 14, border: "1px solid rgba(184,58,58,0.22)", fontSize: 13, maxWidth: 1200 },
    loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 },
    spinner: { width: 40, height: 40, border: "4px solid rgba(255,255,255,0.08)", borderTop: `4px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    emptyBox: { textAlign: "center", padding: "60px 24px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24, padding: "16px 16px 0", marginBottom: 40, maxWidth: 1240, marginLeft: "auto", marginRight: "auto" },
    card: { background: CARD, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", position: "relative", transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease", border: `1px solid ${BORDER}` },
    adminActions: { position: "absolute", top: 14, right: 14, display: "flex", gap: 8, zIndex: 10 },
    editBtn: { background: "rgba(255,255,255,0.1)", border: `1px solid rgba(229,196,138,0.2)`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 13, color: TEXT },
    deleteBtn: { background: "rgba(184,58,58,0.12)", border: "1px solid rgba(184,58,58,0.25)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 13, color: TEXT },
    imgWrap: { position: "relative", overflow: "hidden", height: 260, cursor: "pointer" },
    img: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)", display: "block" },
    imgOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.75))", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 20, pointerEvents: "none" },
    viewLabel: { color: TEXT, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 20px", borderRadius: 999, background: "rgba(223,169,75,0.22)", border: `1px solid rgba(223,169,75,0.3)` },
    cardBody: { padding: "20px 20px 24px" },
    cardTitle: { fontSize: 17, fontWeight: 700, color: TEXT, margin: "0 0 8px" },
    cardDesc: { fontSize: 13, color: MUTED, margin: "0 0 12px", lineHeight: 1.6, minHeight: 42 },
    cardPrice: { fontSize: 20, fontWeight: 800, color: GOLD_L, margin: "0 0 14px" },
    expandBtn: { width: "100%", padding: "11px", background: "rgba(255,255,255,0.03)", color: TEXT, border: `1px solid rgba(229,196,138,0.18)`, borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "background 0.2s" },
    details: { marginTop: 14, padding: 16, background: "rgba(255,255,255,0.025)", borderRadius: 12, border: `1px solid ${BORDER}` },
    detailRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 },
    detailKey: { fontWeight: 700, color: "#D8C9A1" },
    detailVal: { color: MUTED },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "24px 16px", flexWrap: "wrap" },
    pageBtn: { padding: "10px 14px", background: "rgba(255,255,255,0.04)", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s" },
    pageActive: { background: GOLD_L, color: "#070707", borderColor: GOLD_L },

    /* Category grid */
    catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24, padding: "16px 16px 0", marginBottom: 40, maxWidth: 1240, marginLeft: "auto", marginRight: "auto" },
    catCard: { background: CARD, borderRadius: 20, padding: "28px 24px", border: `1px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", cursor: "pointer", position: "relative", transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.3s ease", overflow: "hidden", minHeight: 160 },
    catCardTitle: { fontSize: 22, fontWeight: 800, color: TEXT, margin: "0 0 14px", fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.05em", paddingRight: 80 },
    catDiscountTicker: { overflow: "hidden", marginBottom: 8 },
    catNoteTicker: { overflow: "hidden", marginBottom: 8 },
    catCardHint: { fontSize: 11, color: "rgba(167,161,154,0.5)", margin: "12px 0 0", fontStyle: "italic" },
};

export default BagListing;
