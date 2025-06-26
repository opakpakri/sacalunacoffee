import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import { FaEdit, FaTrash } from "react-icons/fa";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faSpinner, // <--- Pastikan faSpinner diimpor
  faTimesCircle, // <--- Pastikan faTimesCircle diimpor
} from "@fortawesome/free-solid-svg-icons";

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // State untuk loading pencarian
  const [initialLoading, setInitialLoading] = useState(true); // State untuk loading awal

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
        "Detail Error Autentikasi:",
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

  // Bungkus fetchUsers dengan useCallback
  const fetchUsers = useCallback(async () => {
    // setSearchLoading(true); // Ini akan diatur oleh useEffect debounce
    // setAuthError(null); // Ini akan direset di sini
    const token = localStorage.getItem("adminToken");
    console.log(
      "Mengambil pengguna dengan token:",
      token ? "Token ada" : "Token tidak ada"
    );

    try {
      const res = await fetch("http://localhost:3000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();
      setUsers(data);
      setAuthError(null);
    } catch (error) {
      console.error(
        "Gagal memuat pengguna (kesalahan jaringan atau tak tertangani):",
        error
      );
      setAuthError(
        "Gagal memuat daftar pengguna. Pastikan server berjalan dan koneksi internet Anda stabil."
      );
    }
  }, [handleAuthenticationError]);

  // Effect untuk loading awal
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

    const loadUsers = async () => {
      setInitialLoading(true); // Aktifkan loading awal
      await fetchUsers();
      setInitialLoading(false); // Matikan loading awal setelah fetch
    };

    loadUsers();
  }, [navigate, fetchUsers]);

  // Effect untuk pencarian (dengan Debounce)
  useEffect(() => {
    // Hanya aktifkan debounce setelah loading awal selesai
    if (!initialLoading) {
      const delayDebounceFn = setTimeout(async () => {
        setSearchLoading(true); // Aktifkan loading pencarian
        await fetchUsers(); // Panggil ulang fetchUsers untuk pencarian
        setSearchLoading(false); // Matikan loading pencarian
      }, 500); // Debounce 500ms

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, fetchUsers, initialLoading]); // searchTerm, fetchUsers, dan initialLoading sebagai dependency

  const filteredUsers = users.filter(
    (user) =>
      user.name_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (currentUser?.id_user === id) {
      alert("Kamu tidak bisa menghapus akun yang sedang login.");
      return;
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus user "${name}"?`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();
      alert(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Gagal menghapus user.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16 ">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">User Management</h1>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cari User:</label>
              <input
                type="text"
                placeholder="Cari user..."
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
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-200 text-left">
                  <th className="p-3 w-[5%] text-center">No</th>
                  <th className="p-3 w-[35%]">Username</th>
                  <th className="p-3 w-[35%]">Email</th>
                  <th className="p-3 w-[12.5%]">Role</th>
                  <th className="p-3 w-[12.5%]">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Tampilkan loading awal atau loading pencarian */}
                {initialLoading || searchLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-3xl text-yellow-500 mb-4"
                      />
                      <p>
                        {initialLoading
                          ? "Memuat data pengguna..."
                          : "Mencari pengguna..."}
                      </p>
                    </td>
                  </tr>
                ) : authError && !initialLoading && !searchLoading ? ( // Tampilkan error umum jika ada dan bukan karena loading
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
                      />
                      <p>{authError}</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id_user} className="hover:bg-gray-100">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 ">{user.name_user}</td>
                      <td className="p-3 ">{user.email}</td>
                      <td className="p-3 ">{user.role}</td>
                      <td className="p-3">
                        <div className="flex  gap-8">
                          <button
                            onClick={() => {
                              if (user.id_user === currentUser?.id_user) {
                                alert(
                                  "Kamu tidak bisa mengedit akun yang sedang login."
                                );
                                return;
                              }
                              navigate(`/users/edit-user/${user.id_user}`);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(user.id_user, user.name_user)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div>
            <button
              onClick={() => navigate("/users/add-user")}
              className="w-50 text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-2 rounded-lg font-bold transition duration-200 mt-4 flex items-center justify-center gap-4"
            >
              <FontAwesomeIcon
                icon={faCirclePlus}
                className="group-hover:text-black text-lg"
              />
              Add User
            </button>
          </div>
          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm  font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
