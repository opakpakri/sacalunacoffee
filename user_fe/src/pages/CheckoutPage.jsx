import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import LogoImage from "../assets/images/logo.webp";

function CheckoutPage() {
  const { tableNumber, token } = useParams();
  const [isValidToken, setIsValidToken] = useState(null); // null = loading
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({
    name_customer: "",
    phone: "",
    payment_method: "pay_at_cashier",
    payment_type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission feedback

  // --- Token Validation Effect ---
  useEffect(() => {
    if (tableNumber && token) {
      fetch(`http://localhost:3000/api/tables/validate/${tableNumber}/${token}`)
        .then((res) => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then(() => {
          setIsValidToken(true);
        })
        .catch((err) => {
          console.error("Validation error:", err);
          setIsValidToken(false);
        });
    } else {
      setIsValidToken(false);
    }
  }, [tableNumber, token]);

  // --- Cart Loading Effect ---
  useEffect(() => {
    const storedCart =
      JSON.parse(localStorage.getItem(`cart_${tableNumber}`))?.cart || [];
    setCart(storedCart);
  }, [tableNumber]);

  // --- Total Amount Calculation ---
  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // --- Form Input Handler ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
    // Reset custom validity on change
    e.target.setCustomValidity("");
  };

  // --- Phone Input Specific Handler ---
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Allow only digits
    if (/^\d*$/.test(value)) {
      setForm((prevForm) => ({ ...prevForm, phone: value }));
      e.target.setCustomValidity("");
    } else {
      e.target.setCustomValidity("Nomor telepon hanya boleh mengandung angka.");
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable button and show loading

    if (cart.length === 0) {
      alert("Keranjang kosong. Silakan pilih menu terlebih dahulu.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      ...form,
      table_number: tableNumber,
      amount: totalAmount,
      items: cart,
      status: "pending", // Initial status for new orders
      order_time: new Date().toISOString(),
    };

    try {
      const res = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        localStorage.removeItem(`cart_${tableNumber}`);
        alert("Pesanan berhasil dibuat!");
        navigate(
          `/table/${tableNumber}/${token}/complete-payment?method=${form.payment_method}&table=${tableNumber}&token=${token}`,
          {
            state: {
              fromCheckout: true,
              totalAmount: totalAmount, // <--- ADDED THIS LINE
            },
            replace: true,
          }
        );
      } else {
        const errorData = await res.json();
        alert(
          `Gagal membuat pesanan: ${errorData.message || "Terjadi kesalahan."}`
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Terjadi kesalahan jaringan atau server. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };

  // --- Loading State UI (Full-screen for responsiveness) ---
  if (isValidToken === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        {" "}
        {/* Added p-4 */}
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
          {" "}
          {/* Added max-w-sm w-full */}
          <p className="text-xl font-semibold text-gray-700">
            Memverifikasi meja Anda...
          </p>
          <div className="mt-4 animate-spin rounded-full h-12 w-12 border-4 border-t-yellow-500 border-gray-200 mx-auto"></div>
        </div>
      </div>
    );
  }

  // --- Invalid Token UI (Full-screen for responsiveness) ---
  if (isValidToken === false) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        {" "}
        {/* Added p-4 */}
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
          {" "}
          {/* Added max-w-sm w-full */}
          <p className="text-red-600 font-bold text-2xl mb-4">Akses Ditolak!</p>
          <p className="text-gray-700 text-lg">
            Token meja tidak valid atau kadaluarsa. Silakan scan ulang QR Code.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors w-full" /* Added w-full */
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  // --- Main Checkout UI ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 md:px-8 bg-gray-50 font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row
                   min-h-[600px] md:min-h-[unset] /* Responsive min-height */
                   max-h-[95vh] /* Max height for mobile to prevent overflow */
                   md:max-h-none /* No max height on desktop */
                   overflow-y-auto /* Allow scrolling if content overflows on mobile */
                   animate-fade-in-up"
      >
        {/* Left Section: Customer Data & Payment Method */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 md:p-10 space-y-4 sm:space-y-5 relative border-r border-gray-100 flex-shrink-0">
          {" "}
          {/* Adjusted padding and space-y, flex-shrink-0 */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            {" "}
            {/* Responsive font size */}
            <img
              src={LogoImage}
              alt="Sacaluna"
              className="h-8 w-8 sm:h-9 sm:w-9"
            />{" "}
            {/* Responsive logo size */}
            Detail Pemesanan
          </h2>
          {/* Form Fields */}
          <div className="space-y-4 sm:space-y-5">
            {" "}
            {/* Adjusted space-y */}
            <div>
              <label
                htmlFor="name_customer"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nama Customer
              </label>
              <input
                id="name_customer"
                name="name_customer"
                type="text"
                className="block w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 text-base" /* Responsive padding/font */
                placeholder="Masukkan nama Anda"
                value={form.name_customer}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nomor Telepon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel" // Use type="tel" for phone numbers
                className="block w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 text-base" /* Responsive padding/font */
                placeholder="Contoh: 0812xxxxxxxx"
                value={form.phone}
                onChange={handlePhoneChange}
                pattern="^\d{10,13}$" // Enforce 10-13 digits if filled
                onInvalid={(e) => {
                  if (form.phone !== "") {
                    e.target.setCustomValidity(
                      "Nomor telepon harus 10-13 digit angka."
                    );
                  } else {
                    e.target.setCustomValidity("");
                  }
                }}
              />
            </div>
            <div>
              <label
                htmlFor="table_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nomor Meja
              </label>
              <input
                id="table_number"
                className="block w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed text-base" /* Responsive padding/font */
                value={tableNumber}
                disabled
              />
            </div>
            {/* Payment Method */}
            <div>
              <label
                htmlFor="payment_method"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Metode Pembayaran
              </label>
              <div className="relative">
                <select
                  id="payment_method"
                  name="payment_method"
                  className="block w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 pr-8 text-base" /* Responsive padding/font */
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_method: e.target.value,
                      payment_type:
                        e.target.value === "online_payment" ? "" : "cashier", // auto set payment type for cashier
                    })
                  }
                >
                  <option value="pay_at_cashier">Bayar di Kasir</option>
                  <option value="online_payment">Pembayaran Online</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>
            </div>
            {/* Online Payment Type (Conditional) */}
            {form.payment_method === "online_payment" && (
              <div>
                <label
                  htmlFor="payment_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pilih Pembayaran Online
                </label>
                <div className="relative">
                  <select
                    id="payment_type"
                    name="payment_type"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 pr-8 text-base" /* Responsive padding/font */
                    value={form.payment_type}
                    onChange={handleFormChange}
                    required // Make required when online payment is selected
                  >
                    <option value="" disabled>
                      Pilih opsi...
                    </option>
                    <option value="qris">QRIS</option>
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
                </div>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-3">
            {" "}
            {/* Adjusted mt */}
            <button
              type="submit"
              className="w-full max-w-xs bg-yellow-500 text-white py-2 sm:py-3 rounded-lg font-semibold text-lg shadow-md
                          hover:bg-yellow-600 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting} // Disable when submitting
            >
              {isSubmitting ? "Memproses Pesanan..." : "Konfirmasi & Bayar"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-red-600 hover:text-red-800 hover:underline text-sm transition-colors duration-200"
            >
              Kembali ke Pemesanan
            </button>
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="w-full md:w-2/5 p-6 sm:p-8 md:p-10 bg-gray-50 flex flex-col justify-between flex-shrink-0">
          {" "}
          {/* Adjusted padding, flex-shrink-0 */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-6">
              {" "}
              {/* Responsive font size */}
              Ringkasan Pesanan
            </h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8 sm:py-10">
                {" "}
                {/* Adjusted padding */}
                Keranjang kosong.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-96 overflow-y-auto pr-2">
                {" "}
                {/* Adjusted space-y and max-height */}
                {cart.map((item) => (
                  <div
                    key={item.id_menu}
                    className="flex justify-between items-start text-sm sm:text-base border-b border-gray-200 pb-2 last:border-b-0" /* Responsive font size */
                  >
                    <span className="text-gray-800 font-medium truncate w-3/5">
                      {item.name_menu}{" "}
                      <span className="text-gray-500 font-normal">
                        x {item.quantity}
                      </span>
                    </span>
                    <span className="text-gray-900 font-semibold text-right w-2/5">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Total Amount & Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            {" "}
            {/* Adjusted mt and pt */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              {" "}
              {/* Adjusted mb */}
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {" "}
                {/* Responsive font size */}
                Total Harga:
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-yellow-600">
                {" "}
                {/* Responsive font size */}
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 mt-3 sm:mt-4">
              {" "}
              {/* Responsive font size and mt */}
              <img
                src={LogoImage}
                alt="Sacaluna"
                className="h-5 w-5 sm:h-6 sm:w-6"
              />{" "}
              {/* Responsive logo size */}
              <span>Sacaluna Coffee &copy; 2024</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
