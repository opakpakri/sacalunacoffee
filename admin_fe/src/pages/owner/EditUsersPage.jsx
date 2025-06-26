import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CryptoJS from "crypto-js";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faSave } from "@fortawesome/free-solid-svg-icons";
import { FaChevronDown } from "react-icons/fa";

// PASTIKAN NILAI INI SAMA PERSIS DENGAN NILAI 'SECRET_KEY' DI file .env ANDA
const SECRET_KEY = "sacaluna_secret_key";

function EditUsersPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "", // Password dikosongkan secara default untuk edit
    role: "",
  });
  const [authError, setAuthError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fungsi terpusat untuk menangani error autentikasi
  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (EditUsersPage):",
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

  const fetchUser = useCallback(async () => {
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await handleAuthenticationError(response);
        return;
      }

      const data = await response.json();
      setForm({
        username: data.name_user || "",
        email: data.email || "",
        role: data.role || "",
        password: "", // Password tidak di-load dari backend untuk keamanan
      });
    } catch (error) {
      console.error("Gagal fetch user:", error);
      setAuthError(
        "Gagal memuat data pengguna. Pastikan server berjalan dan ID pengguna valid."
      );
    }
  }, [id, handleAuthenticationError]);

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
    fetchUser();
  }, [navigate, fetchUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitLoading(true);

    try {
      let body;
      const token = localStorage.getItem("adminToken");

      // Validasi format email secara manual sebelum mengirim ke backend
      if (!form.email.endsWith("@gmail.com")) {
        alert(
          "Format email tidak valid. Email harus diakhiri dengan @gmail.com"
        );
        setSubmitLoading(false);
        return;
      }

      // Jika password diisi, lakukan validasi dan enkripsi
      if (form.password && form.password.trim() !== "") {
        if (form.password.length < 8) {
          alert("Password minimal terdiri dari 8 karakter.");
          setSubmitLoading(false);
          return;
        }

        const encryptedPassword = CryptoJS.AES.encrypt(
          form.password,
          SECRET_KEY
        ).toString();

        body = {
          name_user: form.username,
          email: form.email,
          role: form.role,
          password: encryptedPassword, // Kirim password terenkripsi
        };
      } else {
        // Jika password kosong, jangan kirim field password ke backend
        body = {
          name_user: form.username,
          email: form.email,
          role: form.role,
        };
      }

      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 409 &&
          errorData.message.includes("Email sudah terdaftar")
        ) {
          alert(
            "Email sudah terdaftar untuk pengguna lain. Mohon gunakan email lain."
          );
          setAuthError(
            "Email sudah terdaftar untuk pengguna lain. Mohon gunakan email lain."
          );
        } else {
          await handleAuthenticationError(response);
        }
        return;
      }

      alert("User berhasil diperbarui");
      navigate("/users");
    } catch (error) {
      console.error("Error saat memperbarui user:", error);
      setAuthError("Terjadi kesalahan saat memperbarui user: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16 bg-white">
          <h1 className="text-2xl font-bold mb-8">Edit User</h1>

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
            className="relative bg-white border rounded shadow-md flex w-full h-[700px] gap-12"
          >
            <div className="flex-1 p-12 space-y-4 relative">
              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Username</label>
                <input
                  name="username"
                  type="text"
                  placeholder="Masukkan username baru"
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
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Masukkan email baru"
                  value={form.email}
                  onChange={(e) => {
                    handleChange(e);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    if (!e.target.validity.valid) {
                      e.target.setCustomValidity(
                        "Email harus dalam format yang benar dan diakhiri dengan @gmail.com" // Pesan error yang lebih spesifik
                      );
                    }
                  }}
                  // Menambahkan pattern untuk validasi @gmail.com
                  pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$" // <<< PERUBAHAN DI SINI
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="flex flex-col relative">
                <label className="text-lg font-bold mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Masukkan password baru (kosongkan jika tidak ingin mengubah)"
                  value={form.password}
                  minLength={8}
                  onChange={(e) => {
                    handleChange(e);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    if (e.target.value !== "") {
                      e.target.setCustomValidity("Password minimal 8 karakter");
                    }
                  }}
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Role</label>
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
                    className="appearance-none w-full px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

              <div className="absolute left-1/2 -translate-x-1/2 bottom-12">
                <button
                  type="submit"
                  disabled={submitLoading}
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
                      icon={faSave}
                      className="group-hover:text-black text-lg"
                    />
                  )}
                  {submitLoading ? "Mengupdate..." : "Update User"}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={signImage}
                alt="User Illustration"
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

export default EditUsersPage;
