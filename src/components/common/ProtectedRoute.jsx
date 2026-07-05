import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useAuth();
    const location = useLocation();
    return isAdmin ? children : <Navigate to="/admin" replace state={{ from: location.pathname }} />;
};

export default ProtectedRoute;