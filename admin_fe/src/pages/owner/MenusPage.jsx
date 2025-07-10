import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import { FaEdit } from "react-icons/fa";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faXmark,
  faSpinner,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

function MenusPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Sidebar control states and functions ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  // --- End Sidebar control states ---

  const [menus, setMenus] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
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

  const fetchMenus = useCallback(async () => {
    setAuthError(null);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/menus",
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
      setMenus(data.data);
      setAuthError(null);
    } catch (error) {
      console.error(
        "Gagal memuat menu (kesalahan jaringan atau tak tertangani):",
        error
      );
      setAuthError(
        "Gagal memuat daftar menu. Pastikan server berjalan dan koneksi internet Anda stabil."
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

    const loadMenusData = async () => {
      setInitialLoading(true);
      await fetchMenus();
      setInitialLoading(false);
    };

    loadMenusData();
  }, [navigate, fetchMenus]);

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name_menu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category_menu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.price.toString().toLowerCase().includes(searchTerm.toLowerCase())
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

  const openImageModal = (imageName) => {
    setSelectedImageUrl(
      `https://sacalunacoffee-production.up.railway.app${imageName}`
    );
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUrl("");
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
            <h1 className="text-xl md:text-2xl font-bold">Menu Management</h1>
            <div className="flex items-center gap-2 border border-black rounded-lg shadow-sm px-4 py-2 h-11 w-full sm:w-[calc(50%-0.5rem)] max-w-xs">
              <label className="text-sm font-medium whitespace-nowrap">
                Cari Menu:
              </label>
              <input
                type="text"
                placeholder="Search menu..."
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
                  <th className="p-2 md:p-3 w-[30%]">Name Menu</th>
                  <th className="p-2 md:p-3 w-[15%] ">Category</th>
                  <th className="p-2 md:p-3 w-[15%]">Price</th>
                  <th className="p-2 md:p-3 w-[15%] ">Image</th>
                  <th className="p-2 md:p-3 w-[15%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {initialLoading || searchLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl md:text-3xl text-yellow-500 mb-4"
                      />
                      <p>
                        {initialLoading
                          ? "Memuat data menu..."
                          : "Mencari menu..."}
                      </p>
                    </td>
                  </tr>
                ) : authError && !initialLoading && !searchLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-2xl md:text-3xl text-red-500 mb-4"
                      />
                      <p>{authError}</p>
                    </td>
                  </tr>
                ) : filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((menu, index) => (
                    <tr key={menu.id_menu} className="hover:bg-gray-100">
                      <td className="p-2 md:p-3 text-center">{index + 1}</td>
                      <td className="p-2 md:p-3">{menu.name_menu}</td>
                      <td className="p-2 md:p-3 ">{menu.category_menu}</td>
                      <td className="p-2 md:p-3">
                        Rp {menu.price.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 md:p-3 ">
                        <button
                          onClick={() => openImageModal(menu.image_menu)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Review Image
                        </button>
                      </td>
                      <td className="p-2 md:p-3">
                        <div className="flex gap-2 md:gap-4 justify-center">
                          <button
                            onClick={() =>
                              navigate(`/menus/edit-menu/${menu.id_menu}`)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <FaEdit className="w-4 h-4 md:w-5 md:h-5" />
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
              onClick={() => navigate("/menus/add-menu")}
              className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-2 bg-black hover:bg-yellow-500 text-white hover:text-black rounded-lg font-bold transition duration-200 h-11 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
              Add Menu
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

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl font-bold"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
            <img
              src={selectedImageUrl}
              alt="Menu"
              className="w-full h-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MenusPage;
