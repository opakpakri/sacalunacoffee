import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoImage from "../../assets/images/logo.webp";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import Navbar from "../../components/Navbar";
import SidebarCashier from "../../components/SidebarCashier";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faSpinner } from "@fortawesome/free-solid-svg-icons";

function InvoiceOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [transactionData, setTransactionData] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
      } else if (res.status === 404) {
        errorMessage = errorData.message || "Data tidak ditemukan.";
        setError(errorMessage);
        return;
      } else {
        errorMessage =
          "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
      }

      setAuthError(errorMessage);
      setError(errorMessage);

      setTimeout(() => {
        localStorage.clear();
        navigate("/");
      }, 3000);
    },
    [navigate]
  );

  const fetchOrderItems = useCallback(
    async (trans) => {
      setLoading(true);
      setError(null);
      setAuthError(null);

      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(
          `https://sacalunacoffee-production.up.railway.app/api/transactions-cashier/${trans.id_order}/items`,

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          await handleAuthenticationError(response);
          return;
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
  );

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
      fetchOrderItems(trans);
    } else {
      setError("Data transaksi tidak ditemukan. Kembali ke halaman transaksi.");
      setLoading(false);
    }
  }, [location.state, navigate, fetchOrderItems]);

  const totalAmount = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

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
    if (!transactionData) {
      alert("Data transaksi tidak lengkap untuk dibuat PDF.");
      return;
    }

    const printButton = document.getElementById("print-pdf-button");
    const backButton = document.getElementById("back-payment-button");

    const originalInvoiceDisplay = invoiceRef.current.style.display;
    const originalInvoiceVisibility = invoiceRef.current.style.visibility;
    const originalInvoicePosition = invoiceRef.current.style.position;
    const originalInvoiceWidth = invoiceRef.current.style.width;
    const originalInvoiceMaxHeight = invoiceRef.current.style.maxHeight;
    const originalInvoiceOverflowY = invoiceRef.current.style.overflowY;
    const originalInvoiceHeight = invoiceRef.current.style.height;

    if (printButton) printButton.style.display = "none";
    if (backButton) backButton.style.display = "none";

    // Set gaya pada div tersembunyi agar terlihat dan memiliki layout full-width
    invoiceRef.current.style.display = "block";
    invoiceRef.current.style.visibility = "visible";
    invoiceRef.current.style.position = "static";
    invoiceRef.current.style.width = "210mm";
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
        width: 210 * 3.779528,
        height: invoiceRef.current.scrollHeight,
        windowWidth: 210 * 3.779528,
        windowHeight: invoiceRef.current.scrollHeight,
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

      invoiceRef.current.style.display = originalInvoiceDisplay;
      invoiceRef.current.style.visibility = originalInvoiceVisibility;
      invoiceRef.current.style.position = originalInvoicePosition;
      invoiceRef.current.style.width = originalInvoiceWidth;
      invoiceRef.current.style.maxHeight = originalInvoiceMaxHeight;
      invoiceRef.current.style.overflowY = originalInvoiceOverflowY;
      invoiceRef.current.style.height = originalInvoiceHeight;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 relative">
        <SidebarCashier
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 p-4 md:p-8 lg:p-16 flex flex-col items-center overflow-auto">
          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 w-full max-w-4xl"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}
          <div
            className="bg-white shadow-lg p-6 md:p-8 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-4xl"
            style={{
              maxHeight: "80vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            {loading ? (
              <div className="text-center text-gray-500 py-10">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-3xl text-yellow-500 mb-4"
                />
                <p>Memuat Invoice...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-10">
                <p className="text-lg mb-4">{error}</p>
                {!transactionData && (
                  <button
                    onClick={() => navigate("/transactionsCashier")}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm md:text-base"
                  >
                    Kembali ke Data Transaksi
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Header Section (Visually Rendered) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 border-b pb-4">
                  <div className="text-left flex flex-col mb-4 sm:mb-0">
                    <div className="flex items-center mb-1">
                      <img
                        src={LogoImage}
                        alt="Sacaluna"
                        className="h-8 w-8 md:h-10 md:w-10 mr-2"
                      />
                      <h1 className="text-xl md:text-2xl font-bold leading-tight">
                        Sacaluna Coffee
                      </h1>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 max-w-full sm:max-w-xs">
                      Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,
                      Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
                    </p>
                  </div>

                  <div className="text-right">
                    <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                      INVOICE #{transactionData?.id_order || "N/A"}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600">
                      Jenis Pembayaran:{" "}
                      <span className="font-semibold">
                        {transactionData?.payment_method === "online_payment"
                          ? "Online"
                          : "Cashier"}
                      </span>
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      Tanggal Pembayaran:{" "}
                      <span className="font-semibold">
                        {paymentTimeFormatted}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Customer and Order Details Section (Visually Rendered) */}
                <div className="flex flex-col sm:flex-row justify-between mb-6 md:mb-8 text-sm md:text-base">
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

                {/* Items Table Section (Visually Rendered) */}
                <div className="mb-6 md:mb-8 border border-black rounded-md overflow-hidden">
                  <table className="min-w-full border-collapse text-sm md:text-base">
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
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-4 text-gray-500"
                          >
                            Tidak ada item dalam pesanan ini.
                          </td>
                        </tr>
                      ) : (
                        invoiceItems.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="py-2 px-3 text-left">
                              {item.menu_name}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-right">
                              Rp {item.price.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2 px-3 text-right">
                              Rp{" "}
                              {(item.quantity * item.price).toLocaleString(
                                "id-ID"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Total Amount, Amount Paid, Change Due */}
                  <div className="flex justify-end p-4 bg-gray-100 border-t border-gray-200 flex-col items-end text-base md:text-xl">
                    <div className="text-right font-bold mb-1">
                      <p>
                        Total Harga: Rp {totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    {/* Amount Paid */}
                    <div className="text-right font-bold mb-1">
                      <p>
                        Jumlah Dibayar: Rp {amountPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                    {/* Change Due (if applicable) */}
                    {changeDue > 0 && (
                      <div className="text-right font-bold text-green-700">
                        <p>
                          Uang Kembalian: Rp {changeDue.toLocaleString("id-ID")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mt-6 md:mt-8 text-sm md:text-base">
                  <p className="mb-3">Thank You, See You Again</p>
                  <FontAwesomeIcon icon={faHeart} className="mx-1" />
                  <FontAwesomeIcon icon={faHeart} className="mx-1" />
                  <FontAwesomeIcon icon={faHeart} className="mx-1" />
                </div>

                <div className="min-h-[20mm] hidden print:block"></div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-6 px-4 py-3 md:px-8 md:py-4 w-full max-w-4xl">
            <button
              id="back-payment-button"
              onClick={() => navigate("/transactionsCashier")}
              className="bg-black hover:bg-yellow-500 text-white hover:text-black font-bold py-2 px-4 rounded text-sm md:text-base"
            >
              Kembali ke Data Transaction
            </button>
            <button
              id="print-pdf-button"
              onClick={handleGeneratePdf}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm md:text-base"
            >
              Download PDF
            </button>
          </div>
          <div className="flex items-center gap-2 pt-12 text-xs md:text-sm font-semibold sm:ml-auto sm:pt-0">
            <img
              src={LogoImage}
              alt="Sacaluna"
              className="h-5 w-5 md:h-6 md:w-6"
            />
            <span>Sacaluna Coffee</span>
          </div>
        </div>
      </div>
      {/* Kontainer Invoice Tersembunyi untuk PDF Generation */}
      {transactionData && (
        <div
          ref={invoiceRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "210mm",
            padding: "20mm 15mm",
            backgroundColor: "#ffffff",
            color: "#000000",
            fontSize: "10pt", // Base font size for the PDF content
            lineHeight: "1.4",
            boxSizing: "border-box",
          }}
        >
          {/* Duplikasi konten dari div utama yang terlihat */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <img
                  src={LogoImage}
                  alt="Sacaluna"
                  style={{ height: "35px", width: "35px", marginRight: "8px" }}
                />{" "}
                {/* Diperbesar sedikit */}
                <h1 style={{ fontSize: "20pt", fontWeight: "bold" }}>
                  Sacaluna Coffee
                </h1>{" "}
                {/* Diperbesar */}
              </div>
              <p style={{ fontSize: "10pt", color: "#555", maxWidth: "80mm" }}>
                {" "}
                {/* Diperbesar */}
                Jl. Sidomulyo No.10a, Manukan,
                <br />
                Condongcatur, Kec. Depok,
                <br />
                Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "18pt",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {" "}
                {/* Diperbesar */}
                INVOICE #{transactionData?.id_order || "N/A"}
              </h2>
              <p style={{ fontSize: "10pt", color: "#555" }}>
                {" "}
                {/* Diperbesar */}
                Jenis Pembayaran:{" "}
                <span style={{ fontWeight: "bold" }}>
                  {transactionData?.payment_method === "online_payment"
                    ? "Online"
                    : "Cashier"}
                </span>
              </p>
              <p style={{ fontSize: "10pt", color: "#555" }}>
                {" "}
                {/* Diperbesar */}
                Tanggal Pembayaran:{" "}
                <span style={{ fontWeight: "bold" }}>
                  {paymentTimeFormatted}
                </span>
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              fontSize: "11pt",
            }}
          >
            {" "}
            {/* Base font for this section */}
            <div style={{ textAlign: "left", width: "48%", marginRight: "2%" }}>
              <h3
                style={{
                  fontSize: "13pt",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {" "}
                {/* Diperbesar */}
                Informasi Pelanggan:
              </h3>
              <p>
                <span style={{ fontWeight: "bold" }}>Nama Pelanggan:</span>{" "}
                {transactionData?.name_customer || "-"}
              </p>
              <p>
                <span style={{ fontWeight: "bold" }}>No. Telp:</span>{" "}
                {transactionData?.phone || "-"}
              </p>
            </div>
            <div style={{ textAlign: "left", width: "48%", marginLeft: "2%" }}>
              <h3
                style={{
                  fontSize: "13pt",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {" "}
                {/* Diperbesar */}
                Detail Pesanan:
              </h3>
              <p>
                <span style={{ fontWeight: "bold" }}>ID Order:</span>{" "}
                {transactionData?.id_order || "-"}
              </p>
              <p>
                <span style={{ fontWeight: "bold" }}>Tanggal Order:</span>{" "}
                {orderTimeFormatted}
              </p>
              <p>
                <span style={{ fontWeight: "bold" }}>Metode Bayar:</span>{" "}
                {transactionData?.payment_method === "online_payment"
                  ? "Online"
                  : "Cashier"}
              </p>
              <p>
                <span style={{ fontWeight: "bold" }}>Status Bayar:</span>{" "}
                {transactionData?.payment_status || "-"}
              </p>
            </div>
          </div>

          <div
            style={{
              marginBottom: "20px",
              border: "1px solid #000",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10pt",
              }}
            >
              {" "}
              {/* Base font for table */}
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: "bold",
                      color: "#444",
                    }}
                  >
                    Produk
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#444",
                    }}
                  >
                    Jumlah
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#444",
                    }}
                  >
                    Harga Satuan
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#444",
                    }}
                  >
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#888",
                        fontStyle: "italic",
                      }}
                    >
                      Tidak ada item dalam pesanan ini.
                    </td>
                  </tr>
                ) : (
                  invoiceItems.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "8px", textAlign: "left" }}>
                        {item.menu_name}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        Rp {item.price.toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        Rp{" "}
                        {(item.quantity * item.price).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "15px",
                backgroundColor: "#f3f4f6",
                borderTop: "1px solid #e5e7eb",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: "11pt",
              }}
            >
              {" "}
              {/* Base font for totals */}
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                <p>Total Harga: Rp {totalAmount.toLocaleString("id-ID")}</p>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                <p>Jumlah Dibayar: Rp {amountPaid.toLocaleString("id-ID")}</p>
              </div>
              {changeDue > 0 && (
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#047857",
                  }}
                >
                  <p>Uang Kembalian: Rp {changeDue.toLocaleString("id-ID")}</p>
                </div>
              )}
            </div>
          </div>

          <div
            style={{ textAlign: "center", marginTop: "30px", fontSize: "10pt" }}
          >
            {" "}
            {/* Base font for footer */}
            <p style={{ marginBottom: "10px" }}>Thank You, See You Again</p>
            <span style={{ margin: "0 5px" }}>❤</span>
            <span style={{ margin: "0 5px" }}>❤</span>
            <span style={{ margin: "0 5px" }}>❤</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceOrdersPage;
