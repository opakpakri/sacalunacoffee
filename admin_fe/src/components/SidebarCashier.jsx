import React, { useState } from "react"; // Import useState
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaSpinner, // Import FaSpinner for loading animation
} from "react-icons/fa";
import { MdQrCode } from "react-icons/md";

function SidebarCashier() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout loading
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // New state for confirmation dialog

  // Function to initiate logout confirmation
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Function to handle the actual logout after confirmation
  const confirmLogout = () => {
    setIsLoggingOut(true); // Start loading animation
    setShowLogoutConfirm(false); // Hide confirmation dialog
    // Simulate a small delay for demonstration, remove in real application if not needed
    setTimeout(() => {
      localStorage.removeItem("adminToken"); // Assuming cashier token is adminToken
      localStorage.removeItem("user");
      setIsLoggingOut(false); // End loading animation
      navigate("/");
    }, 500); // 500ms delay
  };

  // Function to cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    { label: "Transaction", icon: <FaUser />, path: "/transactionsCashier" },
    { label: "BarCode", icon: <MdQrCode />, path: "/barcodeCashier" },
  ];

  return (
    <div className="w-64 bg-gray-200 flex flex-col justify-between">
      <div className="flex flex-col flex-grow py-4 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 pl-8 p-4 text-left w-full ${
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
          onClick={handleLogoutClick} // Call confirmation handler first
          disabled={isLoggingOut} // Disable button when logging out
          className={`flex items-center gap-3 pl-8 p-4 font-semibold w-full text-red-600 ${
            isLoggingOut ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-300"
          }`}
        >
          {isLoggingOut ? (
            // Show spinner when logging out
            <FaSpinner className="animate-spin" />
          ) : (
            // Show logout icon otherwise
            <FaSignOutAlt />
          )}
          <span>{isLoggingOut ? "Logging Out..." : "Logout"}</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg font-semibold mb-4">
              Apakah Anda yakin ingin logout?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Ya
              </button>
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SidebarCashier;
