import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faSpinner,
  faTimesCircle,
  faFileExcel,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import react-datepicker and its CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id } from "date-fns/locale";

function HistorysPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  // Change selectedMonth to selectedDate and initialize with null
  const [selectedDate, setSelectedDate] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [authError, setAuthError] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDetailTransaction, setCurrentDetailTransaction] =
    useState(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [detailModalLoading, setDetailModalLoading] = useState(false);
  const [detailModalError, setDetailModalError] = useState(null);

  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (HistorysPage):",
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

      setAuthError(errorMessage);

      setTimeout(() => {
        localStorage.clear();
        navigate("/");
      }, 3000);
    },
    [navigate]
  );

  const fetchHistoryTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);
    setTotalRevenue(0);
    try {
      const token = localStorage.getItem("adminToken");
      let url = `http://localhost:3000/api/historys-admin/all?searchTerm=${searchTerm}`;

      // Modify the URL to send the selected date (month and year)
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
        url += `&month=${month}&year=${year}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await handleAuthenticationError(response);
        return;
      }

      const data = await response.json();
      setHistoryTransactions(data);

      const calculatedRevenue = data.reduce((sum, transaction) => {
        if (
          (transaction.order_status === "completed" ||
            transaction.order_status === "complated") &&
          transaction.payment_status === "success"
        ) {
          return sum + transaction.order_amount;
        }
        return sum;
      }, 0);
      setTotalRevenue(calculatedRevenue);
    } catch (err) {
      console.error("Error fetching history transactions:", err);
      setError("Gagal memuat data histori transaksi: " + err.message);
    } finally {
      setLoading(false);
    }
    // Add selectedDate to the dependency array
  }, [searchTerm, selectedDate, handleAuthenticationError]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || user?.role !== "Admin") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }
    fetchHistoryTransactions();
  }, [navigate, fetchHistoryTransactions]);

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
      case "waiting":
        return "bg-gray-200 text-gray-800";
      case "success":
        return "bg-green-200 text-green-800";
      case "failed":
        return "bg-red-200 text-red-800";
      case "processing":
        return "bg-orange-200 text-orange-800";
      case "completed":
      case "complated":
        return "bg-green-200 text-green-800";
      case "canceled":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const dateTimeOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const openDetailModal = async (transaction) => {
    setCurrentDetailTransaction(transaction);
    setDetailModalLoading(true);
    setDetailModalError(null);
    setSelectedOrderItems([]);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:3000/api/transactions-cashier/${transaction.id_order}/items`,
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
      setSelectedOrderItems(data);
    } catch (err) {
      console.error("Error fetching order items:", err);
      setDetailModalError("Gagal memuat detail pesanan: " + err.message);
    } finally {
      setDetailModalLoading(false);
      setIsDetailModalOpen(true);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setCurrentDetailTransaction(null);
    setSelectedOrderItems([]);
    setDetailModalError(null);
  };

  // Helper function to get month name from a Date object
  const getMonthName = (date) => {
    if (!date) return "Semua Bulan";
    return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
  };

  const handleDownloadPdf = () => {
    if (!historyTransactions || historyTransactions.length === 0) {
      alert("Tidak dapat mendownload data kosong");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const filterPeriod = selectedDate
      ? getMonthName(selectedDate)
      : "Semua Bulan";
    const now = new Date();
    const tanggalCetak = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const jamCetak = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const img = new Image();
    img.src = LogoImage;

    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 25, 25);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Sacaluna Coffee", 43, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,\nKabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
        43,
        20
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Histori Transaksi", pageWidth - 14, 15, {
        align: "right",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Filter Periode: ${filterPeriod}`, pageWidth - 14, 20, {
        align: "right",
      });
      doc.text(
        `Total Pendapatan: Rp ${totalRevenue.toLocaleString("id-ID")}`,
        pageWidth - 14,
        25,
        {
          align: "right",
        }
      );
      doc.text(
        `Tanggal Cetak: ${tanggalCetak} pukul ${jamCetak}`,
        pageWidth - 14,
        30,
        {
          align: "right",
        }
      );

      doc.setLineWidth(0.5);
      doc.line(14, 35, pageWidth - 14, 35);

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "ID",
            "Meja",
            "Customer",
            "Telp",
            "Jumlah",
            "Metode",
            "Tipe",
            "Status Bayar",
            "Status Order",
            "Waktu Bayar",
            "Waktu Order",
            "Detail",
          ],
        ],
        body: historyTransactions.map((t) => [
          t.id_order,
          t.table_number,
          t.name_customer,
          t.phone || "-",
          `Rp ${t.order_amount.toLocaleString("id-ID")}`,
          t.payment_method === "online_payment" ? "Online" : "Cashier",
          t.payment_type || "-",
          t.payment_status || "-",
          t.order_status || "-",
          t.payment_time
            ? new Date(t.payment_time).toLocaleString("id-ID", dateTimeOptions)
            : "-",
          t.order_time
            ? new Date(t.order_time).toLocaleString("id-ID", dateTimeOptions)
            : "-",
          "Lihat",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        margin: { top: 35 },
      });

      doc.save("Laporan_History_Transaksi.pdf");
    };
  };

  const handleDownloadExcel = () => {
    if (!historyTransactions || historyTransactions.length === 0) {
      alert("Tidak dapat mendownload data kosong ke Excel.");
      return;
    }

    const dataForExcel = historyTransactions.map((t) => ({
      "ID Order": t.id_order,
      "No. Meja": t.table_number,
      "Nama Customer": t.name_customer,
      "No. Telp": t.phone || "-",
      Jumlah: t.order_amount,
      "Metode Bayar":
        t.payment_method === "online_payment" ? "Online" : "Cashier",
      "Tipe Bayar": t.payment_type || "-",
      "Status Bayar": t.payment_status || "-",
      "Status Order": t.order_status || "-",
      "Waktu Bayar": t.payment_time
        ? new Date(t.payment_time).toLocaleString("id-ID", dateTimeOptions)
        : "-",
      "Waktu Order": t.order_time
        ? new Date(t.order_time).toLocaleString("id-ID", dateTimeOptions)
        : "-",
    }));

    dataForExcel.push({});
    dataForExcel.push({
      "ID Order": "Total Pendapatan:",
      "No. Meja": "",
      "Nama Customer": "",
      "No. Telp": "",
      Jumlah: totalRevenue,
      "Metode Bayar": "",
      "Tipe Bayar": "",
      "Status Bayar": "",
      "Status Order": "",
      "Waktu Bayar": "",
      "Waktu Order": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histori Transaksi");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(
      data,
      `Laporan_Histori_Transaksi_${getMonthName(selectedDate)}.xlsx`
    );

    alert("Data berhasil diunduh ke Excel!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">History Management</h1>
            <div className="flex items-center gap-4">
              {/* Total Pendapatan */}
              <div className="flex items-center gap-2 border border-black rounded-lg shadow-sm px-4 py-2 h-11">
                <label className="text-sm font-medium whitespace-nowrap">
                  Total Pendapatan:
                </label>
                <span className="text-sm font-semibold text-green-600">
                  Rp {loading ? "..." : totalRevenue.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Date Picker for Month Filter */}
              <div className="flex items-center gap-2 relative">
                <label className="text-sm font-medium">Filter Bulan:</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  isClearable
                  placeholderText="Pilih Bulan"
                  locale={id}
                  className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none pr-8 h-11"
                />
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Cari History:</label>
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 h-11 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Bagian untuk menampilkan pesan error autentikasi */}
          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}

          <div className="bg-white border rounded shadow-md w-full h-[700px] overflow-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-200 text-left">
                <tr>
                  <th className="p-3 w-[5%]">ID</th>
                  <th className="p-3 w-[8%]">No. Meja</th>
                  <th className="p-3 w-[10%]">Nama Customer</th>
                  <th className="p-3 w-[8%]">No. Telp</th>
                  <th className="p-3 w-[8%]">Jumlah</th>
                  <th className="p-3 w-[7%]">Metode Bayar</th>
                  <th className="p-3 w-[6%]">Tipe Bayar</th>
                  <th className="p-3 w-[10%]">Status Bayar</th>
                  <th className="p-3 w-[10%]">Status Order</th>
                  <th className="p-3 w-[10%]">Waktu Bayar</th>
                  <th className="p-3 w-[10%]">Waktu Order</th>
                  <th className="p-3 w-[7%]">Detail</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-3xl text-yellow-500 mb-4"
                      />
                      <p>Memuat histori transaksi...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="12" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
                      />
                      <p>{error}</p>
                    </td>
                  </tr>
                ) : historyTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-8 text-gray-500">
                      {searchTerm || selectedDate
                        ? `Data histori untuk ${
                            selectedDate
                              ? getMonthName(selectedDate)
                              : "Semua Bulan"
                          } ${
                            searchTerm
                              ? 'dengan pencarian "' + searchTerm + '" '
                              : ""
                          }tidak ditemukan.`
                        : "Tidak ada histori transaksi."}
                    </td>
                  </tr>
                ) : (
                  historyTransactions.map((transaction) => (
                    <tr
                      key={transaction.id_order}
                      className="hover:bg-gray-100"
                    >
                      <td className="p-3 ">{transaction.id_order}</td>
                      <td className="p-3 ">{transaction.table_number}</td>
                      <td className="p-3 truncate">
                        {transaction.name_customer}
                      </td>
                      <td className="p-3 ">{transaction.phone || "-"}</td>
                      <td className="p-3 ">
                        Rp {transaction.order_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 ">
                        {transaction.payment_method === "online_payment"
                          ? "Online"
                          : "Cashier"}
                      </td>
                      <td className="p-3 ">
                        {transaction.payment_type || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`w-full inline-block py-1 px-2 rounded-md ${getStatusClass(
                            transaction.payment_status
                          )}`}
                        >
                          {transaction.payment_status || "N/A"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`w-full inline-block py-1 px-2 rounded-md ${getStatusClass(
                            transaction.order_status
                          )}`}
                        >
                          {transaction.order_status}
                        </span>
                      </td>
                      <td className="p-3 ">
                        {transaction.payment_time
                          ? new Date(transaction.payment_time).toLocaleString(
                              "id-ID",
                              dateTimeOptions
                            )
                          : "-"}
                      </td>
                      <td className="p-3 ">
                        {transaction.order_time
                          ? new Date(transaction.order_time).toLocaleString(
                              "id-ID",
                              dateTimeOptions
                            )
                          : "-"}
                      </td>
                      <td className="p-3 ">
                        <button
                          onClick={() => openDetailModal(transaction)}
                          className="text-blue-600 hover:underline"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-start gap-4 mt-4">
            {" "}
            {/* Container untuk tombol PDF dan Excel */}
            <button
              onClick={handleDownloadPdf}
              className="w-auto px-6 py-2 bg-black hover:bg-red-600 text-white rounded-lg font-bold transition duration-200 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFilePdf} className="text-lg" /> Download
              PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="w-auto px-6 py-2 bg-black hover:bg-green-600 text-white rounded-lg font-bold transition duration-200 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFileExcel} className="text-lg" />{" "}
              {/* Icon Excel */}
              Download Excel
            </button>
          </div>

          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && currentDetailTransaction && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-[600px] relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetailModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              Detail Pesanan
            </h2>
            <div className="mb-4 text-left">
              <p className="text-md mb-1">
                Order ID:{" "}
                <span className="font-semibold">
                  {currentDetailTransaction.id_order}
                </span>
              </p>
              <p className="text-md mb-1">
                Nomor Meja:{" "}
                <span className="font-semibold">
                  {currentDetailTransaction.table_number}
                </span>
              </p>
              <p className="text-md mb-1">
                Nama Customer:{" "}
                <span className="font-semibold">
                  {currentDetailTransaction.name_customer || "-"}
                </span>
              </p>
              <p className="text-md mb-4">
                No. Telp:{" "}
                <span className="font-semibold">
                  {currentDetailTransaction.phone || "-"}
                </span>
              </p>
            </div>

            {detailModalLoading ? (
              <p className="text-center text-gray-500">Memuat detail...</p>
            ) : detailModalError ? (
              <p className="text-center text-red-600">{detailModalError}</p>
            ) : selectedOrderItems.length === 0 ? (
              <p className="text-center text-gray-500">
                Tidak ada item dalam pesanan ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">
                        Nama Barang
                      </th>
                      <th className="py-2 px-3 text-center text-sm font-semibold text-gray-600">
                        Jumlah
                      </th>
                      <th className="py-2 px-3 text-right text-sm font-semibold text-gray-600">
                        Harga Satuan
                      </th>
                      <th className="py-2 px-3 text-right text-sm font-semibold text-gray-600">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderItems.map((item, index) => (
                      <tr
                        key={index}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 text-left">
                          {item.menu_name || `ID: ${item.id_menu}`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.quantity}
                        </td>
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorysPage;
