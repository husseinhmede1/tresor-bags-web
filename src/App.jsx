import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import BagListing from "./pages/BagListing";
import BagGallery from "./pages/BagGallery";
import Login from "./pages/Login";
import AddBag from "./pages/AddBag";
import EditBag from "./pages/EditBag";
import AnimatedBagsBackground from "./components/AnimatedBagsBackground";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* <AnimatedBagsBackground /> */}
        <Routes>

          {/* Public listing */}
          <Route path="/" element={<BagListing />} />

          {/* Public gallery view */}
          <Route path="/gallery/:id" element={<BagGallery />} />

          {/* Admin login */}
          <Route path="/admin" element={<Login />} />

          {/* Admin dashboard - same listing, admin mode active via context */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <BagListing />
              </ProtectedRoute>
            }
          />

          {/* Add new bag */}
          <Route
            path="/admin/add"
            element={
              <ProtectedRoute>
                <AddBag />
              </ProtectedRoute>
            }
          />

          {/* Edit bag */}
          <Route
            path="/admin/edit/:id"
            element={
              <ProtectedRoute>
                <EditBag />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
