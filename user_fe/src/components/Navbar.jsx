import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faSearch,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import LogoImage from "../assets/images/logo.webp";

function Navbar({
  categories,
  toggleCart,
  searchTerm,
  setSearchTerm,
  onCategoryClick,
  cartItemCount, // NEW: Terima prop cartItemCount
}) {
  const [activeCategory, setActiveCategory] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      let currentCategory = "";
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      categories.forEach((category) => {
        const section = document.getElementById(category);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentCategory = category;
          }
        }
      });
      setActiveCategory(currentCategory);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    onCategoryClick(category);
    const section = document.getElementById(category);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - (isScrolled ? 70 : 80),
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    let scrollTimeout;

    const handleScrollToCloseModal = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        if (isSearchModalOpen) {
          setIsSearchModalOpen(false);
        }
      }, 150);
    };

    if (isSearchModalOpen) {
      window.addEventListener("scroll", handleScrollToCloseModal);
    }

    return () => {
      window.removeEventListener("scroll", handleScrollToCloseModal);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isSearchModalOpen]);

  return (
    <div
      className={`navbar w-full sticky top-0 z-20 transition-all duration-300 ${
        isScrolled ? "bg-black shadow-xl" : "bg-black"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4 sm:px-6 md:px-8">
        {/* Kiri: Logo & Nama Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
          <img
            src={LogoImage}
            alt="Sacaluna Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full shadow-md"
          />
          <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            Sacaluna Coffee
          </h1>
        </div>

        {/* Kanan: Search (Mobile/Desktop) + Cart */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
          {/* ----- Search Bar untuk Desktop (Selalu Terlihat) ----- */}
          <div className="hidden md:flex relative items-center">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 text-gray-400 text-lg"
            />
            <input
              type="text"
              placeholder="Cari menu favoritmu..."
              className="pl-10 pr-4 py-2 w-72 bg-white rounded-full text-base shadow-sm
                          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* ----- Tombol Search untuk Mobile (Membuka Modal) ----- */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Buka search menu"
          >
            <FontAwesomeIcon icon={faSearch} className="w-6 h-6" />
          </button>

          {/* Cart Icon dengan Badge Jumlah */}
          <button
            className="text-white relative p-2 rounded-full hover:bg-yellow-500 hover:text-black transition-colors duration-200 group"
            onClick={toggleCart}
            aria-label="Lihat Keranjang Belanja"
          >
            <FontAwesomeIcon
              icon={faCartShopping}
              className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200"
            />
            {/* NEW: Badge untuk jumlah item */}
            {cartItemCount > 0 && (
              <span
                className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full group-hover:scale-110 transition-transform duration-200"
                aria-label={`${cartItemCount} item di keranjang`}
              >
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Kategori Navigasi Bawah */}
      <div className="bg-gray-100 border-t border-b border-gray-200 shadow-inner">
        <div className="container mx-auto flex gap-4 sm:gap-6 md:gap-8 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`
                px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300
                ${
                  activeCategory === category
                    ? "bg-gray-300 text-gray-800 shadow-md scale-105"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }
              `}
              aria-current={activeCategory === category ? "page" : undefined}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {isSearchModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center p-4 bg-transparent
                      transform transition-transform duration-300 ease-in-out
                      ${
                        isSearchModalOpen
                          ? "translate-x-0"
                          : "-translate-x-full"
                      }
                      md:hidden`}
        >
          <div className="relative w-full max-w-lg p-6 bg-black rounded-lg shadow-2xl mt-16">
            <button
              className="absolute top-3 right-3 text-white text-2xl focus:outline-none"
              onClick={() => setIsSearchModalOpen(false)}
              aria-label="Tutup search"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <h2 className="text-white text-xl font-bold mb-4 text-center">
              Cari Menu Favoritmu
            </h2>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Ketik nama menu di sini..."
                className="w-full pl-10 pr-4 py-3 rounded-full text-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;
