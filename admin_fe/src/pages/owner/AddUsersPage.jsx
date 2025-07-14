import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";

const SECRET_KEY = "sacaluna_secret_key";

function AddUsersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });
  const [authError, setAuthError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (AddUsersPage):",
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

    if (!token || user?.role !== "Admin") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitLoading(true);

    if (form.password.length < 8) {
      alert("Password minimal terdiri dari 8 karakter.");
      setSubmitLoading(false);
      return;
    }

    const encryptedPassword = CryptoJS.AES.encrypt(
      form.password,
      SECRET_KEY
    ).toString();

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name_user: form.username,
            email: form.email,
            password: encryptedPassword,
            role: form.role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 409 &&
          errorData.message === "Email sudah terdaftar"
        ) {
          alert("Email sudah terdaftar. Mohon gunakan email lain.");
          setAuthError("Email sudah terdaftar. Mohon gunakan email lain.");
        } else {
          await handleAuthenticationError(response);
        }
        return;
      }

      alert("User berhasil ditambahkan");
      navigate("/users");
    } catch (error) {
      console.error("Error saat menambahkan user:", error);
      setAuthError("Terjadi kesalahan saat menambahkan user: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 relative">
        <SidebarAdmin
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 p-4 md:p-8 lg:p-16 overflow-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-8">
            Add New User
          </h1>

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
            className="bg-white border rounded shadow-md flex flex-col lg:flex-row w-full h-auto min-h-[60vh] lg:h-[700px] gap-4 md:gap-12 relative p-4 md:p-8"
          >
            <div className="flex-1 flex flex-col space-y-4 justify-start">
              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={(e) => {
                    handleChange(e);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      "Silakan isi username terlebih dahulu"
                    )
                  }
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={form.email}
                  onChange={(e) => {
                    handleChange(e);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    if (!e.target.validity.valid) {
                      e.target.setCustomValidity(
                        "Silakan masukkan email dengan benar, contoh: nama@gmail.com"
                      );
                    }
                  }}
                  pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col relative">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => {
                    handleChange(e);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    if (e.target.value.length < 8) {
                      e.target.setCustomValidity(
                        "Password harus minimal 8 karakter"
                      );
                    }
                  }}
                  minLength={8}
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                  required
                />
                <div
                  className="absolute right-3 top-[55%] -translate-y-1/2 cursor-pointer text-gray-600"
                  onClick={togglePassword}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={form.role}
                    onChange={(e) => {
                      handleChange(e);
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) =>
                      e.target.setCustomValidity(
                        "Silakan pilih role terlebih dahulu"
                      )
                    }
                    className="appearance-none w-full px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                    required
                  >
                    <option value="" disabled>
                      Pilih Role
                    </option>
                    <option value="Admin">Admin</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Kitchen">Kitchen</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                    <FaChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="mt-8 md:mt-12 flex justify-center">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full sm:w-60 text-base md:text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-3 md:py-4 rounded-lg font-bold transition duration-200 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {submitLoading ? "Menambahkan..." : "Add User"}{" "}
                </button>
              </div>
            </div>

            <div className="flex-1 hidden lg:flex items-center justify-center">
              <img
                src={signImage}
                alt="User Illustration"
                className="object-cover w-full h-full "
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

export default AddUsersPage;
