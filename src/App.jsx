import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

/* Scrolls to top on every route change */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import BagListing from "./pages/BagListing";
import BagGallery from "./pages/BagGallery";
import Login from "./pages/Login";
import AddBag from "./pages/AddBag";
import EditBag from "./pages/EditBag";
import AddCollection from "./pages/AddCollection";
import EditCollection from "./pages/EditCollection";
import AddType from "./pages/AddType";
import EditType from "./pages/EditType";
import CartPage from "./pages/CartPage";
import DeliveryPage from "./pages/DeliveryPage";
import PaymentPage from "./pages/PaymentPage";
import AdminOrderPage from "./pages/AdminOrderPage";

const App = () => {
  /* ── Global mouse tracker for button glow effect ── */
  useEffect(() => {
    const onMove = (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <CartProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<BagListing />} />
            <Route path="/gallery/:id" element={<BagGallery />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout/delivery" element={<DeliveryPage />} />
            <Route path="/checkout/payment" element={<PaymentPage />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><BagListing /></ProtectedRoute>} />
            <Route path="/admin/add" element={<ProtectedRoute><AddBag /></ProtectedRoute>} />
            <Route path="/admin/edit/:id" element={<ProtectedRoute><EditBag /></ProtectedRoute>} />
            <Route path="/admin/collection/add" element={<ProtectedRoute><AddCollection /></ProtectedRoute>} />
            <Route path="/admin/collection/edit/:id" element={<ProtectedRoute><EditCollection /></ProtectedRoute>} />
            <Route path="/admin/type/add" element={<ProtectedRoute><AddType /></ProtectedRoute>} />
            <Route path="/admin/type/edit/:id" element={<ProtectedRoute><EditType /></ProtectedRoute>} />
            <Route path="/admin/order/:token" element={<ProtectedRoute><AdminOrderPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  );
};

export default App;
