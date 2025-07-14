import React, { useEffect, useState, useCallback, useRef } from "react"; // Tambahkan useRef
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import QRISImage from "../assets/images/qriscode.webp"; // Pastikan ini adalah QRIS code
import LogoImage from "../assets/images/logo.webp"; // Import logo kamu jika ingin menampilkannya di invoice PDF
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faMoneyBillWave,
  faTimesCircle,
  faSpinner,
  faArrowLeft,
  faMoneyBillTransfer, // For nominal input section
  faMoneyBill1Wave, // New icon for amount due
  faDownload, // Icon untuk tombol download PDF
  faHeart, // Untuk invoice PDF
} from "@fortawesome/free-solid-svg-icons";

// Impor html2canvas dan jspdf
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function CompletePaymentPage() {
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method");
  const tableNumber = searchParams.get("table");
  const token = searchParams.get("token");
  const isOnlinePayment = method === "online_payment";

  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef(); // Ref untuk konten invoice yang akan di-PDF

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNominalConfirmation, setShowNominalConfirmation] = useState(false);
  const [nominalInput, setNominalInput] = useState("");
  const [amountDue, setAmountDue] = useState(0);
  const [fetchDetailsLoading, setFetchDetailsLoading] = useState(true);
  const [fetchDetailsError, setFetchDetailsError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // State baru untuk menyimpan data transaksi lengkap dan itemnya
  const [transactionData, setTransactionData] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Redirect if not coming from checkout
  useEffect(() => {
    if (!location.state || location.state.fromCheckout === false) {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  // Fetch payment details including the amount AND items
  const fetchPaymentDetails = useCallback(async () => {
    setFetchDetailsLoading(true);
    setFetchDetailsError(null);
    try {
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/payments/details?table=${tableNumber}&token=${token}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch payment details."
        );
      }
      const data = await response.json();
      setAmountDue(data.amount);
      setTransactionData(data); // Simpan semua data transaksi
      setInvoiceItems(data.order_items || []); // Simpan item-itemnya
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
      sessionStorage.setItem("showPaymentReminder", "true");
      sessionStorage.setItem("paymentReminderToken", token);

      navigate(`/table/${tableNumber}/${token}?paymentStatus=pending`, {
        replace: true,
      });
    } else {
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
        "https://sacalunacoffee-production.up.railway.app/api/payments/success",
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

      setShowSuccessMessage(true);
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
        "https://sacalunacoffee-production.up.railway.app/api/payments/cancel",
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
      navigate(`/table/${tableNumber}/${token}`, { replace: true });
    } catch (err) {
      console.error("Gagal membatalkan pembayaran:", err);
      setError(err.message);
      alert("Gagal membatalkan pembayaran: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper untuk memformat tanggal/waktu
  const dateTimeOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const orderTimeFormatted = transactionData?.order_time
    ? new Date(transactionData.order_time).toLocaleString(
        "id-ID",
        dateTimeOptions
      )
    : "-";

  const paymentTimeFormatted = transactionData?.payment_time
    ? new Date(transactionData.payment_time).toLocaleString(
        "id-ID",
        dateTimeOptions
      )
    : "-";

  // Fungsi patchColors untuk memperbaiki warna di PDF
  const patchColors = (element) => {
    const treeWalker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT
    );
    while (treeWalker.nextNode()) {
      const el = treeWalker.currentNode;
      const style = getComputedStyle(el);

      ["color", "backgroundColor", "borderColor"].forEach((prop) => {
        const value = style[prop];
        if (value && value.includes("oklch")) {
          // Ganti warna oklch ke warna yang lebih umum untuk PDF
          if (prop === "backgroundColor") {
            el.style[prop] = "#ffffff";
          } else {
            el.style[prop] = "#000000";
          }
        }
      });

      // Tambahkan patch untuk class Tailwind CSS agar warna konsisten di PDF
      if (el.classList.contains("bg-gray-50")) {
        el.style.backgroundColor = "#f9fafb";
      }
      if (el.classList.contains("bg-gray-100")) {
        el.style.backgroundColor = "#f3f4f6";
      }
      if (el.classList.contains("bg-gray-200")) {
        el.style.backgroundColor = "#e5e7eb";
      }
      if (el.classList.contains("text-gray-700")) {
        el.style.color = "#374151";
      }
      if (el.classList.contains("text-gray-600")) {
        el.style.color = "#4b5563";
      }
      if (el.classList.contains("text-yellow-600")) {
        el.style.color = "#d97706"; // Warna kuning yang lebih umum
      }
      if (el.classList.contains("text-gray-900")) {
        el.style.color = "#111827"; // Warna hitam yang lebih umum
      }
      if (el.classList.contains("text-yellow-700")) {
        el.style.color = "#b45309"; // Warna kuning gelap yang lebih umum
      }
      if (el.classList.contains("text-green-700")) {
        el.style.color = "#047857"; // Warna hijau gelap yang lebih umum
      }
    }
  };

  // Fungsi untuk menghasilkan PDF
  const handleGeneratePdf = async () => {
    if (!invoiceRef.current) {
      console.error("Invoice ref is null. Cannot generate PDF.");
      alert("Konten invoice belum siap untuk dibuat PDF.");
      return;
    }

    // Temporarily adjust style for PDF rendering (hidden element)
    const originalStyle = invoiceRef.current.style.cssText; // Simpan style asli
    invoiceRef.current.style.width = "210mm"; // Lebar A4
    invoiceRef.current.style.maxHeight = "none";
    invoiceRef.current.style.overflowY = "visible";
    invoiceRef.current.style.height = "auto";
    invoiceRef.current.style.position = "static"; // Pastikan terlihat oleh html2canvas
    invoiceRef.current.style.visibility = "visible";
    invoiceRef.current.style.display = "block"; // Pastikan block level

    try {
      // Pastikan semua gambar di dalam invoice sudah termuat
      const images = invoiceRef.current.querySelectorAll("img");
      const imageLoadPromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Tetap resolve meskipun error agar tidak stuck
        });
      });
      await Promise.all(imageLoadPromises);

      // Patch warna sebelum membuat canvas
      patchColors(invoiceRef.current);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Meningkatkan resolusi gambar di PDF
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff", // Pastikan latar belakang putih
      });

      const imgData = canvas.toDataURL("image/jpeg", 1); // Kualitas 1 (terbaik)

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = pdf.internal.pageSize.getWidth(); // Lebar halaman PDF
      const pageHeight = pdf.internal.pageSize.getHeight(); // Tinggi halaman PDF
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Tinggi gambar di PDF

      let heightLeft = imgHeight;
      let position = 0;

      // Tambahkan gambar ke PDF, pecah jika lebih dari satu halaman
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -heightLeft;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const paymentId = transactionData?.id_payment || "unknown_payment";
      pdf.save(`invoice_sacaluna_${paymentId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi. Detail: " + error.message);
    } finally {
      // Kembalikan style asli setelah selesai
      invoiceRef.current.style.cssText = originalStyle;
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

  // Render success message after payment confirmation
  if (showSuccessMessage) {
    // Hitung totalAmount dan changeDue di sini
    const totalAmount = invoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const amountPaid = transactionData?.amount_paid || 0;
    const changeDue = amountPaid > totalAmount ? amountPaid - totalAmount : 0;

    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-100 to-white p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center transform transition-all duration-300 hover:scale-[1.01] animate-fade-in">
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="text-green-500 text-6xl mb-6 animate-bounce-in"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 leading-tight">
            Pembayaran QRIS Anda Berhasil!
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Pesanan akan segera kami proses, mohon ditunggu. Terima Kasih!
          </p>

          {/* Tombol Download Invoice - hanya tampil jika ada data transaksi */}
          {transactionData && (
            <button
              onClick={handleGeneratePdf}
              className="w-full max-w-xs bg-purple-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                         hover:bg-purple-700 transition-colors duration-300 transform hover:scale-105 mb-4 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              <span>Download Invoice</span>
            </button>
          )}

          <button
            onClick={() =>
              navigate(`/table/${tableNumber}/${token}`, { replace: true })
            }
            className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md
                       hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            <span>Kembali ke Menu</span>
          </button>

          {/* Hidden Invoice Content for PDF generation */}
          {/* Ini akan di render di DOM tapi tidak terlihat, kemudian ditangkap oleh html2canvas */}
          <div
            ref={invoiceRef}
            className="absolute top-[-9999px] left-[-9999px] w-[210mm] p-6 bg-white text-black" // Pastikan ukuran A4 dan warna dasar
            style={{
              fontSize: "12px", // Ukuran font dasar untuk PDF
              lineHeight: "1.5",
              color: "#000",
              // Penting: Pastikan display none agar tidak terlihat, tapi bisa di-patch to static/block saat generate PDF
              display: "none",
              visibility: "hidden",
              position: "absolute",
            }}
          >
            {/* INVOICE CONTENT */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
              <div className="text-left flex flex-col mb-4 sm:mb-0">
                <div className="flex items-center mb-1">
                  <img
                    src={LogoImage}
                    alt="Sacaluna"
                    className="h-8 w-8 mr-2"
                  />
                  <h1 className="text-xl font-bold leading-tight">
                    Sacaluna Coffee
                  </h1>
                </div>
                <p className="text-xs text-gray-600">
                  Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,
                  Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
                </p>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-bold mb-1">
                  INVOICE #{transactionData?.id_order || "N/A"}
                </h2>
                <p className="text-xs text-gray-600">
                  Jenis Pembayaran:{" "}
                  <span className="font-semibold">
                    {transactionData?.payment_method === "online_payment"
                      ? "Online"
                      : "Cashier"}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  Tanggal Pembayaran:{" "}
                  <span className="font-semibold">{paymentTimeFormatted}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mb-6 text-sm">
              <div className="text-left w-full sm:w-1/2 pr-0 sm:pr-4 mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold mb-2">
                  Informasi Pelanggan:
                </h3>
                <p>
                  <span className="font-semibold">Nama Pelanggan:</span>{" "}
                  {transactionData?.name_customer || "-"}
                </p>
                <p>
                  <span className="font-semibold">No. Telp:</span>{" "}
                  {transactionData?.phone || "-"}
                </p>
              </div>

              <div className="text-left w-full sm:w-1/2 pl-0 sm:pl-4">
                <h3 className="text-lg font-semibold mb-2">Detail Pesanan:</h3>
                <p>
                  <span className="font-semibold">ID Order:</span>{" "}
                  {transactionData?.id_order || "-"}
                </p>
                <p>
                  <span className="font-semibold">Tanggal Order:</span>{" "}
                  {orderTimeFormatted}
                </p>
                <p>
                  <span className="font-semibold">Metode Bayar:</span>{" "}
                  {transactionData?.payment_method === "online_payment"
                    ? "Online"
                    : "Cashier"}
                </p>
                <p>
                  <span className="font-semibold">Status Bayar:</span>{" "}
                  {transactionData?.payment_status || "-"}
                </p>
              </div>
            </div>

            <div className="mb-6 border border-black rounded-md overflow-hidden">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 text-left font-semibold text-gray-700">
                      Produk
                    </th>
                    <th className="py-2 px-3 text-center font-semibold text-gray-700">
                      Jumlah
                    </th>
                    <th className="py-2 px-3 text-right font-semibold text-gray-700">
                      Harga Satuan
                    </th>
                    <th className="py-2 px-3 text-right font-semibold text-gray-700">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-left">
                        {item.menu_name || `ID: ${item.id_menu}`}
                      </td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">
                        Rp {item.price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-right">
                        Rp{" "}
                        {(item.quantity * item.price).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end p-4 bg-gray-100 border-t border-gray-200 flex-col items-end text-base">
                <div className="text-right font-bold mb-1">
                  <p>Total Harga: Rp {totalAmount.toLocaleString("id-ID")}</p>
                </div>
                <div className="text-right font-bold mb-1">
                  <p>Jumlah Dibayar: Rp {amountPaid.toLocaleString("id-ID")}</p>
                </div>
                {changeDue > 0 && (
                  <div className="text-right font-bold text-green-700">
                    <p>
                      Uang Kembalian: Rp {changeDue.toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-6 text-sm">
              <p className="mb-3">Thank You, See You Again</p>
              <FontAwesomeIcon icon={faHeart} className="mx-1" />
              <FontAwesomeIcon icon={faHeart} className="mx-1" />
              <FontAwesomeIcon icon={faHeart} className="mx-1" />
            </div>
            {/* END INVOICE CONTENT */}
          </div>
          {/* End Hidden Invoice Content */}

          <div className="mt-8 pt-4 border-t border-gray-200 w-full max-w-lg">
            <p className="text-sm text-gray-500">
              Sacaluna Coffee | Terima Kasih atas kunjungan Anda!
            </p>
          </div>
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
