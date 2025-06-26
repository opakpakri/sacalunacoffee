import React, { useEffect, useState } from "react";
import LogoImage from "../assets/images/logo.webp";

function Navbar() {
  const [userData, setUserData] = useState({ username: "", role: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const { name_user, role } = user;
      setUserData({ username: name_user, role });
    }
  }, []);

  return (
    <div className=" w-full text-white bg-black">
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* Kiri: Logo dan Nama */}
        <div className="flex items-center gap-2">
          <img
            src={LogoImage}
            alt="Logo"
            className="w-10 h-10 object-cover rounded-full"
          />
          <h1 className=" text-2xl font-bold">Sacaluna Coffee</h1>
        </div>

        {/* Kanan: Role | Username (3 div sejajar) */}
        <div className="flex items-center gap-4 text-lg font-bold pr-24">
          <h2>{userData.role}</h2>|<h2>{userData.username}</h2>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
