import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoImage from "../assets/images/logocompany.jpeg";
// Import ikon FontAwesome yang dibutuhkan
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons"; // Mengimpor faBars untuk hamburger, faXmark untuk close

// Define menu items outside the component for consistency
const menuItems = ["Home", "Menu", "Blog", "Contact"];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("Home");
  // State untuk mengontrol apakah menu mobile (drawer) terbuka
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBlogPage = location.pathname.startsWith("/blog");

  const handleMenuClick = (item) => {
    // Logika handleMenuClick tetap sama
    if (isBlogPage && item !== "Blog") {
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById(item);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const section = document.getElementById(item);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
    // Tutup menu mobile setelah item diklik
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (isBlogPage) {
      setActiveSection("Blog");
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let item of menuItems) {
        const section = document.getElementById(item);
        if (section) {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            setActiveSection(item);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, isBlogPage]);

  // Efek baru untuk menutup drawer saat menggulir halaman
  useEffect(() => {
    let scrollTimeout; // Untuk debounce scroll event

    const handleScrollToClose = () => {
      // Membersihkan timeout sebelumnya jika ada guliran cepat
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      // Set timeout baru untuk menutup setelah jeda singkat
      scrollTimeout = setTimeout(() => {
        if (isMobileMenuOpen) {
          // Pastikan drawer masih terbuka
          setIsMobileMenuOpen(false);
        }
      }, 150); // Jeda 150ms untuk membedakan dari guliran yang sangat kecil/tidak sengaja
    };

    if (isMobileMenuOpen) {
      // Tambahkan event listener hanya saat drawer terbuka
      window.addEventListener("scroll", handleScrollToClose);
    }

    // Fungsi cleanup: hapus event listener saat drawer tertutup atau komponen unmount
    return () => {
      window.removeEventListener("scroll", handleScrollToClose);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="navbar w-full bg-black sticky top-0 z-20 border-b border-white shadow-xl transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-6">
        {/* Logo dan Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer transform transition-transform duration-300"
          onClick={() => handleMenuClick("Home")}
        >
          <img
            src={LogoImage}
            alt="Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full shadow-lg"
          />
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide">
            Sacaluna Coffee
          </h1>
        </div>

        {/* Hamburger Menu Button (visible on small screens only) */}
        <button
          className="md:hidden text-white focus:outline-none z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} // Toggle untuk membuka/menutup
          aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
        >
          {/* Menggunakan ikon FontAwesome untuk hamburger */}
          <FontAwesomeIcon icon={faBars} className="w-8 h-8" />
        </button>

        {/* Desktop Menu Items (hidden on small screens, visible on medium and larger) */}
        <div className="hidden md:flex gap-4 lg:gap-8">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleMenuClick(item)}
              className={`
                text-base md:text-lg px-3 py-2 md:px-4 rounded-lg
                transition-all duration-300 ease-in-out
                ${
                  activeSection === item
                    ? " text-yellow-500 shadow-md transform scale-105 font-bold"
                    : "text-white hover:text-yellow-500 hover:shadow-md font-medium"
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Drawer (muncul dari kanan, SETENGAH TINGGI, LEBAR LEBIH KECIL, DI BAWAH NAVBAR) */}
      <div
        className={`fixed top-20 right-0 w-64 sm:w-72 h-1/2 md:hidden bg-black shadow-lg z-40
          transform transition-transform duration-300 ease-in-out rounded-bl-lg
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close button inside mobile menu, positioned at top-LEFT of the drawer */}
        <button
          className="absolute top-4 left-4 text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Tutup menu"
        >
          {/* Menggunakan ikon FontAwesome untuk 'X' */}
          <FontAwesomeIcon icon={faXmark} className="w-8 h-8" />
        </button>

        <div className="flex flex-col items-center justify-center h-full space-y-4 py-4">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleMenuClick(item)}
              className={`
                text-xl py-2 px-4 rounded-lg w-fit
                transition-all duration-300 ease-in-out
                ${
                  activeSection === item
                    ? " text-yellow-500 shadow-md transform scale-105 font-bold"
                    : "text-white hover:text-yellow-500 hover:shadow-md font-medium"
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay telah dihapus. */}
    </div>
  );
}

export default Navbar;
