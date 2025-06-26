import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CheckoutPage from "./pages/CheckoutPage";
import CompletePaymentPage from "./pages/CompletePaymentPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Path default tanpa nomor meja */}
        <Route path="/" element={<Home />} />

        {/* Path dengan nomor meja sebagai param */}
        <Route path="/table/:tableNumber/:token" element={<Home />} />
        <Route
          path="/table/:tableNumber/:token/checkout"
          element={<CheckoutPage />}
        />
        <Route
          path="/table/:tableNumber/:token/complete-payment"
          element={<CompletePaymentPage />}
        />

        {/* Tambahan untuk mendukung navigasi langsung via query string */}
        <Route path="/complete-payment" element={<CompletePaymentPage />} />
      </Routes>
    </Router>
  );
}

export default App;
