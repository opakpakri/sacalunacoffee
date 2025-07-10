import React, { useEffect, useState } from "react";
import LogoImage from "../assets/images/logo.webp";
import { FaBars, FaTimes } from "react-icons/fa";

function Navbar({ toggleSidebar, isSidebarOpen }) {
  const [userData, setUserData] = useState({ username: "", role: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const { name_user, role } = user;
      setUserData({ username: name_user, role });
    }
  }, []);

  return (
    <div className="w-full text-white bg-black shadow-md">
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:py-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleSidebar}
            className="text-white text-xl p-2 focus:outline-none md:hidden"
            aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <img
            src={LogoImage}
            alt="Logo Sacaluna Coffee"
            className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full"
          />
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">
            Sacaluna Coffee
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-sm md:text-lg font-bold pr-0 md:pr-4 lg:pr-24">
          <h2 className="hidden sm:block">{userData.role}</h2>{" "}
          <h2 className="hidden sm:block">|</h2> <h2>{userData.username}</h2>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
