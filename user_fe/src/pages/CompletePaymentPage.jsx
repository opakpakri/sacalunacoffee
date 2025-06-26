import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import QRISImage from "../assets/images/qriscode.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faMoneyBillWave,
  faTimesCircle,
  faSpinner,
  faArrowLeft,
  faMoneyBillTransfer, // For nominal input section
  faMoneyBill1Wave, // New icon for amount due
} from "@fortawesome/free-solid-svg-icons";

function CompletePaymentPage() {
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method");
  const tableNumber = searchParams.get("table");
  const token = searchParams.get("token");
  const isOnlinePayment = method === "online_payment";

  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNominalConfirmation, setShowNominalConfirmation] = useState(false);
  const [nominalInput, setNominalInput] = useState("");
  const [amountDue, setAmountDue] = useState(0);
  const [fetchDetailsLoading, setFetchDetailsLoading] = useState(true);
  const [fetchDetailsError, setFetchDetailsError] = useState(null);

  // Redirect if not coming from checkout
  useEffect(() => {
    if (!location.state || location.state.fromCheckout === false) {
      // Ensure correct template literal syntax here
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  // NEW: Fetch payment details including the amount
  const fetchPaymentDetails = useCallback(async () => {
    setFetchDetailsLoading(true);
    setFetchDetailsError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/api/payments/details?table=${tableNumber}&token=${token}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch payment details."
        );
      }
      const data = await response.json();
      setAmountDue(data.amount);
      setError(null);
    } catch (err) {
      console.error("Error fetching payment details:", err);
      setFetchDetailsError("Gagal memuat detail pembayaran: " + err.message);
      setError("Gagal memuat detail pembayaran. Mohon coba lagi.");
    } finally {
      setFetchDetailsLoading(false);
    }
  }, [tableNumber, token]);

  useEffect(() => {
    if (isOnlinePayment) {
      fetchPaymentDetails();
    } else {
      setFetchDetailsLoading(false); // No details to fetch for cashier payment
    }
  }, [isOnlinePayment, fetchPaymentDetails]);

  // handleBackToMenu
  const handleBackToMenu = () => {
    sessionStorage.removeItem("showPaymentReminder");
    sessionStorage.removeItem("paymentReminderToken");

    if (isOnlinePayment) {
      // Ensure correct template literal syntax here
      sessionStorage.setItem("showPaymentReminder", "true");
      sessionStorage.setItem("paymentReminderToken", token);

      navigate(`/table/${tableNumber}/${token}?paymentStatus=pending`, {
        replace: true,
      });
    } else {
      // Ensure correct template literal syntax here
      navigate(`/table/${tableNumber}/${token}`, { replace: true });
    }
  };

  // handleProceedToNominalConfirmation
  const handleProceedToNominalConfirmation = () => {
    if (isOnlinePayment) {
      if (fetchDetailsError) {
        alert(
          "Tidak dapat melanjutkan karena gagal memuat detail pembayaran. Silakan coba lagi."
        );
        return;
      }
      setShowNominalConfirmation(true);
      setError(null);
    } else {
      alert("Silakan menuju ke kasir untuk menyelesaikan pembayaran.");
    }
  };

  // handleFinalPaymentConfirmation
  const handleFinalPaymentConfirmation = async () => {
    if (isOnlinePayment) {
      const parsedNominal = parseFloat(nominalInput);
      const tolerance = 0.01; // Using the same tolerance as backend

      if (isNaN(parsedNominal) || parsedNominal <= 0) {
        alert("Mohon masukkan nominal pembayaran yang valid.");
        return;
      }
      if (parsedNominal < amountDue - tolerance) {
        // Check for underpayment with tolerance
        alert(
          `Nominal yang dibayar kurang dari jumlah tagihan. Kekurangan: Rp ${(
            amountDue - parsedNominal
          ).toLocaleString("id-ID")}`
        );
        return; // Prevent API call
      }
      if (parsedNominal > amountDue + tolerance) {
        // Check for overpayment with tolerance
        alert(
          `Nominal yang dibayar melebihi jumlah tagihan. Kelebihan: Rp ${(
            parsedNominal - amountDue
          ).toLocaleString("id-ID")}. Pembayaran QRIS harus sesuai nominal.`
        );
        return; // Prevent API call
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        tableNumber,
        token,
        ...(isOnlinePayment && { amountPaid: parseFloat(nominalInput) }),
      };

      const response = await fetch(
        "http://localhost:3000/api/payments/success",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal memperbarui status pembayaran");
      }

      sessionStorage.removeItem("showPaymentReminder");
      sessionStorage.removeItem("paymentReminderToken");

      alert(
        "Pembayaran berhasil dikonfirmasi dan pesanan Anda sedang diproses!"
      );
      // Ensure correct template literal syntax here
      navigate(`/table/${tableNumber}/${token}`, { replace: true });
    } catch (err) {
      console.error("Gagal menyelesaikan pembayaran:", err);
      setError(err.message);
      alert("Gagal menyelesaikan pembayaran: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // handleCancelPayment
  const handleCancelPayment = async () => {
    const confirmCancel = window.confirm(
      "Yakin ingin membatalkan pesanan ini? Aksi ini tidak bisa dibatalkan."
    );
    if (!confirmCancel) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://localhost:3000/api/payments/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tableNumber, token }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal membatalkan pembayaran");
      }

      sessionStorage.removeItem("showPaymentReminder");
      sessionStorage.removeItem("paymentReminderToken");

      alert("Pembayaran dibatalkan. Pesanan Anda akan dibatalkan.");
      // Ensure correct template literal syntax here
      navigate(`/table/${tableNumber}/${token}`, { replace: true });
    } catch (err) {
      console.error("Gagal membatalkan pembayaran:", err);
      setError(err.message);
      alert("Gagal membatalkan pembayaran: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state for fetching details
  if (isOnlinePayment && fetchDetailsLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-yellow-100 to-white p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-yellow-500 text-6xl mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 leading-tight">
            Memuat Detail Pembayaran...
          </h1>
          <p className="text-lg text-gray-700">Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  // Render error state for fetching details
  if (isOnlinePayment && fetchDetailsError) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-100 to-white p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center">
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="text-red-500 text-6xl mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 leading-tight">
            Error Memuat Pembayaran
          </h1>
          <p className="text-lg text-red-700 mb-6">{fetchDetailsError}</p>
          <button
            onClick={() => window.location.reload()} // Simple reload to retry
            className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-yellow-100 to-white p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center transform transition-all duration-300 hover:scale-[1.01] animate-fade-in">
        {/* Conditional rendering for the main title and checkmark icon */}
        {!showNominalConfirmation && (
          <>
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-green-500 text-6xl mb-6 animate-bounce-in"
            />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 leading-tight">
              Pesanan Anda Berhasil Dibuat!
            </h1>
          </>
        )}

        {isOnlinePayment ? (
          // --- Online Payment Flow ---
          <>
            {!showNominalConfirmation ? (
              // Step 1: Initial QRIS instruction and "Selesaikan Pembayaran" button
              <>
                <p className="text-lg text-gray-700 mb-8">
                  Silakan selesaikan pembayaran dengan metode{" "}
                  <span className="font-bold text-yellow-600">QRIS</span> ini.
                  Scan QR Code menggunakan aplikasi e-wallet Anda.
                </p>
                <div className="flex flex-col items-center gap-4">
                  {error && (
                    <p className="text-red-500 text-sm mb-2 px-4 py-2 bg-red-100 border border-red-200 rounded">
                      Error: {error}
                    </p>
                  )}
                  <button
                    onClick={handleProceedToNominalConfirmation} // Now proceeds to next step
                    className="w-full max-w-xs bg-yellow-500 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-yellow-600 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    ) : (
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    )}
                    <span>Selesaikan Pembayaran</span>
                  </button>
                  <button
                    onClick={handleBackToMenu}
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    <span>Kembali ke Menu</span>
                  </button>
                  <button
                    onClick={handleCancelPayment}
                    className="w-full max-w-xs bg-red-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-red-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                    <span>Batalkan Pesanan</span>
                  </button>
                </div>
              </>
            ) : (
              // Step 2: Nominal confirmation UI
              <>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 leading-tight">
                  Konfirmasi Pembayaran
                </h2>
                <p className="text-lg text-gray-700 font-semibold flex items-center justify-center gap-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-green-500 text-xl"
                  />
                  Pembayaran QRIS sedang diproses.
                </p>

                {/* Display Amount to be paid */}
                <p className="text-xl text-gray-800 font-bold mb-4 flex items-center justify-center gap-2">
                  <FontAwesomeIcon
                    icon={faMoneyBill1Wave}
                    className="text-yellow-600"
                  />
                  Jumlah yang harus dibayar:
                </p>
                <p className="text-4xl md:text-5xl font-extrabold text-yellow-700 mb-6">
                  Rp {amountDue.toLocaleString("id-ID")}
                </p>

                <div className="flex justify-center mb-6">
                  <div>
                    <img
                      src={QRISImage}
                      alt="QRIS Code"
                      className="object-contain"
                    />
                  </div>
                </div>
                <p className="text-md text-gray-700 mb-4 font-medium flex items-center justify-center gap-2">
                  <FontAwesomeIcon
                    icon={faMoneyBillTransfer}
                    className="text-gray-600"
                  />
                  Dimohon input nominal yang dibayar:
                </p>
                <div className="mb-6">
                  <input
                    type="number"
                    placeholder="Masukkan nominal"
                    value={nominalInput}
                    onChange={(e) => setNominalInput(e.target.value)}
                    className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-lg text-center
                                       focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="flex flex-col items-center gap-4">
                  {error && (
                    <p className="text-red-500 text-sm mb-2 px-4 py-2 bg-red-100 border border-red-200 rounded">
                      Error: {error}
                    </p>
                  )}
                  <button
                    onClick={handleFinalPaymentConfirmation}
                    className="w-full max-w-xs bg-green-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-green-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    ) : (
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    )}
                    <span>Konfirmasi Pembayaran</span>
                  </button>
                  <button
                    onClick={() => setShowNominalConfirmation(false)}
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    <span>Kembali</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-lg text-gray-700 mb-8">
              Silakan menuju ke{" "}
              <span className="font-bold text-yellow-600">Kasir</span> untuk
              menyelesaikan pembayaran Anda. Nomor meja Anda adalah{" "}
              <span className="font-bold text-gray-900">{tableNumber}</span>.
            </p>
            <div className="flex justify-center mb-8">
              <FontAwesomeIcon
                icon={faMoneyBillWave}
                className="text-yellow-500 text-8xl md:text-9xl animate-pulse"
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              {error && (
                <p className="text-red-500 text-sm mb-2 px-4 py-2 bg-red-100 border border-red-200 rounded">
                  Error: {error}
                </p>
              )}
              <button
                onClick={handleBackToMenu}
                className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                <span>Kembali ke Menu</span>
              </button>
              <button
                onClick={handleCancelPayment}
                className="w-full max-w-xs bg-red-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                               hover:bg-red-700 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                <span>Batalkan Pesanan</span>
              </button>
            </div>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Sacaluna Coffee | Terima Kasih atas kunjungan Anda!
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompletePaymentPage;
