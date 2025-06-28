import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faUserEdit,
  faNewspaper,
  faTimesCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import bgImage from "../assets/Images/bgImage.jpg";

function BlogViewPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchBlog = async () => {
    try {
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/blogs/${id}`
      );

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setBlog(data.data);
      setHasError(false);
    } catch (error) {
      console.error("Gagal mengambil data blog:", error);
      setHasError(true);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-cover bg-center bg-fixed font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 md:p-12 animate-fade-in-up transform transition-all duration-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-700">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-4xl text-yellow-500 mb-4"
            />
            <p className="text-xl">Memuat artikel blog...</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
            <FontAwesomeIcon icon={faTimesCircle} className="text-5xl mb-4" />
            <p className="text-xl font-semibold mb-2">
              Terjadi Kesalahan Server
            </p>
            <p className="text-lg text-gray-700 text-center max-w-md">
              Gagal memuat artikel. Silakan coba lagi nanti atau hubungi
              dukungan.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : blog ? (
          <>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-6 leading-tight">
              {blog.title}
            </h1>

            <div className="flex justify-center items-center text-sm md:text-base text-gray-700 mb-8 flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
                <span className="font-medium">{formatBlogDate(blog.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUserEdit} className="text-gray-600" />
                <span className="font-semibold text-gray-800">
                  Admin Sacaluna Coffee
                </span>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <img
                src={`https://sacalunacoffee-production.up.railway${blog.image_blog}`}
                alt={blog.title}
                className="w-full max-w-4xl h-auto max-h-[550px] object-cover rounded-xl shadow-lg border border-gray-200"
                loading="lazy"
              />
            </div>

            <div className="text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-line text-justify border-t border-gray-200 pt-8 mt-8">
              {blog.content}
            </div>

            <div className="mt-12 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faNewspaper} className="text-gray-400" />
              <span>Artikel oleh Sacaluna Coffee &copy; 2024</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
            <FontAwesomeIcon
              icon={faNewspaper}
              className="text-5xl mb-4 text-gray-500"
            />
            <p className="text-xl font-semibold mb-2">
              Artikel tidak ditemukan.
            </p>
            <p className="text-lg text-gray-700 text-center max-w-md">
              Maaf, artikel yang Anda cari tidak ada atau sudah dihapus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogViewPage;
