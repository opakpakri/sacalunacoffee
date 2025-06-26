import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarCashier from "../../components/SidebarCashier";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faEdit,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Helper function for status classes
const getStatusClass = (status) => {
  switch (status) {
    case "success":
    case "completed":
      return "bg-green-200 text-green-800";
    case "pending":
    case "waiting":
      return "bg-gray-200 text-gray-800";
    case "failed":
    case "canceled":
      return "bg-red-200 text-red-800";
    case "processing":
      return "bg-blue-200 text-blue-800";
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

  // State for Payment Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // New States for Amount Paid Edit Modal
  const [isAmountEditModalOpen, setIsAmountEditModalOpen] = useState(false);
  const [editAmountTransaction, setEditAmountTransaction] = useState(null);
  const [tempEditedAmount, setTempEditedAmount] = useState("");
  const [amountEditError, setAmountEditError] = useState(null);

  // States for Order Detail Modal
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
        "Detail Error Autentikasi (TransactionsPage):",
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
    setError(null);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const url = `http://localhost:3000/api/transactions-cashier/today?searchTerm=${searchTerm}`;
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
      console.error("Error fetching transactions:", err);
      setError("Gagal memuat data transaksi. Coba lagi nanti: " + err.message);
    } finally {
      // This block is left empty because loading state for initial fetch
      // and search debounce are managed by their respective useEffects.
    }
  }, [searchTerm, handleAuthenticationError]);

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

    const loadInitialData = async () => {
      setLoading(true); // Activate initial loading
      await fetchTransactions();
      setLoading(false); // Deactivate initial loading after fetch
    };
    loadInitialData();
  }, [navigate, fetchTransactions]);

  // Effect for search (with Debounce)
  useEffect(() => {
    // Only activate debounce after initial loading is complete
    if (!loading) {
      const delayDebounceFn = setTimeout(async () => {
        await fetchTransactions();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, fetchTransactions, loading]);

  const openAmountEditModal = (transaction) => {
    if (
      transaction.payment_method === "pay_at_cashier" &&
      transaction.payment_status !== "success" &&
      transaction.order_status !== "canceled" &&
      transaction.order_status !== "completed"
    ) {
      setEditAmountTransaction(transaction);
      setTempEditedAmount(
        transaction.amount_paid?.toString() ||
          transaction.order_amount.toString()
      );
      setAmountEditError(null);
      setIsAmountEditModalOpen(true);
    }
  };

  const closeAmountEditModal = () => {
    setIsAmountEditModalOpen(false);
    setEditAmountTransaction(null);
    setTempEditedAmount("");
    setAmountEditError(null);
  };

  const handleTempEditedAmountChange = (e) => {
    setTempEditedAmount(e.target.value);
    setAmountEditError(null);
  };

  const handleUpdateAmountPaid = async () => {
    if (!editAmountTransaction) return;

    const newAmount = parseFloat(tempEditedAmount);
    const currentOrderAmount = parseFloat(editAmountTransaction.order_amount);

    if (isNaN(newAmount) || newAmount < 0) {
      setAmountEditError("Nominal tidak valid atau negatif.");
      return;
    }

    if (newAmount < currentOrderAmount) {
      setAmountEditError(
        `Nominal kurang dari tagihan. Kekurangan: Rp ${(
          currentOrderAmount - newAmount
        ).toLocaleString("id-ID")}.`
      );
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `http://localhost:3000/api/payments/${editAmountTransaction.id_payment}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            new_status: editAmountTransaction.payment_status, // Maintain current status
            amount_paid: newAmount,
          }),
        }
      );

      if (!response.ok) {
        await handleAuthenticationError(response);
        return;
      }

      alert("Jumlah bayar berhasil diupdate!");
      closeAmountEditModal();
      fetchTransactions();
    } catch (err) {
      console.error("Error updating amount paid:", err);
      setAmountEditError("Gagal update: " + err.message);
    }
  };

  const openStatusModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedTransaction(null);
  };

  const handlePaymentStatusChange = async (id_payment, newStatus, id_order) => {
    if (!selectedTransaction || !selectedTransaction.id_payment) {
      alert("Transaksi tidak valid.");
      return;
    }

    // Validation for 'success' status
    if (newStatus === "success") {
      const transactionAmountPaid = parseFloat(selectedTransaction.amount_paid);
      const transactionOrderAmount = parseFloat(
        selectedTransaction.order_amount
      );
      const tolerance = 0.01; // Small tolerance for floating point comparisons

      if (selectedTransaction.payment_method === "pay_at_cashier") {
        if (
          isNaN(transactionAmountPaid) ||
          transactionAmountPaid < transactionOrderAmount
        ) {
          alert(
            `Untuk metode Kasir, 'Jumlah Bayar' harus diisi dan sama dengan atau lebih dari 'Jumlah Tagihan' (Rp ${transactionOrderAmount.toLocaleString(
              "id-ID"
            )}) untuk mengubah status ke Sukses.`
          );
          return;
        }
      } else if (
        selectedTransaction.payment_method === "online_payment" &&
        selectedTransaction.payment_type === "qris"
      ) {
        if (
          isNaN(transactionAmountPaid) ||
          Math.abs(transactionAmountPaid - transactionOrderAmount) > tolerance
        ) {
          alert(
            `Untuk metode QRIS, 'Jumlah Bayar' harus sama persis dengan 'Jumlah Tagihan' (Rp ${transactionOrderAmount.toLocaleString(
              "id-ID"
            )}) untuk mengubah status ke Sukses.`
          );
          return;
        }
      }
    }

    const confirmChange = window.confirm(
      `Apakah Anda yakin ingin mengubah status pembayaran menjadi "${newStatus}" untuk order ID ${selectedTransaction.id_order}?`
    );
    if (!confirmChange) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const amountPaidToSend = selectedTransaction.amount_paid; // Use existing amount_paid for API call

      const updatePaymentResponse = await fetch(
        `http://localhost:3000/api/payments/${id_payment}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            new_status: newStatus,
            amount_paid: amountPaidToSend,
          }),
        }
      );

      if (!updatePaymentResponse.ok) {
        await handleAuthenticationError(updatePaymentResponse);
        return;
      }

      // Logic to update order_status based on payment_status change
      let orderStatusToUpdate = null;
      if (
        newStatus === "success" &&
        selectedTransaction.order_status === "waiting" // Only change order status if it's currently 'waiting'
      ) {
        orderStatusToUpdate = "pending"; // Change order status to pending if payment is successful and order was waiting
      } else if (newStatus === "failed") {
        orderStatusToUpdate = "canceled"; // Change order status to canceled if payment fails
      }

      if (
        orderStatusToUpdate &&
        selectedTransaction.order_status !== orderStatusToUpdate // Prevent unnecessary updates
      ) {
        const updateOrderResponse = await fetch(
          `http://localhost:3000/api/orders/${id_order}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ new_status: orderStatusToUpdate }),
          }
        );
        if (!updateOrderResponse.ok) {
          await handleAuthenticationError(updateOrderResponse);
          console.error("Gagal update status order:");
          return;
        } else {
          alert(
            `Pembayaran berhasil diupdate! Status order diubah menjadi ${orderStatusToUpdate}.`
          );
        }
      } else {
        alert(
          "Pembayaran berhasil diupdate! Status order tetap seperti semula."
        );
      }

      closeStatusModal();
      fetchTransactions(); // Re-fetch all transactions to update the table
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Error: " + err.message);
    }
  };

  const isSuccessButtonDisabled = () => {
    if (!selectedTransaction) return true;

    // Disable if already success, canceled, or completed
    if (
      selectedTransaction.payment_status === "success" ||
      selectedTransaction.order_status === "canceled" ||
      selectedTransaction.order_status === "completed"
    ) {
      return true;
    }

    const transactionAmountPaid = parseFloat(selectedTransaction.amount_paid);
    const transactionOrderAmount = parseFloat(selectedTransaction.order_amount);
    const tolerance = 0.01;

    if (selectedTransaction.payment_method === "pay_at_cashier") {
      return (
        isNaN(transactionAmountPaid) ||
        transactionAmountPaid < transactionOrderAmount
      );
    } else if (
      selectedTransaction.payment_method === "online_payment" &&
      selectedTransaction.payment_type === "qris"
    ) {
      // For QRIS, amount paid must exactly match order amount (within tolerance)
      return (
        isNaN(transactionAmountPaid) ||
        Math.abs(transactionAmountPaid - transactionOrderAmount) > tolerance
      );
    }
    return false; // Should not reach here if all cases handled above
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

  const handlePrintInvoice = (transaction) => {
    navigate("/transactionsCashier/invoice", {
      state: { transactionData: transaction },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarCashier />
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
                  <th className="p-3 w-[5%]">ID</th>
                  <th className="p-3 w-[8%]">No. Meja</th>
                  <th className="p-3 w-[12%]">Nama Customer</th>
                  <th className="p-3 w-[8%]">No. Telp</th>
                  <th className="p-3 w-[10%] text-right">Jumlah</th>
                  <th className="p-3 w-[10%] text-right">Jumlah Bayar</th>
                  <th className="p-3 w-[6%]">Metode Bayar</th>{" "}
                  {/* Reverted width */}
                  <th className="p-3 w-[6%]">Tipe Bayar</th>{" "}
                  {/* Reverted width */}
                  <th className="p-3 w-[10%]">Status Bayar</th>
                  <th className="p-3 w-[10%]">Status Order</th>
                  <th className="p-3 w-[10%]">Waktu Order</th>
                  <th className="p-3 w-[7%]">Detail</th>
                  <th className="p-3 w-[7%]">Invoice</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Display loading or error when fetching data */}
                {loading ? (
                  <tr>
                    <td colSpan="13" className="text-center py-8 text-gray-500">
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
                    <td colSpan="13" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
                      />
                      <p>{error}</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="text-center py-8 text-gray-500">
                      Tidak ada transaksi hari ini.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id_order}
                      className="hover:bg-gray-100 "
                    >
                      <td className="p-3 ">{transaction.id_order}</td>
                      <td className="p-3 ">{transaction.table_number}</td>
                      <td className="p-3 truncate">
                        {transaction.name_customer}
                      </td>
                      <td className="p-3 ">{transaction.phone || "-"}</td>
                      <td className="p-3 text-right">
                        Rp {transaction.order_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 relative">
                        <span
                          onClick={() => openAmountEditModal(transaction)}
                          className={`cursor-pointer block text-right hover:bg-gray-200 p-1 rounded 
                            ${
                              transaction.payment_method === "pay_at_cashier" &&
                              transaction.payment_status !== "success" &&
                              transaction.order_status !== "canceled" &&
                              transaction.order_status !== "completed"
                                ? "text-black"
                                : "text-gray-800 cursor-default"
                            }`}
                          title={
                            transaction.payment_method === "pay_at_cashier" &&
                            transaction.payment_status !== "success" &&
                            transaction.order_status !== "canceled" &&
                            transaction.order_status !== "completed"
                              ? "Klik untuk mengedit jumlah bayar"
                              : ""
                          }
                        >
                          Rp{" "}
                          {transaction.amount_paid
                            ? transaction.amount_paid.toLocaleString("id-ID")
                            : "0"}
                          {transaction.payment_method === "pay_at_cashier" &&
                            transaction.payment_status !== "success" &&
                            transaction.order_status !== "canceled" &&
                            transaction.order_status !== "completed" && (
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="ml-1 text-gray-400 text-xs"
                              />
                            )}
                        </span>
                      </td>
                      <td className="p-3 ">
                        {transaction.payment_method === "online_payment"
                          ? "Online"
                          : "Cashier"}
                      </td>
                      <td className="p-3 ">
                        {transaction.payment_type || "-"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openStatusModal(transaction)}
                          className={`block w-full py-1 px-2 rounded-md ${getStatusClass(
                            transaction.payment_status
                          )} ${
                            transaction.payment_status === "success" ||
                            transaction.order_status === "canceled" ||
                            transaction.order_status === "completed"
                              ? "cursor-not-allowed"
                              : "hover:opacity-80 transition-opacity"
                          }`}
                          disabled={
                            transaction.payment_status === "success" ||
                            transaction.order_status === "canceled" ||
                            transaction.order_status === "completed"
                          }
                        >
                          {transaction.payment_status || "N/A"}
                        </button>
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
                      <td className="p-3 ">
                        <button
                          onClick={() => openDetailModal(transaction)}
                          className="text-blue-600 hover:underline"
                        >
                          Detail
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handlePrintInvoice(transaction)}
                          className="text-green-600 hover:underline"
                        >
                          Invoice
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

      {/* Payment Status Modal */}
      {isStatusModalOpen && selectedTransaction && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeStatusModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-96 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeStatusModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              Ubah Status Pembayaran
            </h2>
            <p className="text-md mb-1">
              Order ID:{" "}
              <span className="font-semibold">
                {selectedTransaction.id_order}
              </span>
            </p>
            <p className="text-md mb-1">
              Nomor Meja:{" "}
              <span className="font-semibold">
                {selectedTransaction.table_number}
              </span>
            </p>
            <p className="text-md mb-1">
              Atas Nama:{" "}
              <span className="font-semibold">
                {selectedTransaction.name_customer || "-"}
              </span>
            </p>
            <p className="text-md mb-4">
              No. Telp:{" "}
              <span className="font-semibold">
                {selectedTransaction.phone || "-"}
              </span>
            </p>
            <p className="text-md mb-4">
              Metode Pembayaran:{" "}
              <span className="font-semibold">
                {selectedTransaction.payment_method === "online_payment"
                  ? "Online"
                  : "Cashier"}
                {selectedTransaction.payment_type
                  ? ` (${selectedTransaction.payment_type.toUpperCase()})`
                  : ""}
              </span>
            </p>
            <p className="text-md mb-4">
              Jumlah Tagihan:{" "}
              <span className="font-semibold">
                Rp {selectedTransaction.order_amount.toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-md mb-4">
              Jumlah Bayar:{" "}
              <span className="font-semibold">
                Rp{" "}
                {selectedTransaction.amount_paid
                  ? selectedTransaction.amount_paid.toLocaleString("id-ID")
                  : "0"}
              </span>
            </p>

            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-2">Status saat ini:</p>
              <span
                className={`inline-block py-2 px-4 rounded-full text-lg font-bold ${getStatusClass(
                  selectedTransaction.payment_status
                )}`}
              >
                {selectedTransaction.payment_status || "N/A"}
              </span>
            </div>

            {/* Buttons for status change */}
            <div className="flex flex-col gap-3">
              {/* 'Sukses' button */}
              {selectedTransaction.payment_status !== "success" &&
                selectedTransaction.order_status !== "canceled" &&
                selectedTransaction.order_status !== "completed" && (
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(
                        selectedTransaction.id_payment,
                        "success",
                        selectedTransaction.id_order
                      )
                    }
                    className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                      "success"
                    )} ${
                      isSuccessButtonDisabled()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:opacity-80 transition-opacity"
                    }`}
                    disabled={isSuccessButtonDisabled()}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />{" "}
                    Sukses
                  </button>
                )}

              {/* 'Batal' button */}
              {selectedTransaction.payment_status !== "success" &&
                selectedTransaction.order_status !== "canceled" &&
                selectedTransaction.order_status !== "completed" && (
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(
                        selectedTransaction.id_payment,
                        "failed",
                        selectedTransaction.id_order
                      )
                    }
                    className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                      "failed"
                    )} hover:opacity-80 transition-opacity`}
                    disabled={
                      selectedTransaction.payment_status === "success" ||
                      selectedTransaction.order_status === "canceled" ||
                      selectedTransaction.order_status === "completed"
                    }
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />{" "}
                    Batal
                  </button>
                )}

              {/* "Pending" button */}
              {selectedTransaction.payment_status !== "pending" &&
                selectedTransaction.order_status !== "canceled" &&
                selectedTransaction.order_status !== "completed" && (
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(
                        selectedTransaction.id_payment,
                        "pending",
                        selectedTransaction.id_order
                      )
                    }
                    className={`py-3 px-4 rounded-lg font-bold ${getStatusClass(
                      "pending"
                    )} hover:opacity-80 transition-opacity`}
                    disabled={
                      selectedTransaction.payment_status === "success" ||
                      selectedTransaction.order_status === "canceled" ||
                      selectedTransaction.order_status === "completed"
                    }
                  >
                    Set ke Pending
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- Amount Paid Edit Modal --- */}
      {isAmountEditModalOpen && editAmountTransaction && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeAmountEditModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-96 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAmountEditModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              Edit Jumlah Bayar
            </h2>
            <p className="text-md mb-2">
              Order ID:{" "}
              <span className="font-semibold">
                {editAmountTransaction.id_order}
              </span>
            </p>
            <p className="text-md mb-2">
              Jumlah Tagihan:{" "}
              <span className="font-semibold">
                Rp {editAmountTransaction.order_amount.toLocaleString("id-ID")}
              </span>
            </p>
            <div className="mb-4">
              <label
                htmlFor="amount_paid_input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nominal yang dibayar:
              </label>
              <input
                id="amount_paid_input"
                type="number"
                value={tempEditedAmount}
                onChange={handleTempEditedAmountChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
                min="0"
                step="any"
                autoFocus
              />
              {amountEditError && (
                <p className="text-red-600 text-xs mt-1">{amountEditError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeAmountEditModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateAmountPaid}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

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

export default TransactionsPage;
