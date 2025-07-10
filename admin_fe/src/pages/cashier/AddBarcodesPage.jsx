import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import Navbar from "../../components/Navbar";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import SidebarCashier from "../../components/SidebarCashier";

function AddBarcodesPage() {
  const [tableNumber, setTableNumber] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState(null);

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
    setFormError(null);
    setSubmitLoading(true);

    if (!tableNumber.trim()) {
      alert("Nomor meja tidak boleh kosong!");
      setFormError("Nomor meja tidak boleh kosong!");
      setSubmitLoading(false);
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
        const errorData = await response.json();
        if (response.status === 409) {
          const errorMessage = errorData.message || "Nomor meja sudah ada.";
          alert(errorMessage);
          setFormError(errorMessage);
        } else {
          await handleAuthenticationError(response);
        }
        return;
      }

      const data = await response.json();

      alert(data.message);
      navigate("/barcodeCashier");
    } catch (error) {
      console.error("Error adding table:", error);
      alert("Terjadi kesalahan saat menambahkan meja.");
      setFormError("Terjadi kesalahan saat menambahkan meja: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 relative">
        {" "}
        <SidebarCashier
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 p-4 md:p-8 lg:p-16 overflow-auto">
          {" "}
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-8">
            Add New Table
          </h1>{" "}
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
            className="bg-white border rounded shadow-md flex flex-col lg:flex-row w-full h-auto min-h-[60vh] lg:h-[700px] gap-4 md:gap-12 relative" /* Responsive height, flex direction, and gap */
          >
            <div className="flex-1 flex flex-col space-y-4 justify-start p-4 md:p-8">
              {" "}
              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Nomor Meja
                </label>{" "}
                <input
                  name="table_number"
                  type="text"
                  placeholder="Masukkan nomor meja (ex: SC1, SC2, ...)"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    e.target.setCustomValidity("");
                    setFormError(null);
                  }}
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      "Silakan isi nomor meja terlebih dahulu"
                    )
                  }
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base" /* Responsive padding and font size */
                  required
                />
                {formError && (
                  <p className="text-red-500 text-xs md:text-sm mt-2">
                    {formError}
                  </p>
                )}
              </div>
              <div className="mt-8 md:mt-12 flex justify-center">
                {" "}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full sm:w-60 text-base md:text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-3 md:py-4 rounded-lg font-bold transition duration-200 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed" /* Responsive width, padding, and font size */
                >
                  {submitLoading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-lg"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
                  )}
                  {submitLoading ? "Menambahkan..." : "Add Table"}
                </button>
              </div>
            </div>

            <div className="hidden lg:flex-1 lg:flex items-center justify-center">
              {" "}
              <img
                src={signImage}
                alt="Table Illustration"
                className="object-cover w-full h-full"
              />
            </div>
          </form>
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mt-4">
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
      </div>
    </div>
  );
}

export default AddBarcodesPage;
