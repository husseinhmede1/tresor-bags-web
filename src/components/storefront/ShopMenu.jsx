import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CaretDown, CaretRight, List, X } from "@phosphor-icons/react";
import { SHOP_CATEGORIES } from "../../utils/shopCategories";
import { getAllTypes } from "../../services/typeService";
import { getAllCollections } from "../../services/collectionService";

// The store's menu: the four main categories with their types, and the collections.
// Wide screens get a row of links in the header, each opening a panel under it;
// phones and tablets get a menu button that opens a side drawer.
// Picking something opens the shop on the home page with that choice applied
// (BagListing reads it from the navigation state, see `shopPick`).

// Loaded once per visit and shared by every page's header.
let menuData = null;
const loadMenu = () => {
    menuData ??= Promise.all([
        getAllTypes().then(r => r.data || []).catch(() => []),
        getAllCollections().then(r => (r.success ? r.data : []) || []).catch(() => []),
    ]).then(([types, collections]) => ({
        types: [...types].sort((a, b) => a.title.localeCompare(b.title)),
        collections: [...collections].sort((a, b) => a.title.localeCompare(b.title)),
    }));
    return menuData;
};

const useMenuData = () => {
    const [data, setData] = useState({ types: [], collections: [] });
    useEffect(() => {
        let alive = true;
        loadMenu().then(d => { if (alive) setData(d); });
        return () => { alive = false; };
    }, []);
    return data;
};

const typesOf = (types, category) => types.filter(t => t.category === category);
const typePick = (t) => ({ type: { _id: t._id, title: t.title, category: t.category, discount: t.discount, note: t.note } });
const collectionPick = (c) => ({ collection: { _id: c._id, title: c.title } });

const Portal = ({ children }) => createPortal(<div className="sf sf-portal">{children}</div>, document.body);

