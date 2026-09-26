import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import BagForm from "../components/BagForm";
import AdminShell from "../components/storefront/AdminShell";
import { getBagById, updateBag } from "../services/bagService";

const EditBag = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bagData, setBagData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
        if (result.success) navigate("/admin/dashboard");
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
                        onClick={() => navigate("/admin/dashboard")}>
                        <ArrowLeft size={16} /> Back to bags
                    </button>
                </div>
            </AdminShell>
        );
    }

    return bagData ? (
        <BagForm
            bagId={id}
            initialData={bagData}
            onSubmit={handleSubmit}
            title="Edit bag"
        />
    ) : null;
};

const EB_CSS = `
    .eb-skel { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 24px; align-items: start; }
    .eb-skel__col { display: grid; gap: 18px; }
    @media (max-width: 860px) { .eb-skel { grid-template-columns: 1fr; } }
`;

export default EditBag;
