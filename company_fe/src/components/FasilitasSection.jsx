import React from "react";
import Fasilitas1 from "../assets/images/fasilitas1.webp";
import Fasilitas2 from "../assets/images/fasilitas2.webp";
import Fasilitas3 from "../assets/images/fasilitas3.webp";
// import LogoSmall from "../assets/images/logocompany.jpeg";

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
      {/* Added a light background */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
        Fasilitas Kami
      </h2>
      <p className="text-lg md:text-lg text-gray-700 mb-12 max-w-4xl mx-auto">
        Keluarkan semua bakatmu dan rasakan pengalaman unik di Sacaluna Coffee.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto pb-12">
        {" "}
        {/* Responsive grid, increased gap */}
        {fasilitasData.map(({ img, title, desc }, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 group"
          >
            <div className="w-full h-[250px] md:h-[280px] overflow-hidden">
              {" "}
              {/* Consistent image height */}
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            <div className="p-6 text-center">
              {" "}
              {/* Increased padding */}
              <h3 className="font-bold text-xl mb-3 text-gray-900">
                {title}
              </h3>{" "}
              {/* Bolder title */}
              <p className="text-gray-700 leading-relaxed">{desc}</p>{" "}
              {/* Better readability */}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-gray-600">
        {" "}
        {/* Subtle branding */}
        {/* <img
          src={LogoSmall}
          alt="Logo Sacaluna Coffee"
          className="w-7 h-7"
        />{" "} */}
        {/* Slightly larger logo */}
        <span className="text-sm font-medium">Sacaluna Coffee</span>
      </div>
    </div>
  );
};

export default FasilitasSection;