export default function ShopMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { types, collections } = useMenuData();
    const [open, setOpen] = useState(null);          // wide screens: the open panel's name
    const [drawer, setDrawer] = useState(false);     // narrow screens
    const closeTimer = useRef(null);
    const hoveredAt = useRef(0);

    const go = (shopPick) => {
        setOpen(null);
        setDrawer(false);
        navigate("/", { state: { shopPick } });
    };

    // Close on page change and on Escape.
    const [pageKey, setPageKey] = useState(location.key);
    if (pageKey !== location.key) {
        setPageKey(location.key);
        setOpen(null);
        setDrawer(false);
    }
    useEffect(() => {
        if (!open && !drawer) return;
        const onKey = (e) => { if (e.key === "Escape") { setOpen(null); setDrawer(false); } };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, drawer]);
    // The page behind the drawer doesn't scroll.
    useEffect(() => {
        if (!drawer) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [drawer]);
    useEffect(() => () => clearTimeout(closeTimer.current), []);

    // Hover opens a panel on a mouse; a click or tap toggles it everywhere.
    const hoverOpen = (name) => (e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(closeTimer.current);
        hoveredAt.current = Date.now();
        setOpen(name);
    };
    // The click that follows the hover that just opened a panel must not close it again.
    const clickLink = (name) => () => setOpen(o => (o === name && Date.now() - hoveredAt.current > 600 ? null : name));
    const hoverClose = (e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(null), 180);
    };
    const hoverKeep = () => clearTimeout(closeTimer.current);

    const items = [...SHOP_CATEGORIES.map(c => c.title), ...(collections.length ? ["Collections"] : [])];
    const active = SHOP_CATEGORIES.find(c => c.title === open);

    return (
        <>
            {/* ── Wide screens: links in the header ── */}
            <nav className="shop-nav" aria-label="Shop" onPointerLeave={hoverClose} onPointerEnter={hoverKeep}>
                {items.map(name => (
                    <button
                        key={name}
                        type="button"
                        className="shop-nav__link"
                        aria-expanded={open === name}
                        aria-controls="shop-panel"
                        onPointerEnter={hoverOpen(name)}
                        onClick={clickLink(name)}
                    >
                        {name} <CaretDown size={12} weight="bold" />
                    </button>
                ))}

                {open && (
                    <div id="shop-panel" className="shop-panel" onPointerEnter={hoverKeep}>
                        <div className="sf-container shop-panel__inner" key={open}>
                            {active ? (
                                <>
                                    <div className="shop-panel__lead">
                                        <active.Icon size={28} color="var(--sf-gold)" />
                                        <p className="sf-h3">{active.title}</p>
                                        <p className="sf-faint shop-panel__sub">{active.sub}</p>
                                        <button type="button" className="shop-panel__all" onClick={() => go({ category: active.title })}>
                                            Shop all {active.title.toLowerCase()} <ArrowRight size={14} />
                                        </button>
                                    </div>
                                    <ul className="shop-panel__list">
                                        {typesOf(types, active.title).map(t => (
                                            <li key={t._id}>
                                                <button type="button" onClick={() => go(typePick(t))}>
                                                    <span>{t.title}</span>
                                                    {t.discount > 0 && <span className="shop-off">-{t.discount}%</span>}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <div className="shop-panel__lead">
                                        <p className="sf-h3">Collections</p>
                                        <p className="sf-faint shop-panel__sub">Shop by brand line</p>
                                    </div>
                                    <ul className="shop-panel__list">
                                        {collections.map(c => (
                                            <li key={c._id}>
                                                <button type="button" onClick={() => go(collectionPick(c))}><span>{c.title}</span></button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        <div className="shop-panel__scrim" onClick={() => setOpen(null)} aria-hidden="true" />
                    </div>
                )}
            </nav>

            {/* ── Phones and tablets: menu button and drawer ── */}
            <button type="button" className="sf-icon-btn shop-menu-btn" onClick={() => setDrawer(true)} aria-label="Shop menu" aria-expanded={drawer}>
                <List size={22} />
            </button>
            {drawer && (
                <Portal>
                    <ShopDrawer types={types} collections={collections} onPick={go} onClose={() => setDrawer(false)} />
                </Portal>
            )}
        </>
    );
}

function ShopDrawer({ types, collections, onPick, onClose }) {
    const [expanded, setExpanded] = useState(null);
    const panelRef = useRef(null);
    useEffect(() => { panelRef.current?.focus(); }, []);
    const toggle = (name) => setExpanded(e => (e === name ? null : name));

    return (
        <>
            <div className="shop-drawer__scrim" onClick={onClose} aria-hidden="true" />
            <div className="shop-drawer" role="dialog" aria-modal="true" aria-label="Shop menu" tabIndex={-1} ref={panelRef}>
                <div className="shop-drawer__head">
                    <p className="sf-h3">Shop</p>
                    <button type="button" className="sf-icon-btn" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
                </div>

                <div className="shop-drawer__body">
                    <button type="button" className="shop-row" onClick={() => onPick({ category: null })}>
                        <span className="shop-row__label">All bags</span>
                        <CaretRight size={16} className="sf-faint" />
                    </button>

                    {SHOP_CATEGORIES.map(({ title, sub, Icon }) => {
                        const isOpen = expanded === title;
                        const list = typesOf(types, title);
                        return (
                            <div key={title} className="shop-group">
                                <button type="button" className="shop-row" aria-expanded={isOpen} onClick={() => toggle(title)}>
                                    <Icon size={22} color="var(--sf-gold)" />
                                    <span className="shop-row__label">
                                        {title}
                                        <small>{sub}</small>
                                    </span>
                                    <CaretDown size={16} className="shop-row__caret" />
                                </button>
                                {isOpen && (
                                    <ul className="shop-sub">
                                        <li><button type="button" className="shop-sub__all" onClick={() => onPick({ category: title })}>All {title.toLowerCase()}</button></li>
                                        {list.map(t => (
                                            <li key={t._id}>
                                                <button type="button" onClick={() => onPick(typePick(t))}>
                                                    <span>{t.title}</span>
                                                    {t.discount > 0 && <span className="shop-off">-{t.discount}%</span>}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}

                    {collections.length > 0 && (
                        <div className="shop-group">
                            <button type="button" className="shop-row" aria-expanded={expanded === "Collections"} onClick={() => toggle("Collections")}>
                                <span className="shop-row__label">
                                    Collections
                                    <small>Shop by brand line</small>
                                </span>
                                <CaretDown size={16} className="shop-row__caret" />
                            </button>
                            {expanded === "Collections" && (
                                <ul className="shop-sub">
                                    {collections.map(c => (
                                        <li key={c._id}><button type="button" onClick={() => onPick(collectionPick(c))}><span>{c.title}</span></button></li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
