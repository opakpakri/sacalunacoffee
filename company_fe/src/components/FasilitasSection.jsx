import React from "react";
import Fasilitas1 from "../assets/Images/fasilitas1.jpg";
import Fasilitas2 from "../assets/Images/fasilitas2.jpg";
import Fasilitas3 from "../assets/Images/fasilitas3.jpg";
import LogoSmall from "../assets/Images/logocompany.jpg";

const fasilitasData = [
  {
    img: Fasilitas3,
    title: "Semi-Outdoor",
    desc: "Nongkrong asik bareng teman-temanmu dengan suasana semi-outdoor yang nyaman dan stylish.",
  },
  {
    img: Fasilitas1,
    title: "Bowl Skate",
    desc: "Rasakan adrenalin dan keseruan bermain skate di area Bowl Skate Sacaluna Coffee yang unik.",
  },
  {
    img: Fasilitas2,
    title: "Berbagai Event Seru",
    desc: "Jadikan setiap momen tak terlupakan dengan berbagai event musik, seni, dan komunitas di Sacaluna Coffee.",
  },
];

const FasilitasSection = () => {
  return (
    <div
      id="Fasilitas"
      className="relative py-16 px-8 md:px-16 lg:px-24 text-center bg-gray-50"
    >
      {" "}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
        Fasilitas Kami
      </h2>
      <p className="text-lg md:text-lg text-gray-700 mb-12 max-w-4xl mx-auto">
        Keluarkan semua bakatmu dan rasakan pengalaman unik di Sacaluna Coffee.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto pb-12">
        {" "}
        {fasilitasData.map(({ img, title, desc }, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 group"
          >
            <div className="w-full h-[250px] md:h-[280px] overflow-hidden">
              {" "}
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            <div className="p-6 text-center">
              {" "}
              <h3 className="font-bold text-xl mb-3 text-gray-900">
                {title}
              </h3>{" "}
              <p className="text-gray-700 leading-relaxed">{desc}</p>{" "}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-gray-600">
        {" "}
        <img
          src={LogoSmall}
          alt="Logo Sacaluna Coffee"
          className="w-7 h-7"
        />{" "}
        <span className="text-sm font-medium">Sacaluna Coffee</span>
      </div>
    </div>
  );
};

export default FasilitasSection;
