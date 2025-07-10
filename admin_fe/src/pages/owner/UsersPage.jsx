import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import { FaEdit, FaTrash } from "react-icons/fa";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faSpinner,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Sidebar control states and functions ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Close sidebar on route change (for mobile)
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  // --- End Sidebar control states ---

  const [users, setUsers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const fetchUsers = useCallback(async () => {
    setAuthError(null);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      setInitialLoading(true);
      await fetchUsers();
      setInitialLoading(false);
    };

    loadUsers();
  }, [navigate, fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!initialLoading) {
      setSearchLoading(true);
      const delayDebounceFn = setTimeout(() => {
        setSearchLoading(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, initialLoading]);

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
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex flex-1 relative">
        <SidebarAdmin
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <div className="flex-1 p-4 md:p-8 lg:p-16 overflow-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
            <h1 className="text-xl md:text-2xl font-bold">User Management</h1>
            <div className="flex items-center gap-2 border border-black rounded-lg shadow-sm px-4 py-2 h-11 w-full sm:w-[calc(50%-0.5rem)] max-w-xs">
              <label className="text-sm font-medium whitespace-nowrap">
                Cari User:
              </label>
              <input
                type="text"
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent focus:outline-none focus:ring-0 h-full w-full text-sm flex-1"
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

          <div className="bg-white border rounded shadow-md w-full h-[60vh] md:h-[700px] overflow-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-200 text-left">
                <tr>
                  <th className="p-2 md:p-3 w-[5%] text-center">No</th>
                  <th className="p-2 md:p-3 w-[30%]">Username</th>
                  <th className="p-2 md:p-3 w-[30%] ">Email</th>
                  <th className="p-2 md:p-3 w-[15%]">Role</th>
                  <th className="p-2 md:p-3 w-[15%]">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {initialLoading || searchLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl md:text-3xl text-yellow-500 mb-4"
                      />
                      <p>
                        {initialLoading
                          ? "Memuat data pengguna..."
                          : "Mencari pengguna..."}
                      </p>
                    </td>
                  </tr>
                ) : authError && !initialLoading && !searchLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-2xl md:text-3xl text-red-500 mb-4"
                      />
                      <p>{authError}</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id_user} className="hover:bg-gray-100">
                      <td className="p-2 md:p-3 text-center">{index + 1}</td>
                      <td className="p-2 md:p-3">{user.name_user}</td>
                      <td className="p-2 md:p-3 ">{user.email}</td>
                      <td className="p-2 md:p-3">{user.role}</td>
                      <td className="p-2 md:p-3">
                        <div className="flex gap-2 md:gap-4 ">
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
                            className="text-blue-600 hover:text-blue-800 text-sm md:text-base"
                          >
                            <FaEdit className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(user.id_user, user.name_user)
                            }
                            className="text-red-600 hover:text-red-800 text-sm md:text-base"
                          >
                            <FaTrash className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mt-4">
            <button
              onClick={() => navigate("/users/add-user")}
              className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-2 bg-black hover:bg-yellow-500 text-white hover:text-black rounded-lg font-bold transition duration-200 h-11 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
              Add User
            </button>
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

export default UsersPage;
