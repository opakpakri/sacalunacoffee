import React from "react";
import BgImage from "../assets/images/bgImage.webp";
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
      className="text-white py-24 px-24 text-center bg-cover bg-center"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">Kontak Kami</h2>
        <p className="text-lg mb-12">
          Mari berkenalan dengan kami Sacaluna Coffee
        </p>

        <div className="flex flex-col md:flex-row gap-16 text-left">
          <div className="flex-1">
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-1">WORKING HOURS</h3>
              <p>
                Senin - Minggu &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 16:00 - 00:30 WIB
              </p>
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-1">ADDRESS</h3>
              <p>
                Jl. Sidomulyo No.10a, Manukan, Condongcatur, Kec. Depok,
                Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">FIND US</h3>
              <div className="flex flex-col gap-1 max-w-sm">
                <a
                  href="https://www.instagram.com/sacalunacoffee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:underline"
                >
                  <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
                  <span>@sacalunacoffee</span>
                </a>
                <a
                  href="https://www.tiktok.com/@sacalunacoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:underline"
                >
                  <FontAwesomeIcon icon={faTiktok} className="w-5 h-5" />
                  <span>@sacalunacoffee</span>
                </a>
                <a
                  href="https://wa.me/6281212926360"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:underline"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                  <span>0821212926360</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex-1 text-center">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1175.373869891529!2d110.39852453713507!3d-7.739793048477617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a597b663d6e8f%3A0x268f7c3cf6aad7d7!2sSacaluna%20Coffee!5e0!3m2!1sid!2sid!4v1747869980518!5m2!1sid!2sid"
              width="100%"
              height="400"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map Sacaluna Coffee"
              className="rounded-md shadow-md"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
