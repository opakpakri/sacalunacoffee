import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import signImage from "../../assets/images/signImage.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faSave } from "@fortawesome/free-solid-svg-icons";
import { FaChevronDown } from "react-icons/fa";

function EditMenusPage() {
  const navigate = useNavigate();
  const { id } = useParams();
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

  const [form, setForm] = useState({
    name_menu: "",
    price: "",
    category: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);
  const [drinkType, setDrinkType] = useState("Default");
  const [authError, setAuthError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isDrinkCategory = !["Pastry", "Main Course", "Snacks"].includes(
    form.category
  );

  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (EditMenusPage):",
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

  const fetchMenu = useCallback(async () => {
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/menus/${id}`,
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

      const category = data.category_menu || "";
      const name = data.name_menu || "";
      let detectedDrinkType = "";

      if (!["Pastry", "Main Course", "Snacks"].includes(category)) {
        const match = name.match(/^(Iced|Hot)\s+/i);
        if (match) {
          detectedDrinkType = match[1];
        }
      }

      setForm({
        name_menu: name.replace(/^(Iced|Hot)\s+/i, ""),
        price: data.price || "",
        category: category,
        image: null,
      });

      setDrinkType(detectedDrinkType);
      setOldImage(data.image_menu);
    } catch (error) {
      console.error("Gagal fetch menu:", error);
      setAuthError(
        "Gagal memuat data menu. Pastikan server berjalan dan ID menu valid."
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
    fetchMenu();
  }, [navigate, fetchMenu]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });
      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      } else {
        setPreviewImage(null);
      }
      setOldImage(null);
    } else {
      if (name === "category" && !isDrinkCategory) {
        setDrinkType("");
      }
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitLoading(true);

    let updatedName = form.name_menu;
    if (isDrinkCategory && drinkType !== "" && drinkType !== "Default") {
      updatedName = `${drinkType} ${form.name_menu}`;
    }

    const formData = new FormData();
    formData.append("name_menu", updatedName);
    formData.append("price", form.price);
    formData.append("category", form.category);
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/menus/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 409 &&
          errorData.message &&
          errorData.message.includes("Nama menu sudah ada")
        ) {
          alert("Nama menu ini sudah ada. Silakan gunakan nama lain.");
          setAuthError("Nama menu ini sudah ada. Silakan gunakan nama lain.");
        } else {
          alert(errorData.message || "Gagal memperbarui menu.");
          await handleAuthenticationError(response);
        }
        return;
      }

      alert("Menu berhasil diperbarui");
      navigate("/menus");
    } catch (error) {
      console.error("Error saat mengupdate menu:", error);
      setAuthError("Terjadi kesalahan saat mengupdate menu: " + error.message);
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
            Edit Menu
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
            className="bg-white border rounded shadow-md flex flex-col lg:flex-row w-full h-auto min-h-[60vh] lg:h-[700px] gap-4 md:gap-12 relative"
            encType="multipart/form-data"
          >
            <div className="flex-1 flex flex-col space-y-4 justify-start p-4 md:p-8">
              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Nama Menu
                </label>
                <input
                  name="name_menu"
                  type="text"
                  placeholder="Masukkan nama menu"
                  value={form.name_menu}
                  onChange={handleChange}
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Harga
                </label>
                <input
                  name="price"
                  type="number"
                  placeholder="Masukkan harga menu"
                  value={form.price}
                  onChange={handleChange}
                  className="px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="appearance-none w-full px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                    required
                  >
                    <option disabled value="">
                      Pilih Kategori
                    </option>
                    <option value="Pure Coffee">Pure Coffee</option>
                    <option value="White">White</option>
                    <option value="Milky">Milky</option>
                    <option value="Signature">Signature</option>
                    <option value="Mocktail">Mocktail</option>
                    <option value="Easy To Drink">Easy To Drink</option>
                    <option value="Pastry">Pastry</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                    <FaChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {isDrinkCategory && (
                <div className="flex flex-col">
                  <label className="text-sm md:text-lg font-bold mb-1">
                    Tipe Minuman
                  </label>
                  <div className="relative">
                    <select
                      name="drinkType"
                      value={drinkType}
                      onChange={(e) => setDrinkType(e.target.value)}
                      className="appearance-none w-full px-4 py-2 md:py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                    >
                      <option value="Default">Default</option>
                      <option value="Iced">Iced</option>
                      <option value="Hot">Hot</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                      <FaChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-sm md:text-lg font-bold mb-1">
                  Upload Gambar
                </label>
                <label className="w-full px-4 py-2 md:py-4 border rounded cursor-pointer text-gray-600 focus-within:ring-2 focus-within:ring-yellow-500 text-sm md:text-base">
                  <span>
                    {form.image
                      ? form.image.name
                      : oldImage
                      ? "Ganti gambar..."
                      : "Pilih gambar..."}
                  </span>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
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
                    <FontAwesomeIcon icon={faSave} className="text-lg" />
                  )}
                  {submitLoading ? "Mengupdate..." : "Update Menu"}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview Gambar Baru"
                  className="object-contain w-full h-auto max-h-full rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = { signImage };
                  }}
                />
              ) : oldImage ? (
                <div className="relative w-full h-full min-h-[150px] flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                  <div className="absolute z-10 text-center w-full text-gray-600 font-semibold bg-white/80 px-4 py-4">
                    Gambar lama, upload untuk mengubah
                  </div>
                  <img
                    src={oldImage}
                    alt="Gambar Lama"
                    className="object-cover w-full h-full opacity-70"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = { signImage };
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[150px] flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                  <div className="absolute z-10 text-center w-full text-gray-600 font-semibold bg-white/80 px-4 py-4">
                    Tidak ada gambar untuk ditampilkan
                  </div>
                  <img
                    src={signImage}
                    alt="Placeholder"
                    className="object-cover w-full h-full opacity-70"
                  />
                </div>
              )}
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

export default EditMenusPage;
