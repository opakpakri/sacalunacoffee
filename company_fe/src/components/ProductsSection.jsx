import React from "react";
import BgCoffee from "../assets/images/bgCoffee.jpg";
import LogoSmall from "../assets/images/logocompany.jpg";
import Menu1 from "../assets/images/menu1.jpg";
import Menu2 from "../assets/images/menu2.jpg";
import Menu3 from "../assets/images/menu3.jpg";
import Menu4 from "../assets/images/menu4.jpg";
import Menu5 from "../assets/images/menu5.jpg";
import Menu6 from "../assets/images/menu6.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {
  Autoplay,
  EffectCoverflow,
  Pagination,
  Navigation,
} from "swiper/modules";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
const products = [
  { id: 1, name: "Nosegrind", img: Menu1 },
  { id: 2, name: "Jag Hammer", img: Menu2 },
  { id: 3, name: "Halfcab", img: Menu3 },
  { id: 4, name: "Single Origin", img: Menu4 },
  { id: 5, name: "SCLN Fried Rice", img: Menu5 },
  { id: 6, name: "Chick Pop", img: Menu6 },
];

const ProductsSection = () => {
  return (
    <div
      id="Menu"
      className="relative text-white py-16 px-8 md:px-16 text-center bg-cover bg-center"
      style={{ backgroundImage: `url(${BgCoffee})` }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>{" "}
      <div className="relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-lg">
          Try Our Signature
        </h2>
        <p className="text-lg md:text-lg mb-12 max-w-4xl mx-auto drop-shadow-md">
          Rasakan keseruan dan cita rasa istimewa dari menu-menu pilihan di
          Sacaluna Coffee.
        </p>

        <Swiper
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 30 },
            1024: { slidesPerView: 4, spaceBetween: 40 },
          }}
          loop={true}
          centeredSlides={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          effect={"coverflow"}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={{ clickable: true }}
          navigation={false}
          modules={[Autoplay, EffectCoverflow, Pagination, Navigation]}
          className="mySwiper py-12"
        >
          {products.map(({ id, name, img }) => (
            <SwiperSlide key={id} className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 group mb-18">
                {" "}
                <img
                  src={img}
                  alt={name}
                  className="w-full h-60 object-cover transition-transform duration-300 "
                  loading="lazy"
                />
                <div className="p-4 bg-black text-white text-center">
                  {" "}
                  <h3 className="font-bold text-xl mb-1 leading-tight">
                    {name}
                  </h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="absolute bottom-6 left-6 flex items-center gap-2 z-10 text-white">
        {" "}
        <img src={LogoSmall} alt="Logo Sacaluna Coffee" className="w-7 h-7" />
        <span className="text-sm font-medium">Sacaluna Coffee</span>
      </div>
    </div>
  );
};

export default ProductsSection;
