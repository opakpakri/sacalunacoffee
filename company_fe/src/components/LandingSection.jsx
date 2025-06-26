// components/HomeSections/LandingSection.jsx
import React from "react";
import LandingImage from "../assets/images/landing.jpg";

const LandingSection = () => {
  return (
    <div
      id="Home"
      className="relative w-full h-[650px] bg-cover bg-center flex items-center text-white px-8 md:px-24"
      style={{ backgroundImage: `url(${LandingImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-0"></div>
      <div className="relative max-w-2xl lg:max-w-3xl z-10 p-6 rounded-lg  shadow-2xl transform transition-transform duration-500 hover:scale-105">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight drop-shadow-lg text-shadow-lg">
          SACALUNA COFFEE
        </h1>
        <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed drop-shadow text-shadow-md">
          Tempat bagi Kamu untuk Bersantai dan Menikmati Kreativitas dan
          Inspirasi di Sekitar Kamu. <br />
          Awali Hari Kamu Dengan Rasa Manis di Tempat Kami yang Nyaman!
        </p>
      </div>
    </div>
  );
};

export default LandingSection;
