import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BagForm from "../components/BagForm";
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

    const handleSubmit = async (formData) => {
        try {
            setError("");
            const result = await updateBag(id, formData);
            if (result.success) {
                navigate("/tresor-bags/admin/dashboard");
            }
        } catch (err) {
            setError(err.message || "Failed to update bag");
            throw err;
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.spinner}></div>
                <p>Loading bag details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorPage}>
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate("/tresor-bags/admin/dashboard")}>
                    Go Back
                </button>
            </div>
        );
    }

    return bagData ? (
        <BagForm
            bagId={id}
            initialData={bagData}
            onSubmit={handleSubmit}
            title="Edit Bag"
        />
    ) : null;
};

const styles = {
    loadingPage: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(201,168,106,0.12), transparent 18%), #070707",
        color: "#F5F1E8",
        fontFamily: "'Inter', sans-serif",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(255,255,255,0.12)",
        borderTop: "4px solid #E5C48A",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "16px",
    },
    errorPage: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(201,168,106,0.12), transparent 18%), #070707",
        color: "#F5F1E8",
        fontFamily: "'Inter', sans-serif",
    },
};

export default EditBag;
