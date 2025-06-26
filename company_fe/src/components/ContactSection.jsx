import React from "react";
import BgImage from "../assets/Images/bgImage.jpg";
import {
  faInstagram,
  faTiktok,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ContactSection = () => {
  return (
    <div
      id="Contact"
      className="relative text-white py-24 px-8 md:px-24 bg-cover bg-center overflow-hidden" // Added overflow-hidden
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <div className="absolute inset-0 "></div>{" "}
      <div className="max-w-6xl mx-auto relative z-10">
        {" "}
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 animate-fade-in-up text-center">
          Kontak Kami
        </h2>{" "}
        <p className="text-lg md:text-lg mb-12 animate-fade-in-up delay-100 text-center">
          Mari berkenalan dengan kami Sacaluna Coffee
        </p>
        <div className="flex flex-col md:flex-row items-stretch gap-16 text-left">
          {" "}
          <div className="flex-1 bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20 animate-fade-in-left">
            {" "}
            <div className="mb-8 border-b border-white/30 pb-4">
              {" "}
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                WORKING HOURS
              </h3>{" "}
              <p className="text-base md:text-lg">Senin - Minggu</p>
              <p className="text-base md:text-lg">16:00 - 00:30 WIB</p>
            </div>
            <div className="mb-8 border-b border-white/30 pb-4">
              <h3 className="text-xl md:text-2xl font-bold mb-2">ADDRESS</h3>
              <p className="text-base md:text-lg">
                Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,
                Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
              </p>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4">FIND US</h3>{" "}
              <div className="flex flex-col gap-4 max-w-sm">
                {" "}
                <a
                  href="https://www.instagram.com/sacalunacoffee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-white hover:text-yellow-300 transition duration-300 ease-in-out group" // Added group for hover effect
                >
                  <FontAwesomeIcon
                    icon={faInstagram}
                    className="w-6 h-6 group-hover:scale-110 transition-transform"
                  />{" "}
                  <span className="text-lg group-hover:underline">
                    @sacalunacoffee
                  </span>{" "}
                </a>
                <a
                  href="https://www.tiktok.com/@sacalunacoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-white hover:text-yellow-300 transition duration-300 ease-in-out group"
                >
                  <FontAwesomeIcon
                    icon={faTiktok}
                    className="w-6 h-6 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-lg group-hover:underline">
                    @sacalunacoffee
                  </span>
                </a>
                <a
                  href="https://wa.me/6281212926360"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-white hover:text-yellow-300 transition duration-300 ease-in-out group"
                >
                  <FontAwesomeIcon
                    icon={faWhatsapp}
                    className="w-6 h-6 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-lg group-hover:underline">
                    0821212926360
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center animate-fade-in-right">
            {" "}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.471126007544!2d110.39889529999999!3d-7.7397471!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a597b663d6e8f%3A0x268f7c3cf6aad7d7!2sSacaluna%20Coffee!5e0!3m2!1sid!2sid!4v1750953053974!5m2!1sid!2sid"
              width="100%"
              height="100%"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map Sacaluna Coffee"
              className="rounded-xl shadow-2xl border-2 border-yellow-500"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
