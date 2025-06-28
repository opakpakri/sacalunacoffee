import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FaChevronDown } from "react-icons/fa"; // Pastikan FaChevronDown diimpor
import oldImage from "../../assets/images/signImage.webp"; // Menggunakan ini sebagai placeholder

function AddMenusPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name_menu: "",
    price: "",
    category: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [drinkType, setDrinkType] = useState(""); // Default kosong, bukan "Default"
  const isFoodCategory = ["Pastry", "Main Course", "Snacks"].includes(
    form.category
  ); // Definisikan di sini agar bisa digunakan di JSX
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
        "Detail Error Autentikasi (AddMenusPage):",
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
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });
      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      } else {
        setPreviewImage(null);
      }
    } else {
      // Reset drinkType jika kategori berubah menjadi kategori makanan
      if (name === "category" && isFoodCategory) {
        setDrinkType(""); // Reset drinkType saat beralih ke kategori makanan
      }
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitLoading(true);

    if (!form.image) {
      alert("Silakan unggah gambar terlebih dahulu.");
      setSubmitLoading(false);
      return;
    }

    let finalName = form.name_menu;
    // Hanya tambahkan prefix "Iced" atau "Hot" jika kategori adalah minuman DAN drinkType bukan kosong/Default
    if (!isFoodCategory && drinkType !== "" && drinkType !== "Default") {
      finalName = `${drinkType} ${finalName}`;
    }

    const formData = new FormData();
    formData.append("name_menu", finalName);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("image", form.image);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/menus",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Menambahkan penanganan error spesifik dari backend (contoh: nama menu sudah ada)
        if (
          response.status === 409 &&
          errorData.message &&
          errorData.message.includes("Nama menu sudah ada")
        ) {
          alert("Nama menu ini sudah ada. Silakan gunakan nama lain.");
          setAuthError("Nama menu ini sudah ada. Silakan gunakan nama lain.");
        } else {
          alert(errorData.message || "Gagal menambahkan menu.");
          await handleAuthenticationError(response);
        }
        return;
      }

      alert("Menu berhasil ditambahkan");
      navigate("/menus");
    } catch (error) {
      console.error("Error saat menambahkan menu:", error);
      setAuthError("Terjadi kesalahan saat menambahkan menu: " + error.message);
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
          <h1 className="text-2xl font-bold mb-8">Add New Menu</h1>

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
            className="bg-white border rounded shadow-md flex w-full h-[700px] gap-12 relative"
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

              {/* Tampilkan Tipe Minuman hanya jika BUKAN kategori makanan DAN kategori sudah dipilih */}
              {!isFoodCategory && form.category && (
                <div className="flex flex-col">
                  <label className="text-lg font-bold mb-1">Tipe Minuman</label>
                  <div className="relative">
                    <select
                      name="drinkType" // Ubah nama dari "drink_type" ke "drinkType" agar konsisten dengan state
                      value={drinkType}
                      onChange={(e) => setDrinkType(e.target.value)}
                      className="appearance-none w-full px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Default</option>{" "}
                      {/* Ubah "Default" menjadi kosong */}
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
                      icon={faCirclePlus}
                      className="group-hover:text-black text-lg"
                    />
                  )}
                  {submitLoading ? "Menambahkan..." : "Add Menu"}{" "}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="object-cover w-full h-full rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/400x300/cccccc/000000?text=Error";
                  }}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute z-10 text-center w-full text-gray-600 font-semibold bg-white/80 px-4 py-4">
                    Gambar preview akan muncul di sini setelah upload
                  </div>

                  <img
                    src={oldImage} // Menggunakan oldImage sebagai placeholder lokal
                    alt="Placeholder"
                    className="object-cover w-full h-full rounded opacity-70"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/400x300/cccccc/000000?text=Error";
                    }}
                  />
                </div>
              )}
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

export default AddMenusPage;
