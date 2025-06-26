import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarKitchen from "../../components/SidebarKitchen";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faSpinner,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons"; // Tambahkan ikon yang dibutuhkan

// Helper function for status classes
const getStatusClass = (status) => {
  switch (status) {
    case "pending":
    case "waiting":
      return "bg-gray-200 text-gray-800";
    case "processing":
      return "bg-orange-200 text-orange-800";
    case "completed": // <-- Hanya gunakan 'completed' untuk status selesai
      return "bg-green-200 text-green-800";
    case "canceled":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function TransactionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [selectedOrderToChangeStatus, setSelectedOrderToChangeStatus] =
    useState(null);

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
        "Detail Error Autentikasi (Kitchen TransactionsPage):",
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const url = `http://localhost:3000/api/transactions-kitchen/today?searchTerm=${searchTerm}`;
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
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching kitchen transactions:", err);
      setError("Gagal memuat data transaksi dapur: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, handleAuthenticationError]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || user?.role !== "Kitchen") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }
    fetchTransactions();
  }, [navigate, fetchTransactions]);

  const openOrderStatusModal = (transaction) => {
    setSelectedOrderToChangeStatus(transaction);
    setIsOrderStatusModalOpen(true);
  };

  const closeOrderStatusModal = () => {
    setIsOrderStatusModalOpen(false);
    setSelectedOrderToChangeStatus(null);
  };

  const openDetailModal = async (transaction) => {
    setCurrentDetailTransaction(transaction);
    setDetailModalLoading(true);
    setDetailModalError(null);
    setSelectedOrderItems([]);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:3000/api/transactions-kitchen/${transaction.id_order}/items`,
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
      console.error("Error fetching kitchen order items:", err);
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

  const handleOrderStatusChange = async (id_order, newStatus) => {
    // Confirmation is now handled by the specific buttons' logic,
    // or if only one option, it's a direct action.
    // Retaining window.confirm here for explicit confirmation of any status change.
    const confirmChange = window.confirm(
      `Apakah Anda yakin ingin mengubah status order ${id_order} menjadi "${newStatus}"?`
    );
    if (!confirmChange) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:3000/api/transactions-kitchen/${id_order}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_status: newStatus }),
        }
      );
      if (!response.ok) {
        await handleAuthenticationError(response);
        return;
      }
      const data = await response.json();
      alert(data.message);
      closeOrderStatusModal();
      fetchTransactions();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarKitchen />
        <div className="flex-1 p-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Today Transaction</h1>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cari Data:</label>
              <input
                type="text"
                placeholder="Search transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

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
              <thead className="sticky top-0 z-10 bg-gray-200 text-left">
                <tr>
                  <th className="p-3 w-[15%]">ID Order</th>
                  <th className="p-3 w-[15%]">No. Meja</th>
                  <th className="p-3 w-[20%]">Waktu Order</th>
                  <th className="p-3 w-[25%] text-center">Status Order</th>
                  <th className="p-3 w-[15%] text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-3xl text-yellow-500 mb-4"
                      />
                      <p>Memuat transaksi...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
                      />
                      <p>{error}</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Tidak ada transaksi hari ini untuk dapur.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id_order}
                      className="hover:bg-gray-100"
                    >
                      <td className="p-3 ">{transaction.id_order}</td>
                      <td className="p-3 ">{transaction.table_number}</td>
                      <td className="p-3 ">
                        {new Date(transaction.order_time).toLocaleString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour12: false,
                          }
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openOrderStatusModal(transaction)}
                          className={`block w-full py-1 px-2 rounded-md ${getStatusClass(
                            transaction.order_status
                          )} ${
                            transaction.order_status === "completed" ||
                            transaction.order_status === "canceled" ||
                            transaction.order_status === "waiting"
                              ? "cursor-not-allowed"
                              : "hover:opacity-80 transition-opacity"
                          }`}
                          disabled={
                            transaction.order_status === "completed" ||
                            transaction.order_status === "canceled" ||
                            transaction.order_status === "waiting"
                          }
                        >
                          {transaction.order_status}
                        </button>
                      </td>
                      <td className="p-3 text-center">
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

          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Modal (Kitchen Version) */}
      {isOrderStatusModalOpen && selectedOrderToChangeStatus && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeOrderStatusModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-96 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeOrderStatusModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              Ubah Status Pesanan
            </h2>
            <p className="text-md mb-1">
              Order ID:{" "}
              <span className="font-semibold">
                {selectedOrderToChangeStatus.id_order}
              </span>
            </p>
            <p className="text-md mb-1">
              Nomor Meja:{" "}
              <span className="font-semibold">
                {selectedOrderToChangeStatus.table_number}
              </span>
            </p>
            <p className="text-md mb-1">
              Nama Customer:{" "}
              <span className="font-semibold">
                {selectedOrderToChangeStatus.name_customer || "-"}
              </span>
            </p>
            <p className="text-md mb-4">
              No. Telp:{" "}
              <span className="font-semibold">
                {selectedOrderToChangeStatus.phone || "-"}
              </span>
            </p>

            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-2">Status saat ini:</p>
              <span
                className={`inline-block py-2 px-4 rounded-full text-lg font-bold ${getStatusClass(
                  selectedOrderToChangeStatus.order_status
                )}`}
              >
                {selectedOrderToChangeStatus.order_status
                  ? selectedOrderToChangeStatus.order_status.toUpperCase()
                  : "N/A"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Buttons to change status based on current status */}
              {selectedOrderToChangeStatus.order_status === "pending" && (
                <button
                  onClick={() =>
                    handleOrderStatusChange(
                      selectedOrderToChangeStatus.id_order,
                      "processing"
                    )
                  }
                  className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                    "processing"
                  )} hover:opacity-80 transition-opacity`}
                  disabled={
                    selectedOrderToChangeStatus.order_status === "waiting"
                  }
                >
                  Set ke Proses
                </button>
              )}
              {selectedOrderToChangeStatus.order_status === "processing" && (
                <button
                  onClick={() =>
                    handleOrderStatusChange(
                      selectedOrderToChangeStatus.id_order,
                      "completed"
                    )
                  }
                  className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                    "completed"
                  )} hover:opacity-80 transition-opacity`}
                  disabled={
                    selectedOrderToChangeStatus.order_status === "waiting"
                  }
                >
                  Set ke Selesai
                </button>
              )}
              {/* Removed "Batalkan Order" button */}
              {/*
              {(selectedOrderToChangeStatus.order_status === "pending" ||
                selectedOrderToChangeStatus.order_status === "processing") && (
                <button
                  onClick={() =>
                    handleOrderStatusChange(
                      selectedOrderToChangeStatus.id_order,
                      "canceled"
                    )
                  }
                  className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                    "canceled"
                  )} hover:opacity-80 transition-opacity`}
                  disabled={
                    selectedOrderToChangeStatus.order_status === "waiting"
                  }
                >
                  Batalkan Order
                </button>
              )}
              */}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal (Kitchen Version) */}
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
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
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

export default TransactionsPage;
