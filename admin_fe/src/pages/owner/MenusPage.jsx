import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import { FaEdit, FaTrash } from "react-icons/fa";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faXmark,
  faSpinner, // <--- Import faSpinner
  faTimesCircle, // <--- Import faTimesCircle
} from "@fortawesome/free-solid-svg-icons";

function MenusPage() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // <--- State baru untuk loading pencarian
  const [initialLoading, setInitialLoading] = useState(true); // <--- State baru untuk loading awal

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
        "Detail Error Autentikasi (MenusPage):",
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

  // Bungkus fetchMenus dengan useCallback
  const fetchMenus = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    console.log(
      "Mengambil menu dengan token:",
      token ? "Token ada" : "Token tidak ada"
    );

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
  }, [handleAuthenticationError]); // handleAuthenticationError adalah dependency fetchMenus

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

    const loadMenusData = async () => {
      setInitialLoading(true); // Aktifkan loading awal
      await fetchMenus();
      setInitialLoading(false); // Matikan loading awal setelah fetch
    };

    loadMenusData();
  }, [navigate, fetchMenus]); // navigate dan fetchMenus adalah dependency

  // Effect untuk pencarian (dengan Debounce)
  useEffect(() => {
    // Hanya aktifkan debounce setelah loading awal selesai
    if (!initialLoading) {
      const delayDebounceFn = setTimeout(async () => {
        setSearchLoading(true); // Aktifkan loading pencarian
        await fetchMenus(); // Panggil ulang fetchMenus untuk pencarian
        setSearchLoading(false); // Matikan loading pencarian
      }, 500); // Debounce 500ms

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, fetchMenus, initialLoading]); // searchTerm, fetchMenus, dan initialLoading sebagai dependency

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name_menu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category_menu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.price.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openImageModal = (imageName) => {
    console.log("Buka gambar:", imageName);
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
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cari Menu:</label>
              <input
                type="text"
                placeholder="Search menu..."
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
                  <th className="p-3 w-[35%]">Name Menu</th>
                  <th className="p-3 w-[15%]">Category</th>
                  <th className="p-3 w-[15%]">Price</th>
                  <th className="p-3 w-[15%]">Image</th>
                  <th className="p-3 w-[12.5%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Tampilkan loading awal atau loading pencarian */}
                {initialLoading || searchLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-3xl text-yellow-500 mb-4"
                      />
                      <p>
                        {initialLoading
                          ? "Memuat data menu..."
                          : "Mencari menu..."}
                      </p>
                    </td>
                  </tr>
                ) : authError && !initialLoading && !searchLoading ? ( // Tampilkan error umum jika ada dan bukan karena loading
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
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
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 ">{menu.name_menu}</td>
                      <td className="p-3 ">{menu.category_menu}</td>
                      <td className="p-3 w-[170px]">
                        Rp {menu.price.toLocaleString()}
                      </td>
                      <td className="p-3 ">
                        <button
                          onClick={() => openImageModal(menu.image_menu)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Review Image
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-8 justify-center items-center">
                          <button
                            onClick={() =>
                              navigate(`/menus/edit-menu/${menu.id_menu}`)
                            }
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          {/* <button
                            onClick={() =>
                              handleDelete(menu.id_menu, menu.name_menu)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button> */}
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
              onClick={() => navigate("/menus/add-menu")}
              className="w-50 text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-2 rounded-lg font-bold transition duration-200 mt-4 flex items-center justify-center gap-4"
            >
              <FontAwesomeIcon
                icon={faCirclePlus}
                className="group-hover:text-black text-lg"
              />
              Add Menu
            </button>
          </div>

          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-4 text-gray-600 hover:text-black text-xl font-bold"
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
