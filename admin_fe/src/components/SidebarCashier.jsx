import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaSpinner } from "react-icons/fa";
import { MdQrCode } from "react-icons/md";

function SidebarCashier({ isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        toggleSidebar();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (isSidebarOpen) {
          toggleSidebar();
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen, toggleSidebar]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    if (isSidebarOpen && window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const confirmLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    setTimeout(() => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      setIsLoggingOut(false);
      navigate("/");
    }, 500);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    { label: "Transaction", icon: <FaUser />, path: "/transactionsCashier" },
    { label: "BarCode", icon: <MdQrCode />, path: "/barcodeCashier" },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 bg-gray-200 z-50 w-64 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex md:flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
      >
        <div className="flex flex-col flex-grow py-4 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={`flex items-center gap-3 pl-8 p-4 text-left w-full text-base
                ${
                  location.pathname.startsWith(item.path)
                    ? "bg-white font-bold"
                    : "hover:bg-gray-300"
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="pb-6">
          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 pl-8 p-4 font-semibold w-full text-red-600 text-base
              ${
                isLoggingOut
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-gray-300"
              }`}
          >
            {isLoggingOut ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSignOutAlt />
            )}
            <span>{isLoggingOut ? "Logging Out..." : "Logout"}</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
            <p className="text-base sm:text-lg font-semibold mb-4">
              Apakah Anda yakin ingin logout?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                {isLoggingOut ? <FaSpinner className="animate-spin" /> : "Ya"}
              </button>
              <button
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors text-sm sm:text-base"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SidebarCashier;
