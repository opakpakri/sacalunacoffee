import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faSpinner } from "@fortawesome/free-solid-svg-icons"; // Import faSpinner
import SidebarCashier from "../../components/SidebarCashier";

function EditBarcodesPage() {
  const { id } = useParams();
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true); // Loading for fetching data
  const [isSaving, setIsSaving] = useState(false); // New: Loading for saving data
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  // Centralized function to handle authentication errors and redirect
  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (EditBarcodesPage):",
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

  const fetchTableData = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/${id}`,
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
      setTableNumber(data.table_number);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setAuthError("Gagal memuat data meja: " + error.message);
      setTimeout(() => navigate("/barcodeCashier"), 3000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, handleAuthenticationError]);

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
    fetchTableData();
  }, [navigate, fetchTableData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsSaving(true); // Set saving to true when submit starts

    if (!tableNumber.trim()) {
      alert("Nomor meja tidak boleh kosong!");
      setIsSaving(false); // Reset saving if validation fails
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ table_number: tableNumber }),
        }
      );

      if (!response.ok) {
        await handleAuthenticationError(response);
        return; // Stop execution if auth error
      }

      const data = await response.json();
      alert(data.message);
      navigate("/barcodeCashier");
    } catch (error) {
      console.error("Error updating table:", error);
      setAuthError("Terjadi kesalahan saat mengedit meja: " + error.message);
    } finally {
      setIsSaving(false); // Always reset saving to false
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat data meja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarCashier />
        <div className="flex-1 p-16 bg-white">
          <h1 className="text-2xl font-bold mb-8">Edit Table</h1>

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

          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded shadow-md flex w-full h-[700px] gap-12 relative"
          >
            {/* Form Section */}
            <div className="flex-1 p-12 space-y-4 relative">
              {/* Nomor Meja */}
              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Nomor Meja</label>
                <input
                  name="table_number"
                  type="text"
                  placeholder="Masukkan nomor meja (ex: SC1, SC2, ...)"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      "Silakan isi nomor meja terlebih dahulu"
                    )
                  }
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-12">
                <button
                  type="submit"
                  className="w-60 text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-4 rounded-lg font-bold transition duration-200 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving} // Disable button when saving
                >
                  {isSaving ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-lg"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faSave}
                        className="group-hover:text-black text-lg"
                      />
                      Update Table
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Image Section */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={signImage}
                alt="Table Illustration"
                className="object-cover w-full h-full"
              />
            </div>
          </form>

          {/* Footer Logo */}
          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm  font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditBarcodesPage;
