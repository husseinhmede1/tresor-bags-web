import { useNavigate } from "react-router-dom";
import BagForm from "../components/BagForm";
import { createBag } from "../services/bagService";

const AddBag = () => {
    const navigate = useNavigate();
    // Errors are shown by BagForm next to the Save button, so the form stays filled in.
    const handleSubmit = async (formData) => {
        const result = await createBag(formData);
        if (result.success) navigate("/admin/dashboard");
        return result;
    };

    return (
        <BagForm
            onSubmit={handleSubmit}
            title="Add New Bag"
        />
    );
};

export default AddBag;
