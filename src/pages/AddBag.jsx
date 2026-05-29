import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BagForm from "../components/BagForm";
import { createBag } from "../services/bagService";

const AddBag = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleSubmit = async (formData) => {
        try {
            setError("");
            const result = await createBag(formData);
            if (result.success) {
                navigate("/admin/dashboard");
            }
        } catch (err) {
            setError(err.message || "Failed to create bag");
            throw err;
        }
    };

    return (
        <BagForm
            onSubmit={handleSubmit}
            title="Add New Bag"
        />
    );
};

export default AddBag;
