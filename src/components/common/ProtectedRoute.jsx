import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useAuth();
    return isAdmin ? children : <Navigate to="/tresor-bags/admin" replace />;
};

export default ProtectedRoute;