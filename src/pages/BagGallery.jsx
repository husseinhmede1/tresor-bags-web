import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Handbag, Minus, Plus } from "@phosphor-icons/react";
import { getBagById } from "../services/bagService";
import { useCart } from "../context/CartContext";
import { usePageMeta } from "../utils/pageMeta";
import { sized } from "../utils/image";
import SiteHeader from "../components/storefront/SiteHeader";
import SiteFooter from "../components/storefront/SiteFooter";

const BagGallery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getQuantity, setQuantity } = useCart();
    const [bag, setBag] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getBagById(id)
            .then(result => {
                if (result.success) {
                    setBag(result.data);
                    setSelectedImage(result.data.mainImage);
                } else setError("Failed to load details");
            })
            .catch(err => setError(err.message || "Failed to fetch bag"))
            .finally(() => setLoading(false));
    }, [id]);

    // Search engines and link previews for this bag (restored to the site defaults on leave).
    const bagUrl = bag ? `https://tresorbags.com/gallery/${bag._id}` : undefined;
    usePageMeta({
        title: bag ? `${bag.title} | Trésor Bags` : undefined,
        description: bag ? (bag.description || "").replace(/\s+/g, " ").slice(0, 155) : undefined,
        url: bagUrl,
        image: bag?.mainImage?.startsWith("https://") ? bag.mainImage : undefined,
        type: "product",
    });

    if (loading) return (
        <div className="sf">
            <SiteHeader back="/" />
            <div className="sf-container pdp" aria-busy="true" aria-label="Loading">
                <div className="sf-skel" style={{ aspectRatio: "1", borderRadius: 16 }} />
                <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
                    <div className="sf-skel" style={{ height: 14, width: "40%" }} />
                    <div className="sf-skel" style={{ height: 36, width: "80%" }} />
                    <div className="sf-skel" style={{ height: 24, width: "30%" }} />
                    <div className="sf-skel" style={{ height: 48, width: "100%", borderRadius: 999, marginTop: 16 }} />
                </div>
            </div>
            <style>{PDP_CSS}</style>
        </div>
    );

    if (error || !bag) return (
        <div className="sf">
            <SiteHeader back="/" />
            <div className="sf-container" style={{ paddingBlock: 96, display: "grid", gap: 16, justifyItems: "start" }}>
                <h1 className="sf-h2">This bag isn’t available</h1>
                <p className="sf-muted">{error ? "We couldn’t load it right now. Please try again in a moment." : "It may have sold out or been removed."}</p>
                <button className="sf-btn sf-btn--primary" onClick={() => navigate("/")}>Back to the collection</button>
            </div>
        </div>
    );

    const allImages = [...new Set([...(bag.mainImage ? [bag.mainImage] : []), ...(bag.sideImages || [])])];

    const specs = [
        ["Height",   bag.dimensions?.height ? `${bag.dimensions.height} cm` : null],
        ["Width",    bag.dimensions?.width  ? `${bag.dimensions.width} cm`  : null],
        ["Depth",    bag.dimensions?.depth  ? `${bag.dimensions.depth} cm`  : null],
        ["Weight",   bag.weight             ? `${bag.weight} kg`            : null],
        ["Colour",   bag.color              || null],
        ["Capacity", bag.capacity           || null],
    ].filter(([, v]) => v);

    const discountedPrice = bag.typeId?.discount > 0
        ? (bag.price * (1 - bag.typeId.discount / 100)).toFixed(2)
        : null;

    // Product data for search engines (price, stock, photos).
    const pageUrl = bagUrl;
    const productLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: bag.title,
        description: bag.description,
        image: [bag.mainImage, ...(bag.sideImages || [])].filter(s => s && !s.startsWith("data:")),
        color: bag.color || undefined,
        brand: { "@type": "Brand", name: "Trésor Bags" },
        offers: {
            "@type": "Offer",
            url: pageUrl,
            priceCurrency: "USD",
            price: Number(discountedPrice ?? bag.price).toFixed(2),
            availability: bag.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
    };

    const discount = bag.typeId?.discount || 0;
    const outOfStock = (bag.stock ?? 0) <= 0;
    const qty = getQuantity(bag._id);
    const maxStock = bag.stock ?? 0;
    const meta = [bag.typeId?.title, bag.collectionId?.title].filter(Boolean).join(" · ");

    return (
        <div className="sf">
            <style>{PDP_CSS}</style>
            <script type="application/ld+json">{JSON.stringify(productLd)}</script>
            <SiteHeader back="/" />

            <main className="sf-container pdp">
                {/* Photos */}
                <div className="pdp__media">
                    <button className="sf-tile pdp__main" onClick={() => window.open(selectedImage, "_blank")} aria-label="Open the full-size photo">
                        <img src={sized(selectedImage, 1400)} alt={bag.title} />
                    </button>
                    {allImages.length > 1 && (
                        <div className="pdp__thumbs" role="group" aria-label="Photos">
                            {allImages.map((img, i) => (
                                <button key={img} className="sf-tile pdp__thumb" aria-pressed={selectedImage === img}
                                    onClick={() => setSelectedImage(img)} aria-label={`Photo ${i + 1}`}>
                                    <img src={sized(img, 240)} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="pdp__info">
                    {meta && <p className="sf-faint" style={{ fontSize: 14 }}>{meta}</p>}
                    <h1 className="pdp__title">{bag.title}</h1>

                    <div className="sf-price" style={{ marginTop: 16 }}>
                        <b style={{ fontSize: 26, letterSpacing: "-0.02em" }}>{money(discountedPrice ?? bag.price)}</b>
                        {discountedPrice && <s style={{ fontSize: 17 }}>{money(bag.price)}</s>}
                        {discount > 0 && <span className="sf-gold" style={{ fontSize: 14, fontWeight: 600 }}>{discount}% off</span>}
                    </div>
                    <p className={outOfStock ? "sf-error" : "sf-faint"} style={{ fontSize: 14, marginTop: 6 }}>
                        {outOfStock ? "Sold out" : maxStock <= 3 ? `Only ${maxStock} left` : "In stock, delivered across Lebanon"}
                    </p>

                    <div className="pdp__buy">
                        {outOfStock ? (
                            <button className="sf-btn sf-btn--ghost sf-btn--block" disabled>Sold out</button>
                        ) : qty === 0 ? (
                            <button className="sf-btn sf-btn--primary sf-btn--block" onClick={() => setQuantity(bag, 1)}>
                                <Handbag size={18} /> Add to bag
                            </button>
                        ) : (
                            <>
                                <div className="sf-stepper" style={{ height: 48 }} aria-label="Quantity">
                                    <button style={{ width: 46, height: 46 }} onClick={() => setQuantity(bag, qty - 1)} aria-label="Remove one"><Minus size={16} /></button>
                                    <span>{qty}</span>
                                    <button style={{ width: 46, height: 46 }} onClick={() => setQuantity(bag, qty + 1)} disabled={qty >= maxStock} aria-label="Add one"><Plus size={16} /></button>
                                </div>
                                <button className="sf-btn sf-btn--primary" style={{ flex: 1 }} onClick={() => navigate("/cart")}>View bag</button>
                            </>
                        )}
                    </div>

                    {bag.description && <p className="pdp__desc">{bag.description}</p>}

                    {specs.length > 0 && (
                        <dl className="pdp__specs">
                            {specs.map(([label, value]) => (
                                <div key={label} className="pdp__spec">
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            </main>
            <SiteFooter />
        </div>
    );
};

const money = (n) => `$${Number(n).toLocaleString("en-US", Number.isInteger(Number(n)) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PDP_CSS = `
    .pdp { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); padding-block: 32px 24px; align-items: start; }
    .pdp__media { display: grid; gap: 12px; }
    .pdp__main { aspect-ratio: 1 / 1; cursor: zoom-in; }
    .pdp__main img { padding: 7%; }
    .pdp__thumbs { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 4px; margin: -4px; }
    .pdp__thumb { flex: 0 0 76px; width: 76px; aspect-ratio: 1; border-radius: 12px; outline: 2px solid transparent; outline-offset: 2px; }
    .pdp__thumb img { padding: 10%; }
    .pdp__thumb[aria-pressed="true"] { outline-color: var(--sf-gold); }
    .pdp__info { position: sticky; top: 96px; display: grid; }
    .pdp__title { font-size: clamp(1.9rem, 3.4vw, 2.75rem); line-height: 1.08; font-weight: 600; letter-spacing: -0.035em; margin-top: 8px; }
    .pdp__buy { display: flex; gap: 10px; margin-top: 28px; }
    .pdp__desc { margin-top: 32px; color: var(--sf-text-2); font-size: 16px; line-height: 1.7; max-width: 60ch; white-space: pre-line; }
    .pdp__specs { margin: 32px 0 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .pdp__spec { background: var(--sf-surface); border: 1px solid var(--sf-line); border-radius: 16px; padding: 14px 16px; display: grid; gap: 4px; }
    .pdp__spec dt { font-size: 13px; color: var(--sf-text-3); }
    .pdp__spec dd { margin: 0; font-size: 16px; font-weight: 550; font-variant-numeric: tabular-nums; }
    @media (max-width: 860px) {
        .pdp { grid-template-columns: 1fr; padding-top: 16px; }
        .pdp__info { position: static; }
        .pdp__specs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
`;

export default BagGallery;
