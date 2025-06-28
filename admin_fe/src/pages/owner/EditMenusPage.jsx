import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faSave } from "@fortawesome/free-solid-svg-icons";
import { FaChevronDown } from "react-icons/fa"; // Pastikan FaChevronDown diimpor

function EditMenusPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name_menu: "",
    price: "",
    category: "",
    image: null, // File objek untuk upload baru
  });
  const [previewImage, setPreviewImage] = useState(null); // URL untuk preview gambar baru (lokal)
  const [oldImage, setOldImage] = useState(null); // URL gambar lama dari database (Cloudinary URL)
  const [drinkType, setDrinkType] = useState(""); // Default kosong, bukan "Default"
  const isDrinkCategory = !["Pastry", "Main Course", "Snacks"].includes(
    form.category
  ); // Definisikan di sini
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

      const data = await response.json(); // Backend sudah mengirim objek menu langsung

      const category = data.category_menu || "";
      const name = data.name_menu || "";
      let detectedDrinkType = "";

      // Logika untuk mendeteksi tipe minuman dari nama menu
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
        image: null, // Reset file input saat fetch
      });

      setDrinkType(detectedDrinkType);
      // Langsung gunakan URL dari database karena sudah URL Cloudinary penuh
      setOldImage(data.image_menu); // Ini akan menjadi URL Cloudinary lengkap
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
        setPreviewImage(URL.createObjectURL(file)); // Buat URL lokal untuk preview gambar baru
      } else {
        setPreviewImage(null); // Hapus preview jika file dibatalkan
      }
      setOldImage(null); // Hapus gambar lama dari tampilan preview jika ada gambar baru
    } else {
      // Reset drinkType jika kategori berubah menjadi kategori makanan
      if (name === "category" && !isDrinkCategory) {
        // Periksa !isDrinkCategory karena isDrinkCategory adalah kebalikan isFoodCategory
        setDrinkType(""); // Reset drinkType saat beralih ke kategori makanan
      }
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitLoading(true);

    let updatedName = form.name_menu;
    // Hanya tambahkan prefix "Iced" atau "Hot" jika kategori adalah minuman DAN drinkType bukan kosong/Default
    if (isDrinkCategory && drinkType !== "" && drinkType !== "Default") {
      updatedName = `${drinkType} ${form.name_menu}`;
    }

    const formData = new FormData();
    formData.append("name_menu", updatedName);
    formData.append("price", form.price);
    formData.append("category", form.category);
    if (form.image) {
      formData.append("image", form.image); // Hanya tambahkan gambar jika ada yang baru dipilih
    }
    // Jika tidak ada gambar baru, backend akan mempertahankan gambar lama karena newImageUrl akan null

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
        // Menangani error spesifik dari backend (contoh: nama menu sudah ada)
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
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16 bg-white">
          <h1 className="text-2xl font-bold mb-8">Edit Menu</h1>

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
            encType="multipart/form-data"
          >
            <div className="flex-1 p-12 space-y-4 relative">
              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Nama Menu</label>
                <input
                  name="name_menu"
                  type="text"
                  placeholder="Masukkan nama menu"
                  value={form.name_menu}
                  onChange={handleChange}
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Harga</label>
                <input
                  name="price"
                  type="number"
                  placeholder="Masukkan harga menu"
                  value={form.price}
                  onChange={handleChange}
                  className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-lg font-bold mb-1">Kategori</label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="appearance-none w-full px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

              {isDrinkCategory && ( // Tampilkan hanya jika ini kategori minuman
                <div className="flex flex-col">
                  <label className="text-lg font-bold mb-1">Tipe Minuman</label>
                  <div className="relative">
                    <select
                      name="drinkType"
                      value={drinkType}
                      onChange={(e) => setDrinkType(e.target.value)}
                      className="appearance-none w-full px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Default</option>
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
                <label className="text-lg font-bold mb-1">Upload Gambar</label>
                <label className="w-full px-4 py-4 border rounded cursor-pointer text-gray-600 focus-within:ring-2 focus-within:ring-yellow-500">
                  <span>
                    {form.image ? form.image.name : "Pilih gambar..."}
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
                  {submitLoading ? "Mengupdate..." : "Update Menu"}{" "}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              {previewImage ? ( // Tampilkan preview gambar baru jika ada
                <img
                  src={previewImage}
                  alt="Preview Gambar Baru"
                  className="object-cover w-full h-full rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/400x300/cccccc/000000?text=Error";
                  }}
                />
              ) : oldImage ? ( // Tampilkan gambar lama jika tidak ada preview gambar baru
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute z-10 text-center w-full text-gray-600 font-semibold bg-white/80 px-4 py-4">
                    Gambar lama, upload untuk mengubah menjadi gambar baru
                  </div>
                  <img
                    src={oldImage} // Langsung menggunakan URL Cloudinary dari state
                    alt="Gambar Lama"
                    className="object-cover w-full h-full rounded opacity-70"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/400x300/cccccc/000000?text=Error";
                    }}
                  />
                </div>
              ) : (
                // Jika tidak ada gambar baru dan tidak ada gambar lama
                <div className="text-gray-600 font-semibold">
                  Tidak ada gambar untuk ditampilkan
                  <img
                    src="https://placehold.co/400x300/cccccc/000000?text=No+Image" // Placeholder jika tidak ada gambar
                    alt="Placeholder"
                    className="object-cover w-full h-full rounded opacity-70 mt-4"
                  />
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
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

export default EditMenusPage;
