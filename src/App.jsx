import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import BagListing from "./pages/BagListing";
import BagGallery from "./pages/BagGallery";
import Login from "./pages/Login";
import AddBag from "./pages/AddBag";
import EditBag from "./pages/EditBag";
import AddCategory from "./pages/AddCategory";
import EditCategory from "./pages/EditCategory";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BagListing />} />
          <Route path="/gallery/:id" element={<BagGallery />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><BagListing /></ProtectedRoute>} />
          <Route path="/admin/add" element={<ProtectedRoute><AddBag /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute><EditBag /></ProtectedRoute>} />
          <Route path="/admin/category/add" element={<ProtectedRoute><AddCategory /></ProtectedRoute>} />
          <Route path="/admin/category/edit/:id" element={<ProtectedRoute><EditCategory /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
