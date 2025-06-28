import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoSmall from "../assets/Images/logocompany.jpg"; // Pastikan path benar
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faUserEdit, // Ini di BeritaSection tidak dipakai tapi ada di BlogViewPage
  faSpinner,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const BeritaSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBlogs = async () => {
    try {
      const res = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/blogs"
      );
      // Jika respons tidak OK, lempar error agar ditangkap di catch
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      // Pastikan data.data adalah array sebelum di-sort
      const sortedBlogs = Array.isArray(data.data)
        ? data.data
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 3) // Ambil 3 blog terbaru
        : []; // Jika bukan array, set ke array kosong

      setBlogs(sortedBlogs);
    } catch (error) {
      console.error("Failed to fetch blogs for BeritaSection:", error);
      // Bisa tambahkan state error lain jika ingin menampilkan pesan di UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const formatBlogDate = (dateString) => {
    if (!dateString) return "Tanggal Tidak Tersedia";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      id="Blog"
      className="relative bg-gray-50 py-16 px-4 md:px-8 lg:px-24 text-center "
    >
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight flex items-center justify-center gap-3">
          Koran Sacaluna
        </h2>
        <p className="text-lg md:text-lg text-gray-700 max-w-4xl mx-auto">
          Ikuti berita, cerita, dan update terbaru dari dunia Sacaluna Coffee
          dan berita menarik lainnya.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-700">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-yellow-500 mb-4"
          />
          <p className="text-xl">Memuat berita terbaru...</p>
        </div>
      ) : !blogs || blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <FontAwesomeIcon icon={faInfoCircle} className="text-5xl mb-4" />
          <p className="text-xl">Tidak ada berita terbaru tersedia.</p>
          <p className="text-lg text-gray-700 mt-2">
            Nantikan cerita dan berita menarik dari kami!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto justify-center pb-8">
          {blogs.map((blog) => (
            <div
              key={blog.id_blog}
              onClick={() => navigate(`/blog/${blog.id_blog}`)}
              className="cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="w-full h-52 overflow-hidden rounded-t-xl">
                <img
                  src={blog.image_blog} // <<< UBAH DI SINI: Langsung pakai URL Cloudinary
                  alt={blog.title || "Gambar Berita"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/400x208/cccccc/000000?text=Image+Load+Error";
                  }} // Fallback image
                />
              </div>
              <div className="p-6 text-left flex flex-col flex-grow">
                <h3 className="line-clamp-2 font-bold text-xl mb-3 text-gray-900 leading-tight">
                  {blog.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-3 gap-3">
                  <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
                  <span className="font-medium">
                    {formatBlogDate(blog.time)}
                  </span>
                  {/* Perbaiki ikon faUserEdit, karena tidak ada data user dari API */}
                  <FontAwesomeIcon
                    icon={faUserEdit} // Sebaiknya diganti atau dihapus jika tidak ada data penulis
                    className="text-gray-600 ml-auto"
                  />
                  <span className="font-medium text-gray-800">
                    Admin Sacaluna Coffee
                  </span>
                </div>
                <p className="line-clamp-3 mb-4 text-gray-700 leading-relaxed text-justify flex-grow">
                  {blog.content}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/blog/${blog.id_blog}`);
                  }}
                  className="inline-flex items-center gap-2 text-yellow-700 font-semibold px-4 py-2 rounded-lg mt-auto 
                                   hover:bg-yellow-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  aria-label={`Baca selengkapnya tentang ${blog.title}`}
                >
                  Baca Selengkapnya <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pb-8 text-center">
        <button
          onClick={() => navigate("/blogs")}
          className="w-auto bg-black text-white font-semibold py-3 px-8 rounded-lg shadow-md
                  hover:bg-yellow-500 hover:text-black transition-colors duration-200 text-lg transform hover:scale-105"
        >
          Lihat Semua Berita
        </button>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-gray-600">
        <img src={LogoSmall} alt="Logo Sacaluna Coffee" className="w-7 h-7" />
        <span className="text-sm font-medium">Sacaluna Coffee</span>
      </div>
    </div>
  );
};

export default BeritaSection;
