import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faArrowRight,
  faChevronDown,
  faNewspaper,
  faTimesCircle,
  faSpinner,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import LogoSmall from "../assets/Images/logocompany.jpg";

function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  const fetchBlogs = async () => {
    try {
      const res = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/blogs"
      );

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setBlogs(data.data);
      setHasError(false);
    } catch (error) {
      console.error("Gagal mengambil data blog:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const sortedBlogs = [...blogs].sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

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
    <div className="py-12 px-4 md:px-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight flex items-center justify-center gap-4">
          <FontAwesomeIcon icon={faNewspaper} className="text-yellow-600" />
          Koran Sacaluna
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          Ikuti berita, cerita, dan update terbaru dari dunia Sacaluna Coffee.
        </p>
      </div>

      {!hasError && (
        <div className="max-w-6xl mx-auto flex justify-end mb-10">
          <div className="flex items-center gap-3">
            <label
              htmlFor="sortOrder"
              className="text-base font-medium text-gray-700"
            >
              Urutkan berdasarkan:
            </label>
            <div className="relative">
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none px-5 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-10 text-base font-medium transition-all duration-200"
              >
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-700">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-yellow-500 mb-4"
          />
          <p className="text-xl">Memuat artikel blog...</p>
        </div>
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-600">
          <FontAwesomeIcon icon={faTimesCircle} className="text-5xl mb-4" />
          <p className="text-xl font-semibold mb-2">Terjadi Kesalahan Server</p>
          <p className="text-lg text-gray-700 text-center max-w-md">
            Gagal memuat daftar blog. Silakan coba lagi nanti.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : sortedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <FontAwesomeIcon icon={faInfoCircle} className="text-5xl mb-4" />
          <p className="text-xl">Tidak ada artikel blog tersedia.</p>
          <p className="text-lg text-gray-700 mt-2">
            Nantikan berita dan cerita terbaru dari kami!
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          {" "}
          {sortedBlogs.map((blog) => (
            <div
              key={blog.id_blog}
              onClick={() => navigate(`/blog/${blog.id_blog}`)}
              className="flex flex-col md:flex-row items-start gap-8 bg-white p-6 rounded-xl shadow-lg
                         cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out group"
            >
              <div className="w-full md:w-80 h-52 overflow-hidden rounded-lg flex-shrink-0">
                {" "}
                <img
                  src={`https://sacalunacoffee-production.up.railway${blog.image_blog}`}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                  {" "}
                  {blog.title}
                </h2>

                <div className="flex items-center text-sm text-gray-600 mb-4 flex-wrap gap-x-5 gap-y-2">
                  {" "}
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="text-yellow-600"
                    />
                    <span className="font-medium">
                      {formatBlogDate(blog.time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={LogoSmall}
                      alt="Sacaluna Logo"
                      className="w-5 h-5"
                    />{" "}
                    <span className="font-semibold text-gray-800">
                      Admin Sacaluna Coffee
                    </span>
                  </div>
                </div>

                <p className="text-base md:text-lg text-gray-700 line-clamp-3 mb-4 leading-relaxed text-justify">
                  {" "}
                  {blog.content}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/blog/${blog.id_blog}`);
                  }}
                  className="inline-flex items-center gap-2 text-yellow-700 font-semibold px-4 py-2 rounded-lg
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
    </div>
  );
}

export default BlogListPage;
