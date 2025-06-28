import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import SidebarCashier from "../../components/SidebarCashier";

function AddBarcodesPage() {
  const [tableNumber, setTableNumber] = useState("");
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState(null); // State for form-specific errors

  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (AddBarcodesPage):",
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
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setFormError(null); // Clear previous form-specific errors
    setSubmitLoading(true); // Activate loading state

    if (!tableNumber.trim()) {
      alert("Nomor meja tidak boleh kosong!"); // Alert for empty input
      setFormError("Nomor meja tidak boleh kosong!"); // Set form-specific error
      setSubmitLoading(false); // Deactivate loading if validation fails
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/tables/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ table_number: tableNumber }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json(); // Parse JSON for detailed error messages
        if (response.status === 409) {
          // Handle 409 Conflict: Table number already exists
          const errorMessage = errorData.message || "Nomor meja sudah ada.";
          alert(errorMessage); // Added: Alert for duplicate table number
          setFormError(errorMessage); // Set form-specific error
        } else {
          // For any other non-OK status, delegate to the general authentication error handler
          await handleAuthenticationError(response);
        }
        return; // Stop further execution after handling the error
      }

      const data = await response.json(); // Parse successful response

      alert(data.message); // Show success message
      navigate("/barcodeCashier"); // Redirect on success
    } catch (error) {
      console.error("Error adding table:", error);
      alert("Terjadi kesalahan saat menambahkan meja."); // General alert for network/unexpected errors
      setFormError("Terjadi kesalahan saat menambahkan meja: " + error.message); // Catch network or unexpected errors
    } finally {
      setSubmitLoading(false); // Deactivate loading state regardless of success or failure
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarCashier />
        <div className="flex-1 p-16 bg-white">
          <h1 className="text-2xl font-bold mb-8">Add New Table</h1>

          {/* Display general authentication errors */}
          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded shadow-md flex w-full h-[700px] gap-12 relative"
          >
            <div className="flex-1 p-12 space-y-4 relative">
              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Nomor Meja</label>
                <input
                  name="table_number"
                  type="text"
                  placeholder="Masukkan nomor meja (ex: SC1, SC2, ...)"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    e.target.setCustomValidity(""); // Clear browser's validation message
                    setFormError(null); // Clear form error when input changes
                  }}
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      "Silakan isi nomor meja terlebih dahulu"
                    )
                  }
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                {/* Display form-specific errors directly below the input */}
                {formError && (
                  <p className="text-red-500 text-sm mt-2">{formError}</p>
                )}
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 bottom-12">
                <button
                  type="submit"
                  disabled={submitLoading} // Disable button while loading
                  className="w-60 text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-4 rounded-lg font-bold transition duration-200 flex items-center justify-center gap-4
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-lg"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faCirclePlus}
                      className="group-hover:text-black text-lg"
                    />
                  )}
                  {submitLoading ? "Menambahkan..." : "Add Table"}{" "}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={signImage}
                alt="Table Illustration"
                className="object-cover w-full h-full"
              />
            </div>
          </form>

          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddBarcodesPage;
