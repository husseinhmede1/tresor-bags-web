import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useGoBack } from "../utils/goBack";
import { ArrowLeft, Package, WarningCircle } from "@phosphor-icons/react";
import BagForm from "../components/BagForm";
import AdminShell from "../components/storefront/AdminShell";
import { getBagById, updateBag } from "../services/bagService";

const EditBag = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const goBack = useGoBack();
    const [bagData, setBagData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Set when the saved stock went, in part or in full, to paid orders waiting for this bag.
    const [reserved, setReserved] = useState(null);

    useEffect(() => {
        const fetchBag = async () => {
            try {
                const result = await getBagById(id);
                if (result.success) {
                    setBagData(result.data);
                } else {
                    setError("Failed to load bag details");
                }
            } catch (err) {
                setError(err.message || "Failed to fetch bag");
            } finally {
                setLoading(false);
            }
        };

        fetchBag();
    }, [id]);

    // Errors are shown by BagForm next to the Save button, so the form stays filled in.
    const handleSubmit = async (formData) => {
        const result = await updateBag(id, formData);
        if (result.success) {
            if (result.reserved?.length) setReserved({ orders: result.reserved, stock: result.data?.stock ?? 0 });
            else goBack("/admin/dashboard");   // back to the list, at the page it was on
        }
        return result;
    };

    if (loading) {
        return (
            <AdminShell title="Edit bag" subtitle="Loading bag details…" width={1120}>
                <div className="eb-skel" aria-busy="true" aria-label="Loading bag details">
                    <div className="sf-panel eb-skel__col">
                        <div className="sf-skel" style={{ height: 22, width: "40%" }} />
                        <div className="sf-skel" style={{ aspectRatio: "1 / 1", borderRadius: 16 }} />
                    </div>
                    <div className="sf-panel eb-skel__col">
                        <div className="sf-skel" style={{ height: 22, width: "30%" }} />
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} style={{ display: "grid", gap: 8 }}>
                                <div className="sf-skel" style={{ height: 14, width: "22%" }} />
                                <div className="sf-skel" style={{ height: 48, borderRadius: 12 }} />
                            </div>
                        ))}
                    </div>
                </div>
                <style>{EB_CSS}</style>
            </AdminShell>
        );
    }

    if (error) {
        return (
            <AdminShell title="Edit bag" width={1120}>
                <div className="sf-panel" role="alert" style={{ maxWidth: 520, display: "grid", gap: 10, justifyItems: "start" }}>
                    <WarningCircle size={28} style={{ color: "var(--sf-danger)" }} />
                    <h2 className="sf-h3">Could not load this bag</h2>
                    <p className="sf-muted">{error}</p>
                    <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ marginTop: 8 }}
                        onClick={() => goBack("/admin/dashboard")}>
                        <ArrowLeft size={16} /> Back to bags
                    </button>
                </div>
            </AdminShell>
        );
    }

    const kept = reserved ? reserved.orders.reduce((n, o) => n + o.units, 0) : 0;

    return bagData ? (
        <>
            <BagForm
                bagId={id}
                initialData={bagData}
                onSubmit={handleSubmit}
                title="Edit bag"
            />
            {/* On the body: direct children of #root are forced to position: relative. */}
            {reserved && createPortal(
                <div className="sf eb-overlay">
                    <style>{EB_CSS}</style>
                    <div className="sf-panel eb-dialog" role="alertdialog" aria-modal="true" aria-labelledby="eb-kept-title">
                        <Package size={32} style={{ color: "var(--sf-gold)" }} />
                        <h2 id="eb-kept-title" className="sf-h3">{kept} unit{kept === 1 ? "" : "s"} kept for waiting orders</h2>
                        <p className="sf-muted" style={{ fontSize: 14 }}>
                            These customers already paid and were waiting for this bag, so the new stock went to them first.
                        </p>
                        <ul className="eb-kept">
                            {reserved.orders.map((o) => (
                                <li key={o.token}>
                                    <span>{o.name || "Name not given"}</span>
                                    <span className="sf-num">×{o.units}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="sf-num" style={{ fontSize: 15 }}>Stock now on the site: <b>{reserved.stock}</b></p>
                        <button className="sf-btn sf-btn--primary sf-btn--block" onClick={() => navigate("/admin/orders?status=ready")}>
                            See orders ready to deliver
                        </button>
                        <button className="sf-btn sf-btn--ghost sf-btn--block" onClick={() => goBack("/admin/dashboard")}>Done</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    ) : null;
};

const EB_CSS = `
    .eb-skel { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 24px; align-items: start; }
    .eb-skel__col { display: grid; gap: 18px; }
    @media (max-width: 860px) { .eb-skel { grid-template-columns: 1fr; } }
    .eb-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.72); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .eb-dialog { max-width: 460px; width: 100%; max-height: 100%; overflow-y: auto; display: grid; gap: 12px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); }
    .eb-kept { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .eb-kept li { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 12px; background: var(--sf-surface-2); border: 1px solid var(--sf-line); }
    .eb-kept li span:first-child { min-width: 0; overflow-wrap: anywhere; }
`;

export default EditBag;
