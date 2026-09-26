import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { getAllBags, deleteBag } from "../services/bagService";
import { getAllTypes, deleteType } from "../services/typeService";
import { getAllCollections } from "../services/collectionService";
import { sized } from "../utils/image";
import TypeSelectorModal from "../components/TypeSelectorModal";
import ShopAssistant from "../components/ShopAssistant";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";
import Reveal from "../components/storefront/Reveal";
import {
    Sparkle, MagnifyingGlass, SlidersHorizontal, Plus, Minus, PencilSimple, Trash, ArrowLeft, CaretDown,
} from "@phosphor-icons/react";

// Served from /public so index.html can preload it.
const heroBagImg = "/hero_final1.webp";
const CATEGORIES = ["Luggage", "Backpacks", "Bags", "Accessories"];
const money = (n) => `$${Number(n).toLocaleString("en-US", Number.isInteger(Number(n)) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── Range slider (filters) ── */
const SliderGroup = ({ label, minVal, maxVal, setMin, setMax, range, unit }) => (
    <div className="sf-field">
        <span className="sf-label">{label}</span>
        <div style={{ display: "grid", gap: 10 }}>
            <input type="range" className="sf-range" aria-label={`${label} minimum`} min={range.min} max={maxVal || range.max} value={minVal || range.min}
                onChange={(e) => { const v = e.target.value; setMin(v); if (maxVal && Number(v) > Number(maxVal)) setMax(v); }} />
            <input type="range" className="sf-range" aria-label={`${label} maximum`} min={minVal || range.min} max={range.max} value={maxVal || range.max}
                onChange={(e) => { const v = e.target.value; setMax(v); if (minVal && Number(v) < Number(minVal)) setMin(v); }} />
        </div>
        <div className="sf-faint sf-num" style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>{minVal || range.min} {unit}</span><span>{maxVal || range.max} {unit}</span>
        </div>
    </div>
);

/* ══════════════════════════════════════════ */
const BagListing = () => {
    const { isAdmin, logout } = useAuth();
    const { getQuantity, setQuantity } = useCart();
    const navigate = useNavigate();

    /* ── Category selector modal ── */
    const alreadySeen = sessionStorage.getItem('tresor-modal-seen') === '1';
    const savedCategory = sessionStorage.getItem('tresor-selected-category') || null;
    // Set when a bag was opened from the assistant, so coming back reopens it where it was.
    const [askReturn] = useState(() => sessionStorage.getItem('tresor-ask-return'));
    const [showModal, setShowModal]                       = useState(!alreadySeen || askReturn === 'modal');
    const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState(savedCategory);
    const [pageRevealed, setPageRevealed]                 = useState(alreadySeen && askReturn !== 'modal');
    // Blur-in only right after the modal closes; a normal visit shows the page as is.
    const [animateReveal, setAnimateReveal]               = useState(false);

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
        setAnimateReveal(true);
        setTimeout(() => setPageRevealed(true), 650);
    };

    const handleModalStart = (cat) => {
        setSelectedPrimaryCategory(cat.title);
        setSelectedCollection(null);
        sessionStorage.setItem('tresor-selected-category', cat.title);
        revealPage();
    };
    // A bag picked from the assistant's answer: skip the modal next time and open it.
    const openBag = (id, from) => {
        sessionStorage.setItem('tresor-ask-return', from);
        if (from === 'listing') sessionStorage.setItem('tresor-modal-seen', '1');
        navigate(`/gallery/${id}`);
    };
    const [askOpen, setAskOpen] = useState(askReturn === 'listing');
    const askRef = useRef(null);
    useEffect(() => {
        sessionStorage.removeItem('tresor-ask-return');
        // Back from a bag opened in the search-bar assistant: scroll to it (after the page's scroll-to-top).
        if (askReturn === 'listing') setTimeout(() => askRef.current?.scrollIntoView({ block: "center" }), 100);
    }, [askReturn]);

    const handleModalSkip = () => {
        setSelectedPrimaryCategory(null);
        setSelectedCollection(null);
        sessionStorage.removeItem('tresor-selected-category');
        revealPage();
    };

    const [activeTab, setActiveTab] = useState("items");

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
    const [filterOpen, setFilterOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);

    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [catSearch, setCatSearch] = useState("");
    const [catSearchQuery, setCatSearchQuery] = useState("");
    const catDebounceRef = useRef(null);
    const [hasDiscount, setHasDiscount] = useState(false);
    const [catPage, setCatPage] = useState(1);
    const [, setCatTotalPages] = useState(1);
    const [catTotal, setCatTotal] = useState(0);

    const HEIGHT_RANGE = { min: 10, max: 80 };
    const WIDTH_RANGE  = { min: 10, max: 60 };
    const WEIGHT_RANGE = { min: 0,  max: 6  };

    const [heroLoaded, setHeroLoaded] = useState(false);
    const shopRef = useRef(null);
    const scrollToShop = () => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const openAssistant = () => { setActiveTab("items"); setAskOpen(true); setTimeout(() => askRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); };
    const pickPrimaryCategory = (cat) => {
        setSelectedPrimaryCategory(cat);
        if (cat) sessionStorage.setItem('tresor-selected-category', cat);
        else sessionStorage.removeItem('tresor-selected-category');
    };

    const adminMenuRef = useRef(null);
    useEffect(() => {
        if (!adminMenuOpen) return;
        const onDown = (e) => { if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) setAdminMenuOpen(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
    }, [adminMenuOpen]);

    const swipeStart = useRef(null);
    const handleSwipeStart = (e) => {
        // Ignore gestures that begin inside a horizontal scroller (e.g. the
        // collection chips) — scrolling those shouldn't switch tabs.
        if (e.target.closest && e.target.closest(".no-tab-swipe")) { swipeStart.current = null; return; }
        swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleSwipeEnd = (e) => {
        if (!swipeStart.current) return;
        const dx = e.changedTouches[0].clientX - swipeStart.current.x;
        const dy = e.changedTouches[0].clientY - swipeStart.current.y;
        swipeStart.current = null;
        // Only switch tabs on a clearly horizontal swipe — ignore vertical scrolls
        // that happen to drift sideways.
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
        if (dx < 0) setActiveTab("categories");   // swipe left → Types
        else setActiveTab("items");               // swipe right → Items
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
                ...(selectedCategory && { typeId: selectedCategory._id }),
                ...(selectedPrimaryCategory && { category: selectedPrimaryCategory }),
                ...(selectedCollection && { collectionId: selectedCollection._id }),
            };
            const result = await getAllBags(params);
            setBags(result.data); setBagTotalPages(result.totalPages); setBagTotal(result.total);
        } catch (err) { setErrorBags(err.message || "Failed to fetch bags"); }
        finally { setLoadingBags(false); }
    };

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const result = await getAllTypes({ search: catSearchQuery || undefined, ...(selectedPrimaryCategory && { category: selectedPrimaryCategory }) });
            let data = result.data || [];
            if (hasDiscount) data = data.filter(t => t.discount > 0);
            setCategories(data); setCatTotalPages(1); setCatTotal(data.length);
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
        getAllCollections().then(res => { if (res.success) setCollections(res.data); }).catch(() => {});
    }, []);

    useEffect(() => { setBagPage(1); }, [searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory, selectedPrimaryCategory, selectedCollection]);
    useEffect(() => { if (activeTab === "items") fetchBags(); }, [bagPage, searchQuery, minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity, selectedCategory, selectedPrimaryCategory, selectedCollection, activeTab]);
    useEffect(() => { setCatPage(1); }, [catSearchQuery, hasDiscount]);
    useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [catPage, catSearchQuery, hasDiscount, selectedPrimaryCategory, activeTab]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this bag?")) return;
        try { await deleteBag(id); fetchBags(); } catch (err) { alert("Failed: " + err.message); }
    };
    const handleDeleteCategory = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this type?")) return;
        try { await deleteType(id); fetchCategories(); } catch (err) { alert("Failed: " + err.message); }
    };
    const resetFilters = () => {
        setSearchInput(""); setSearchQuery(""); clearTimeout(debounceRef.current);
        setMinPrice(""); setMaxPrice(""); setMinHeight(""); setMaxHeight("");
        setMinWidth(""); setMaxWidth(""); setMinWeight(""); setMaxWeight("");
        setColor(""); setCapacity("");
    };
    const handleCategoryClick = (cat) => { setSelectedCategory(cat); setActiveTab("items"); };
    const resetCategoryFilter = () => { setSelectedCategory(null); resetFilters(); };


    const pagination = (page, totalPages, setPage) => {
        if (totalPages <= 1) return null;
        return (
            <nav aria-label="Pages" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 48 }}>
                <button className="sf-btn sf-btn--ghost sf-btn--sm" disabled={page === 1} onClick={() => { setPage(p => Math.max(1, p - 1)); scrollToShop(); }}>Previous</button>
                <span className="sf-faint sf-num" style={{ fontSize: 14 }}>Page {page} of {totalPages}</span>
                <button className="sf-btn sf-btn--ghost sf-btn--sm" disabled={page === totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); scrollToShop(); }}>Next</button>
            </nav>
        );
    };

    const filtersActive = [minPrice, maxPrice, minHeight, maxHeight, minWidth, maxWidth, minWeight, maxWeight, color, capacity].some(Boolean) || Boolean(selectedCollection);

    return (
        <div className="sf" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
            <style>{`
                @keyframes pageReveal {
                    from { opacity: 0; filter: blur(8px); transform: scale(0.985); }
                    to   { opacity: 1; filter: blur(0px); transform: scale(1);     }
                }
                .page-content-wrap {
                    animation: ${pageRevealed && animateReveal ? "pageReveal 0.75s cubic-bezier(0.22,1,0.36,1) forwards" : "none"};
                    opacity: ${pageRevealed ? "1" : "0"}; /* stay hidden until the fade-in starts, or it shows, blinks out, then fades in */
                }
                @media (prefers-reduced-motion: reduce) { .page-content-wrap { animation: none !important; } }
                .sf-range { -webkit-appearance: none; appearance: none; width: 100%; height: 2px; background: rgba(255,255,255,0.14); border-radius: 2px; outline: none; cursor: pointer; }
                .sf-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #D9B26F; border: 3px solid #0B0B0C; }
                .sf-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #D9B26F; border: 3px solid #0B0B0C; }
                .hero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); align-items: center; gap: 32px; min-height: min(760px, calc(100dvh - 64px)); padding-block: 48px 56px; }
                .hero__art { position: relative; display: grid; place-items: center; height: min(600px, 68dvh); }
                .hero__art::before { content: ""; position: absolute; inset: 8% 6% 14%; background: radial-gradient(closest-side, rgba(217,178,111,0.20), rgba(217,178,111,0.05) 55%, transparent 72%); }
                .hero__art::after { content: ""; position: absolute; bottom: 6%; width: 46%; height: 5%; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,0.75), transparent); filter: blur(6px); }
                .hero__img { position: relative; z-index: 1; height: 88%; width: auto; max-width: 100%; object-fit: contain; filter: drop-shadow(0 36px 60px rgba(0,0,0,0.6)); }
                .shop-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
                .shop-tools { display: flex; gap: 10px; align-items: center; }
                .filters-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 32px; }
                .types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
                .type-card { position: relative; text-align: left; display: grid; gap: 6px; align-content: start; min-height: 132px; padding: 20px; border-radius: 16px; background: #131315; border: 1px solid rgba(255,255,255,0.08); color: inherit; cursor: pointer; font: inherit; transition: border-color .2s, background-color .2s; }
                .type-card:hover { border-color: rgba(217,178,111,0.45); background: #17171a; }
                .admin-menu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px; padding: 6px; border-radius: 16px; background: #161618; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 60px rgba(0,0,0,0.55); display: grid; z-index: 60; }
                .admin-menu button { text-align: left; height: 40px; padding: 0 12px; border-radius: 10px; border: 0; background: transparent; color: #F2F0EB; font: 500 14px/1 var(--sf-font); cursor: pointer; }
                .admin-menu button:hover { background: rgba(255,255,255,0.06); }
                @media (max-width: 900px) {
                    .hero { grid-template-columns: 1fr; min-height: 0; padding-block: 36px 16px; gap: 8px; text-align: left; }
                    .hero__art { height: 320px; order: 2; }
                    .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 600px) {
                    .shop-tools .sf-btn span { display: none; }
                    .shop-tools .sf-btn { width: 48px; padding: 0; }
                    .filters-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            {/* Type selector modal, rendered outside the dimmed content */}
            {showModal && (
                <TypeSelectorModal
                    onStart={handleModalStart}
                    onSkip={handleModalSkip}
                    onOpenBag={(id) => openBag(id, 'modal')}
                />
            )}

            <div className="page-content-wrap">
                <SiteHeader>
                    {isAdmin && (
                        <div style={{ position: "relative" }} ref={adminMenuRef}>
                            <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => setAdminMenuOpen(o => !o)} aria-expanded={adminMenuOpen}>
                                Admin <CaretDown size={14} />
                            </button>
                            {adminMenuOpen && (
                                <div className="admin-menu" role="menu">
                                    {[
                                        { label: "Add bag", to: "/admin/add" },
                                        { label: "Add type", to: "/admin/type/add" },
                                        { label: "Add collection", to: "/admin/collection/add" },
                                        { label: "Orders", to: "/admin/orders" },
                                        { label: "Stats", to: "/admin/stats" },
                                    ].map(item => (
                                        <button key={item.to} role="menuitem" onClick={() => { setAdminMenuOpen(false); navigate(item.to); }}>{item.label}</button>
                                    ))}
                                    <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 4px" }} />
                                    <button role="menuitem" style={{ color: "#F0907F" }} onClick={() => { setAdminMenuOpen(false); logout(); }}>Log out</button>
                                </div>
                            )}
                        </div>
                    )}
                </SiteHeader>

                {/* ── Hero: message left, bag right ── */}
                <section className="sf-container hero">
                    <div>
                        <h1 className="sf-display sf-rise" style={{ "--d": "60ms", maxWidth: "15ch" }}>
                            Premium bags for work and <span className="sf-gold">travel.</span>
                        </h1>
                        <p className="sf-lead sf-rise" style={{ "--d": "160ms", marginTop: 20 }}>
                            Business, travel and luxury bags, delivered across Lebanon. Order online and pay with Whish.
                        </p>
                        <div className="sf-rise" style={{ "--d": "260ms", display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
                            <button className="sf-btn sf-btn--primary" onClick={scrollToShop}>Shop the collection</button>
                            <button className="sf-btn sf-btn--ghost" onClick={openAssistant}><Sparkle size={16} weight="fill" color="#D9B26F" /> Ask AI</button>
                        </div>
                    </div>
                    <div className="hero__art">
                        <img
                            className="hero__img sf-float"
                            src={heroBagImg}
                            alt="A black Trésor backpack with gold zips"
                            onLoad={() => setHeroLoaded(true)}
                            style={{ opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
                        />
                    </div>
                </section>

                {/* ── Shop ── */}
                <section ref={shopRef} id="shop" className="sf-container" style={{ paddingTop: 56, scrollMarginTop: 72 }}>
                    <div className="shop-head">
                        <div>
                            <h2 className="sf-h2">{activeTab === "items" ? (selectedPrimaryCategory || "The collection") : "Shop by type"}</h2>
                            <p className="sf-faint sf-num" style={{ marginTop: 6, fontSize: 14 }}>
                                {activeTab === "items" ? `${bagTotal} ${bagTotal === 1 ? "piece" : "pieces"}` : `${catTotal} ${catTotal === 1 ? "type" : "types"}`}
                            </p>
                        </div>
                        <div className="sf-seg" role="group" aria-label="Browse by">
                            <button aria-pressed={activeTab === "items"} onClick={() => setActiveTab("items")}>Bags</button>
                            <button aria-pressed={activeTab === "categories"} onClick={() => setActiveTab("categories")}>Types</button>
                        </div>
                    </div>

                    {/* Main categories */}
                    <div className="sf-chips no-tab-swipe" style={{ marginTop: 24 }} role="group" aria-label="Category">
                        <button className="sf-chip" aria-pressed={!selectedPrimaryCategory} onClick={() => pickPrimaryCategory(null)}>All</button>
                        {CATEGORIES.map(c => (
                            <button key={c} className="sf-chip" aria-pressed={selectedPrimaryCategory === c} onClick={() => pickPrimaryCategory(selectedPrimaryCategory === c ? null : c)}>{c}</button>
                        ))}
                    </div>

                    {activeTab === "items" && (
                        <>
                            {/* Search, filters, assistant */}
                            <div className="shop-tools" style={{ marginTop: 16 }}>
                                <label className="sf-search">
                                    <MagnifyingGlass size={18} />
                                    <input className="sf-input" type="search" placeholder="Search bags" aria-label="Search bags" value={searchInput} onChange={handleSearchChange} />
                                </label>
                                <button className={`sf-btn sf-btn--ghost`} onClick={() => setFilterOpen(o => !o)} aria-expanded={filterOpen}
                                    style={filtersActive ? { borderColor: "rgba(217,178,111,0.6)", color: "#D9B26F" } : undefined}>
                                    <SlidersHorizontal size={18} /> <span>Filters</span>
                                </button>
                                <button className="sf-btn sf-btn--ghost" onClick={() => setAskOpen(o => !o)} aria-expanded={askOpen}>
                                    <Sparkle size={18} weight="fill" color="#D9B26F" /> <span>Ask AI</span>
                                </button>
                            </div>

                            {askOpen && (
                                <div ref={askRef} className="sf-panel" style={{ marginTop: 16 }}>
                                    <ShopAssistant storageKey="listing" onOpenBag={(id) => openBag(id, 'listing')} autoFocus={askReturn !== 'listing'} />
                                </div>
                            )}

                            {filterOpen && (
                                <div className="sf-panel" style={{ marginTop: 16, display: "grid", gap: 24 }}>
                                    {collections.length > 0 && (
                                        <div className="sf-field">
                                            <span className="sf-label">Collection</span>
                                            <div className="sf-chips no-tab-swipe">
                                                <button className="sf-chip" aria-pressed={!selectedCollection} onClick={() => setSelectedCollection(null)}>All</button>
                                                {collections.map(col => {
                                                    const active = selectedCollection?._id === col._id;
                                                    return (
                                                        <button key={col._id} className="sf-chip" aria-pressed={active} onClick={() => setSelectedCollection(active ? null : col)}>
                                                            {col.logo && <img src={sized(col.logo, 64)} alt="" />}
                                                            {col.title}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="filters-grid">
                                        <div className="sf-field">
                                            <span className="sf-label">Price ($)</span>
                                            <div style={{ display: "flex", gap: 10 }}>
                                                <input className="sf-input" type="number" inputMode="decimal" placeholder="From" aria-label="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                                                <input className="sf-input" type="number" inputMode="decimal" placeholder="To" aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                                            </div>
                                        </div>
                                        <SliderGroup label="Height (cm)" minVal={minHeight} maxVal={maxHeight} setMin={setMinHeight} setMax={setMaxHeight} range={HEIGHT_RANGE} unit="cm" />
                                        <SliderGroup label="Width (cm)" minVal={minWidth} maxVal={maxWidth} setMin={setMinWidth} setMax={setMaxWidth} range={WIDTH_RANGE} unit="cm" />
                                        <SliderGroup label="Weight (kg)" minVal={minWeight} maxVal={maxWeight} setMin={setMinWeight} setMax={setMaxWeight} range={WEIGHT_RANGE} unit="kg" />
                                        <label className="sf-field">
                                            <span className="sf-label">Colour</span>
                                            <input className="sf-input" placeholder="Black, brown" value={color} onChange={(e) => setColor(e.target.value)} />
                                        </label>
                                        <label className="sf-field">
                                            <span className="sf-label">Capacity</span>
                                            <input className="sf-input" placeholder="20L" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                                        </label>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                        <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => { resetFilters(); setSelectedCollection(null); }}>Clear all</button>
                                        <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => setFilterOpen(false)}>Show results</button>
                                    </div>
                                </div>
                            )}

                            {/* A type picked from the Types tab */}
                            {selectedCategory && (
                                <div className="sf-panel" style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 16 }}>
                                    <button className="sf-icon-btn" onClick={resetCategoryFilter} aria-label="Back to all bags"><ArrowLeft size={20} /></button>
                                    <div style={{ display: "grid", gap: 4 }}>
                                        <h3 className="sf-h3">{selectedCategory.title}</h3>
                                        <p className={selectedCategory.discount > 0 ? "sf-gold" : "sf-faint"} style={{ fontSize: 14 }}>
                                            {selectedCategory.discount > 0 ? `${selectedCategory.discount}% off everything in this type` : "No discount on this type right now"}
                                        </p>
                                        {selectedCategory.note && <p className="sf-muted" style={{ fontSize: 14, maxWidth: "60ch" }}>{selectedCategory.note}</p>}
                                    </div>
                                </div>
                            )}

                            {errorBags && <p className="sf-error" role="alert" style={{ marginTop: 24 }}>{errorBags}</p>}

                            <div style={{ marginTop: 32 }}>
                                {loadingBags ? (
                                    <div className="sf-grid" aria-busy="true" aria-label="Loading bags">
                                        {Array.from({ length: 8 }, (_, i) => (
                                            <div key={i} className="sf-card">
                                                <div className="sf-skel" style={{ aspectRatio: "4 / 5", borderRadius: 16 }} />
                                                <div className="sf-skel" style={{ height: 12, width: "50%" }} />
                                                <div className="sf-skel" style={{ height: 16, width: "80%" }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : bags.length === 0 ? (
                                    <div className="sf-panel" style={{ textAlign: "center", padding: "56px 24px", display: "grid", gap: 12, justifyItems: "center" }}>
                                        <h3 className="sf-h3">No bags match this search</h3>
                                        <p className="sf-muted" style={{ maxWidth: "44ch" }}>Try another word, clear the filters, or ask our AI to find something close.</p>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                                            <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => { resetFilters(); setSelectedCollection(null); pickPrimaryCategory(null); }}>Clear filters</button>
                                            <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={openAssistant}>Ask AI</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="sf-grid">
                                        {bags.map((bag, index) => {
                                            const qty = getQuantity(bag._id);
                                            const outOfStock = (bag.stock ?? 0) <= 0;
                                            const discount = bag.typeId?.discount || 0;
                                            const finalPrice = bag.price * (1 - discount / 100);
                                            const meta = [bag.typeId?.title, bag.collectionId?.title].filter(Boolean).join(" · ");
                                            return (
                                                <Reveal key={bag._id} index={index} as="article" className="sf-card">
                                                    {isAdmin && (
                                                        <div className="sf-admin-tools">
                                                            <button onClick={() => navigate(`/admin/edit/${bag._id}`)} aria-label={`Edit ${bag.title}`}><PencilSimple size={16} /></button>
                                                            <button onClick={() => handleDelete(bag._id)} aria-label={`Delete ${bag.title}`}><Trash size={16} /></button>
                                                        </div>
                                                    )}
                                                    <button className="sf-tile" onClick={() => navigate(`/gallery/${bag._id}`)} aria-label={`View ${bag.title}`}>
                                                        {outOfStock
                                                            ? <span className="sf-tile__flag sf-tile__flag--muted">Sold out</span>
                                                            : discount > 0 && <span className="sf-tile__flag">-{discount}%</span>}
                                                        <img src={sized(bag.mainImage, 700)} alt="" loading="lazy" />
                                                    </button>
                                                    <div className="sf-card__body">
                                                        {meta && <p className="sf-card__meta">{meta}</p>}
                                                        <button className="sf-card__title" onClick={() => navigate(`/gallery/${bag._id}`)}>{bag.title}</button>
                                                        <div className="sf-card__row">
                                                            <span className="sf-price">
                                                                <b>{money(finalPrice)}</b>
                                                                {discount > 0 && <s>{money(bag.price)}</s>}
                                                            </span>
                                                            {!outOfStock && (qty === 0 ? (
                                                                <button className="sf-btn sf-btn--ghost sf-btn--sm sf-card__add" onClick={() => setQuantity(bag, 1)} aria-label={`Add ${bag.title} to bag`}>
                                                                    <Plus size={14} /> <span className="sf-card__add-label">Add</span>
                                                                </button>
                                                            ) : (
                                                                <div className="sf-stepper" aria-label={`${bag.title} quantity`}>
                                                                    <button onClick={() => setQuantity(bag, qty - 1)} aria-label="Remove one"><Minus size={14} /></button>
                                                                    <span>{qty}</span>
                                                                    <button onClick={() => setQuantity(bag, qty + 1)} disabled={qty >= bag.stock} aria-label="Add one"><Plus size={14} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Reveal>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {pagination(bagPage, bagTotalPages, setBagPage)}
                        </>
                    )}

                    {activeTab === "categories" && (
                        <>
                            <div className="shop-tools" style={{ marginTop: 16 }}>
                                <label className="sf-search">
                                    <MagnifyingGlass size={18} />
                                    <input className="sf-input" type="search" placeholder="Search types" aria-label="Search types" value={catSearch} onChange={handleCatSearchChange} />
                                </label>
                                <button className="sf-chip" aria-pressed={hasDiscount} onClick={() => setHasDiscount(v => !v)} style={{ height: 48 }}>On offer</button>
                            </div>
                            <div style={{ marginTop: 32 }}>
                                {loadingCats ? (
                                    <div className="types-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="sf-skel" style={{ height: 132, borderRadius: 16 }} />)}</div>
                                ) : categories.length === 0 ? (
                                    <div className="sf-panel" style={{ textAlign: "center", padding: "48px 24px" }}>
                                        <h3 className="sf-h3">No types found</h3>
                                        <p className="sf-muted" style={{ marginTop: 8 }}>Try another word or turn off “On offer”.</p>
                                    </div>
                                ) : (
                                    <div className="types-grid">
                                        {categories.map((cat, index) => (
                                            <Reveal key={cat._id} index={index} style={{ position: "relative" }}>
                                                {isAdmin && (
                                                    <div className="sf-admin-tools">
                                                        <button onClick={() => navigate(`/admin/type/edit/${cat._id}`)} aria-label={`Edit ${cat.title}`}><PencilSimple size={16} /></button>
                                                        <button onClick={e => handleDeleteCategory(cat._id, e)} aria-label={`Delete ${cat.title}`}><Trash size={16} /></button>
                                                    </div>
                                                )}
                                                <button className="type-card" onClick={() => handleCategoryClick(cat)} style={{ width: "100%" }}>
                                                    {cat.category && <span className="sf-faint" style={{ fontSize: 13 }}>{cat.category}</span>}
                                                    <span className="sf-h3">{cat.title}</span>
                                                    {cat.discount > 0 && <span className="sf-gold" style={{ fontSize: 14, fontWeight: 550 }}>{cat.discount}% off</span>}
                                                    {cat.note && <span className="sf-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{cat.note}</span>}
                                                </button>
                                            </Reveal>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>

                <SiteFooter />
            </div>
        </div>
    );
};

export default BagListing;
