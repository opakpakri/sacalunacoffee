import React, { useEffect, useState, useRef, useCallback } from "react"; // Tambahkan useCallback
import { useLocation, useNavigate } from "react-router-dom";
import LogoImage from "../../assets/images/logo.webp";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Navbar from "../../components/Navbar";
import SidebarCashier from "../../components/SidebarCashier";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

function InvoiceOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [transactionData, setTransactionData] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null); // <--- State baru untuk pesan error autentikasi

  // Fungsi terpusat untuk menangani error autentikasi dan redirect
  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (InvoiceOrdersPage):",
        errorData,
        "Status HTTP:",
        res.status
      );

      let errorMessage = "";
      if (res.status === 401 && errorData.expired) {
        errorMessage =
          "Sesi Anda telah berakhir karena token kadaluarsa. Anda akan dialihkan ke halaman login.";
      } else if (res.status === 401 || res.status === 403) {
        errorMessage =
          errorData.message ||
          "Anda tidak memiliki izin untuk mengakses atau melakukan tindakan ini.";
      } else {
        errorMessage =
          "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
      }

      setAuthError(errorMessage); // Set pesan error ke state

      // Lakukan redirect setelah beberapa detik
      setTimeout(() => {
        localStorage.clear(); // Bersihkan localStorage
        navigate("/"); // Arahkan ke halaman login
      }, 3000); // Redirect setelah 3 detik
    },
    [navigate]
  ); // navigate ditambahkan ke dependency useCallback

  const fetchOrderItems = useCallback(
    async (trans) => {
      setLoading(true);
      setError(null);
      setAuthError(null); // Reset authError saat fetch dimulai

      try {
        const token = localStorage.getItem("adminToken"); // <--- Dapatkan token
        const response = await fetch(
          `http://localhost:3000/api/transactions-cashier/${trans.id_order}/items`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // <--- Sertakan token di header
            },
          }
        );
        if (!response.ok) {
          await handleAuthenticationError(response); // Tangani error autentikasi
          return; // Hentikan eksekusi jika ada error autentikasi
        }
        const data = await response.json();
        setInvoiceItems(data);
      } catch (err) {
        console.error("Error fetching invoice items:", err);
        setError("Gagal memuat detail item invoice: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [handleAuthenticationError]
  ); // handleAuthenticationError ditambahkan ke dependency useCallback

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || user?.role !== "Cashier") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }

    if (location.state && location.state.transactionData) {
      const trans = location.state.transactionData;
      setTransactionData(trans);
      fetchOrderItems(trans); // Panggil fetchOrderItems dengan data transaksi
    } else {
      setError("Data transaksi tidak ditemukan. Kembali ke halaman transaksi.");
      setLoading(false);
    }
  }, [location.state, navigate, fetchOrderItems]); // fetchOrderItems ditambahkan sebagai dependency

  // Calculate total amount from items
  const totalAmount = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  // Calculate amount paid and change due
  const amountPaid = transactionData?.amount_paid || 0;
  const changeDue = amountPaid > totalAmount ? amountPaid - totalAmount : 0;

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
          if (prop === "backgroundColor") {
            el.style[prop] = "#ffffff";
          } else {
            el.style[prop] = "#000000";
          }
        }
      });

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
    }
  };

  const handleGeneratePdf = async () => {
    if (!invoiceRef.current) {
      console.error("Invoice ref is null. Cannot generate PDF.");
      alert("Konten invoice belum siap untuk dibuat PDF.");
      return;
    }

    const printButton = document.getElementById("print-pdf-button");
    const backButton = document.getElementById("back-payment-button");
    const proofImage = invoiceRef.current.querySelector(".proof-image");
    const proofText = invoiceRef.current.querySelector(".proof-text");

    const originalInvoiceStyle = {
      maxHeight: invoiceRef.current.style.maxHeight,
      overflowY: invoiceRef.current.style.overflowY,
      height: invoiceRef.current.style.height,
    };

    if (printButton) printButton.style.display = "none";
    if (backButton) backButton.style.display = "none";
    if (proofImage) proofImage.style.display = "none";
    if (proofText) proofText.style.display = "none";

    invoiceRef.current.style.maxHeight = "none";
    invoiceRef.current.style.overflowY = "visible";
    invoiceRef.current.style.height = "auto";

    try {
      const images = invoiceRef.current.querySelectorAll("img");
      const imageLoadPromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imageLoadPromises);

      patchColors(invoiceRef.current);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -heightLeft;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const paymentId = transactionData?.id_payment || "unknown_payment";
      pdf.save(`invoice_${paymentId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi. Detail: " + error.message);
    } finally {
      if (printButton) printButton.style.display = "block";
      if (backButton) backButton.style.display = "block";
      if (proofImage) proofImage.style.display = "block";
      if (proofText) proofText.style.display = "block";

      invoiceRef.current.style.maxHeight = originalInvoiceStyle.maxHeight;
      invoiceRef.current.style.overflowY = originalInvoiceStyle.overflowY;
      invoiceRef.current.style.height = originalInvoiceStyle.height;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex flex-1">
        <SidebarCashier />
        <div className="flex-1 p-8 flex flex-col items-center">
          {/* Bagian untuk menampilkan pesan error autentikasi */}
          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 w-full"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}

          {/* Kotak Scrollable */}
          <div
            className="bg-white shadow-lg p-8"
            ref={invoiceRef}
            style={{
              width: "210mm",
              maxHeight: "200mm",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            {/* === KONTEN INVOICE MULAI DI SINI === */}
            {loading ? (
              <p className="text-center text-gray-500">Memuat Invoice...</p>
            ) : error ? (
              <div className="text-center text-red-600">
                <p>{error}</p>
                {!transactionData && (
                  <button
                    onClick={() => navigate("/transactionsCashier")}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Kembali ke Data Transaksi
                  </button>
                )}
              </div>
            ) : !transactionData ? (
              <div className="text-center text-gray-500">
                <p>Tidak ada data invoice yang tersedia.</p>
                <button
                  onClick={() => navigate("/transactionsCashier")}
                  className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Kembali ke Data Transaksi
                </button>
              </div>
            ) : (
              <>
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 border-b pb-4">
                  <div className="text-left flex flex-col">
                    <div className="flex items-center mb-1">
                      <img
                        src={LogoImage}
                        alt="Sacaluna"
                        className="h-10 w-10 mr-2"
                      />
                      <h1 className="text-2xl font-bold leading-tight">
                        Sacaluna Coffee
                      </h1>
                    </div>
                    <p className="text-xs text-gray-600 max-w-xs">
                      Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,
                      Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
                    </p>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold mb-2">
                      INVOICE #{transactionData?.id_order || "N/A"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Jenis Pembayaran:{" "}
                      <span className="font-semibold">
                        {transactionData?.payment_method === "online_payment"
                          ? "Online"
                          : "Cashier"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Tanggal Pembayaran:{" "}
                      <span className="font-semibold">
                        {paymentTimeFormatted}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Customer and Order Details Section */}
                <div className="flex justify-between mb-8">
                  <div className="text-left w-1/2 pr-4">
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

                  <div className="text-left w-1/2 pl-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Detail Pesanan:
                    </h3>
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

                {/* Items Table Section */}
                <div className="mb-8 border border-black rounded-md overflow-hidden">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">
                          Produk
                        </th>
                        <th className="py-2 px-4 text-center text-sm font-semibold text-gray-700">
                          Jumlah
                        </th>
                        <th className="py-2 px-4 text-right text-sm font-semibold text-gray-700">
                          Harga Satuan
                        </th>
                        <th className="py-2 px-4 text-right text-sm font-semibold text-gray-700">
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
                          <td className="py-3 px-4 text-left">
                            {item.menu_name || `ID: ${item.id_menu}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right">
                            Rp {item.price.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            Rp{" "}
                            {(item.quantity * item.price).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total Amount, Amount Paid, Change Due */}
                  <div className="flex justify-end p-4 bg-gray-100 border-t border-gray-200 flex-col items-end">
                    <div className="text-right text-xl font-bold mb-2">
                      <p>
                        Total Harga: Rp {totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    {/* Amount Paid */}
                    <div className="text-right text-xl font-bold mb-2">
                      <p>
                        Jumlah Dibayar: Rp {amountPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                    {/* Change Due (if applicable) */}
                    {changeDue > 0 && (
                      <div className="text-right text-xl font-bold text-green-700">
                        <p>
                          Uang Kembalian: Rp {changeDue.toLocaleString("id-ID")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className="mb-4">Thank You, See You Again</p>
                  <FontAwesomeIcon icon={faHeart} />
                  <FontAwesomeIcon icon={faHeart} />
                  <FontAwesomeIcon icon={faHeart} />
                </div>

                <div style={{ minHeight: "20mm" }}></div>
              </>
            )}
          </div>

          {/* Tombol di luar kotak scrollable */}
          <div
            className="flex justify-end gap-4 mt-6 px-8 py-4 "
            style={{ width: "210mm", boxSizing: "border-box" }}
          >
            <button
              id="back-payment-button"
              onClick={() => navigate("/transactionsCashier")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Kembali ke Data Transaction
            </button>
            <button
              id="print-pdf-button"
              onClick={handleGeneratePdf}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceOrdersPage;
