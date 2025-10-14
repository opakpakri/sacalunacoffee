import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faPlus,
  faSave,
  faSpinner,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import LogoImage from "../../assets/images/logo.webp";
import SidebarKitchen from "../../components/SidebarKitchen";

function StockMenusPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [updatedStocks, setUpdatedStocks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMenus = useCallback(async () => {
    setAuthError(null);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/menus",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        setAuthError("Gagal memuat data. Silakan login kembali.");
        setTimeout(() => {
          localStorage.clear();
          navigate("/");
        }, 2000);
        return;
      }

      const data = await res.json();
      setMenus(data.data || []);
    } catch (error) {
      console.error("Gagal memuat stok:", error);
      setAuthError("Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // --- Cek role Kitchen ---
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || user?.role !== "Kitchen") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      } else {
        alert("Hanya pihak dapur (Kitchen) yang dapat mengakses halaman ini.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }

    fetchMenus();
  }, [navigate, fetchMenus]);

  // --- Ubah nilai stok di state sementara ---
  const handleStockChange = (id, newStock) => {
    if (newStock < 0) newStock = 0;
    setUpdatedStocks((prev) => ({ ...prev, [id]: newStock }));
  };

  const handleIncrement = (id, currentStock) =>
    handleStockChange(id, (updatedStocks[id] ?? currentStock) + 1);

  const handleDecrement = (id, currentStock) =>
    handleStockChange(id, (updatedStocks[id] ?? currentStock) - 1);

  // --- Simpan stok ke backend ---
  const handleSaveStock = async (id) => {
    const token = localStorage.getItem("adminToken");
    const newStock = updatedStocks[id];

    if (newStock === undefined) {
      alert("Tidak ada perubahan stok untuk disimpan.");
      return;
    }

    try {
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/menus/${id}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stock: newStock }),
        }
      );

      if (!res.ok) {
        alert("Gagal menyimpan stok. Silakan coba lagi.");
        return;
      }

      alert("Stok berhasil diperbarui!");
      setUpdatedStocks((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      fetchMenus(); // refresh data
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Terjadi kesalahan saat menyimpan stok.");
    }
  };

  const handleSaveAll = async () => {
    const token = localStorage.getItem("adminToken");

    if (Object.keys(updatedStocks).length === 0) {
      alert("Tidak ada perubahan stok untuk disimpan.");
      return;
    }

    try {
      // Simpan semua perubahan stok secara paralel
      await Promise.all(
        Object.entries(updatedStocks).map(async ([id, stock]) => {
          await fetch(
            `https://sacalunacoffee-production.up.railway.app/api/menus/${id}/stock`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ stock }),
            }
          );
        })
      );

      alert("Semua stok berhasil diperbarui!");
      setUpdatedStocks({});
      fetchMenus();
    } catch (error) {
      console.error("Error saving all stocks:", error);
      alert("Terjadi kesalahan saat menyimpan seluruh stok.");
    }
  };

  // --- Filter menu berdasarkan pencarian ---
  const filteredMenus = menus.filter(
    (menu) =>
      menu.name_menu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category_menu?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 relative">
        <SidebarKitchen
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 p-4 md:p-8 lg:p-16 overflow-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
            {" "}
            {/* Adjusted spacing and alignment */}
            <h1 className="text-xl md:text-2xl font-bold">
              Today Transaction
            </h1>{" "}
            {/* Responsive font size */}
            <div className="flex items-center gap-2 border border-black rounded-lg shadow-sm px-4 py-2 h-11 w-full sm:w-auto max-w-xs">
              {" "}
              {/* Responsive width */}
              <label className="text-sm font-medium whitespace-nowrap">
                Cari Data:
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
                  <th className="p-2 md:p-3 w-[20%]">Category</th>
                  <th className="p-2 md:p-3 w-[25%] text-center">Stock</th>
                  <th className="p-2 md:p-3 w-[20%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl text-yellow-500 mb-2"
                      />
                      <p>Memuat data...</p>
                    </td>
                  </tr>
                ) : authError ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-2xl text-red-500 mb-2"
                      />
                      <p>{authError}</p>
                    </td>
                  </tr>
                ) : filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((menu, index) => {
                    const currentStock =
                      updatedStocks[menu.id_menu] ?? menu.stock ?? 0;
                    return (
                      <tr key={menu.id_menu} className="hover:bg-gray-100">
                        <td className="p-2 md:p-3 text-center">{index + 1}</td>
                        <td className="p-2 md:p-3">{menu.name_menu}</td>
                        <td className="p-2 md:p-3">{menu.category_menu}</td>
                        <td className="p-2 md:p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                handleDecrement(menu.id_menu, menu.stock)
                              }
                              className="px-2 py-1 bg-red-500 hover:bg-red-400 text-white rounded-full"
                            >
                              <FontAwesomeIcon icon={faMinus} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) =>
                                handleStockChange(
                                  menu.id_menu,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 text-center border rounded-md py-1"
                            />
                            <button
                              onClick={() =>
                                handleIncrement(menu.id_menu, menu.stock)
                              }
                              className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded-full"
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                        </td>
                        <td className="p-2 md:p-3 text-center">
                          <button
                            onClick={() => handleSaveStock(menu.id_menu)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 font-semibold transition duration-150"
                          >
                            <FontAwesomeIcon icon={faSave} /> Save
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mt-4">
            <div className="flex flex-col items-start">
              <button
                onClick={handleSaveAll}
                disabled={Object.keys(updatedStocks).length === 0}
                className={`w-full sm:w-auto px-4 py-2 md:px-6 md:py-2 rounded-lg font-bold h-11 flex items-center justify-center gap-2 text-sm md:text-base transition duration-200
        ${
          Object.keys(updatedStocks).length === 0
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-black hover:bg-yellow-500 text-white hover:text-black"
        }`}
              >
                <FontAwesomeIcon icon={faSave} className="text-lg" />
                Save All
              </button>
              <p className="mt-2 text-xs md:text-sm text-gray-600">
                * Tombol "Save All" akan Aktif jika ada perubahan data pada
                stock.
              </p>
            </div>

            {/* Sacaluna Coffee branding */}
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

export default StockMenusPage;
