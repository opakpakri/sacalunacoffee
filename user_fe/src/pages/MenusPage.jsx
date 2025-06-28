import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowRight,
  faUtensils, // For Pastry, Main Course, Snacks
  faCoffee, // For all other drink categories
  faSpinner, // Tambahkan spinner untuk loading
  faTimesCircle, // Tambahkan untuk error
} from "@fortawesome/free-solid-svg-icons";

function MenusPage({ addToCart, searchTerm }) {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showQrisReminderButton, setShowQrisReminderButton] = useState(false);
  const navigate = useNavigate();
  const { tableNumber, token } = useParams();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch(
          "https://sacalunacoffee-production.up.railway.app/api/menus"
        );
        if (!res.ok) {
          // Log error respons dari server
          const errorText = await res.text(); // Ambil teks respons untuk debugging
          console.error(`Server error: ${res.status} - ${errorText}`);
          throw new Error("Gagal mengambil data menu dari server.");
        }
        const data = await res.json();
        // Pastikan data.data adalah array yang valid
        if (data && Array.isArray(data.data)) {
          setMenus(data.data);
          const uniqueCategories = [
            ...new Set(data.data.map((menu) => menu.category_menu)),
          ];
          setCategories(uniqueCategories);
          setHasError(false);
        } else {
          // Jika struktur data tidak sesuai
          console.error("Struktur data menu tidak valid:", data);
          throw new Error("Struktur data menu tidak valid.");
        }
      } catch (error) {
        console.error(
          "Gagal mengambil data menu (kesalahan jaringan/lainnya):",
          error
        );
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // Effect to check for the QRIS payment reminder
  useEffect(() => {
    const reminderFlag = sessionStorage.getItem("showPaymentReminder");
    const reminderToken = sessionStorage.getItem("paymentReminderToken");

    if (reminderFlag === "true" && reminderToken === token) {
      setShowQrisReminderButton(true);
    } else {
      setShowQrisReminderButton(false);
    }
  }, [token]);

  // Helper to determine menu type for badges (Iced/Hot)
  const getMenuTypeBadge = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("iced")) {
      return { text: "Iced", color: "bg-blue-500 text-white" };
    }
    if (lowerName.includes("hot")) {
      return { text: "Hot", color: "bg-red-500 text-white" };
    }
    return null;
  };

  // Helper to format currency
  const formatPrice = (price) => `Rp ${price.toLocaleString("id-ID")}`;

  // Helper to determine category icon
  const getCategoryIcon = (categoryName) => {
    const lowerCategoryName = categoryName.toLowerCase();
    if (
      lowerCategoryName.includes("pastry") ||
      lowerCategoryName.includes("main course") ||
      lowerCategoryName.includes("snacks")
    ) {
      return faUtensils;
    }
    return faCoffee;
  };

  const filteredMenus = menus.filter((menu) =>
    menu.name_menu.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = [
    ...new Set(filteredMenus.map((menu) => menu.category_menu)),
  ];

  const noResults = searchTerm.trim() !== "" && filteredMenus.length === 0;

  // Handling render based on loading, error, and no results
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-4xl text-yellow-500 mb-4"
        />
        <p className="ml-4 text-xl text-gray-700">Memuat menu...</p>
      </div>
    );

  if (hasError)
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-red-50 flex-col">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="text-5xl text-red-600 mb-4"
          />
          <p className="text-red-600 font-bold text-xl mb-4">
            Terjadi Kesalahan!
          </p>
          <p className="text-gray-700 text-lg">
            Gagal memuat daftar menu. Silakan coba lagi nanti.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );

  return (
    <div className="menupage pb-10 bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex justify-end gap-4 mb-8 items-center">
          {showQrisReminderButton && (
            <div
              onClick={() =>
                navigate(
                  `/table/${tableNumber}/${token}/complete-payment?method=online_payment&table=${tableNumber}&token=${token}`,
                  { state: { fromCheckout: true } }
                )
              }
              className="flex items-center gap-3 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-full shadow-lg
                          hover:bg-yellow-600 transform hover:scale-105 transition-all duration-300 cursor-pointer animate-pulse-fade"
            >
              <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
              <span className="whitespace-nowrap">
                Lanjutkan Pembayaran Anda
              </span>
            </div>
          )}
        </div>

        {noResults ? (
          <div className="text-center text-gray-600 text-xl py-20">
            <FontAwesomeIcon
              icon={faUtensils}
              className="text-4xl mb-4 text-gray-400"
            />
            <p>Maaf, menu "{searchTerm}" tidak ditemukan.</p>
            <p className="text-base mt-2">
              Coba kata kunci lain atau jelajahi kategori.
            </p>
          </div>
        ) : (
          (searchTerm ? filteredCategories : categories).map((category) => (
            <section key={category} id={category} className="mb-12">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-yellow-500 pb-2 inline-block">
                <FontAwesomeIcon
                  icon={getCategoryIcon(category)}
                  className="mr-3 text-yellow-600"
                />
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {(searchTerm ? filteredMenus : menus)
                  .filter((menu) => menu.category_menu === category)
                  .map((menu) => {
                    const badge = getMenuTypeBadge(menu.name_menu);
                    return (
                      <div
                        key={menu.id_menu}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 duration-300 ease-in-out overflow-hidden cursor-pointer group flex flex-col"
                      >
                        <div className="relative h-60 w-full overflow-hidden rounded-t-xl">
                          {badge && (
                            <span
                              className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold z-10 ${badge.color}`}
                            >
                              {badge.text}
                            </span>
                          )}
                          <img
                            src={menu.image_menu} // <<< UBAH DI SINI: Langsung pakai URL Cloudinary
                            alt={menu.name_menu}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/240x240/cccccc/000000?text=Error";
                            }} // Fallback image
                          />
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="text-xl font-bold text-gray-900 h-8 overflow-hidden leading-tight">
                            {menu.name_menu}
                          </h3>

                          <div className="flex justify-between items-center mt-auto">
                            <span className="text-2xl font-bold text-yellow-600">
                              {formatPrice(menu.price)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (showQrisReminderButton) {
                                  alert(
                                    "Harap Selesaikan Pembayaran Sebelumnya!"
                                  );
                                } else {
                                  addToCart(menu);
                                }
                              }}
                              className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-md
                                         hover:bg-yellow-600 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-700"
                              title={
                                showQrisReminderButton
                                  ? "Ada pembayaran tertunda"
                                  : "Tambahkan ke Keranjang"
                              }
                              aria-label={`Tambahkan ${menu.name_menu} ke keranjang`}
                            >
                              <FontAwesomeIcon
                                icon={faPlus}
                                className="text-lg"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export default MenusPage;
