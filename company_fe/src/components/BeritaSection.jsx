import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoSmall from "../assets/images/logocompany.jpg"; // Assuming this is Sacaluna's logo
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faUserEdit, // For author icon
  faSpinner, // For loading state
  faInfoCircle, // For no data state
} from "@fortawesome/free-solid-svg-icons";

const BeritaSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Frontend Logic: Fetches and sorts top 3 blogs. (LOGIC UNCHANGED)
  const fetchBlogs = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/blogs");
      const data = await res.json();

      const sortedBlogs = data.data
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 3); // Get only the top 3 recent blogs

      setBlogs(sortedBlogs);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      // No explicit hasError state, so we handle it by checking blogs.length in render
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Helper function to format date beautifully
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
      className="relative bg-gray-50 py-16 px-4 md:px-8 lg:px-24 text-center " // Added background, adjusted padding
    >
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight flex items-center justify-center gap-3">
          Koran Sacaluna
        </h2>
        <p className="text-lg md:text-lg text-gray-700 max-w-4xl mx-auto">
          Ikuti berita, cerita, dan update terbaru dari dunia Sacaluna Coffee
          dan berita menarik lainnya.
        </p>
      </div>

      {/* Blog Posts Grid / Loading / No Data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-700">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-yellow-500 mb-4"
          />
          <p className="text-xl">Memuat berita terbaru...</p>
        </div>
      ) : !blogs || blogs.length === 0 ? ( // Check for empty or null blogs
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <FontAwesomeIcon icon={faInfoCircle} className="text-5xl mb-4" />
          <p className="text-xl">Tidak ada berita terbaru tersedia.</p>
          <p className="text-lg text-gray-700 mt-2">
            Nantikan cerita dan berita menarik dari kami!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto justify-center pb-8">
          {" "}
          {/* Responsive grid */}
          {blogs.map((blog) => (
            <div
              key={blog.id_blog}
              onClick={() => navigate(`/blog/${blog.id_blog}`)} // Frontend logic unchanged
              className="cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="w-full h-52 overflow-hidden rounded-t-xl">
                {" "}
                {/* Fixed height for image */}
                <img
                  src={`http://localhost:3000${blog.image_blog}`}
                  alt={blog.title || "Gambar Berita"} // Added alt text fallback
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy" // Improve performance
                />
              </div>
              <div className="p-6 text-left flex flex-col flex-grow">
                {" "}
                {/* Increased padding, flex-grow */}
                <h3 className="line-clamp-2 font-bold text-xl mb-3 text-gray-900 leading-tight">
                  {blog.title}
                </h3>
                {/* Metadata line */}
                <div className="flex items-center text-sm text-gray-600 mb-3 gap-3">
                  <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
                  <span className="font-medium">
                    {formatBlogDate(blog.time)}
                  </span>
                  <FontAwesomeIcon
                    icon={faUserEdit}
                    className="text-gray-600 ml-auto"
                  />{" "}
                  {/* Author icon */}
                  <span className="font-medium text-gray-800">
                    Admin Sacaluna Coffee
                  </span>
                </div>
                <p className="line-clamp-3 mb-4 text-gray-700 leading-relaxed text-justify flex-grow">
                  {" "}
                  {/* Increased clamp, flex-grow */}
                  {blog.content}
                </p>
                <button
                  onClick={(e) => {
                    // Prevent card click event from bubbling up
                    e.stopPropagation();
                    navigate(`/blog/${blog.id_blog}`);
                  }}
                  className="inline-flex items-center gap-2 text-yellow-700 font-semibold px-4 py-2 rounded-lg mt-auto // Push to bottom
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

      {/* "See More" Button */}
      <div className="mt-12 pb-8 text-center">
        {" "}
        {/* Adjusted margin-top */}
        <button
          onClick={() => navigate("/blogs")} // Frontend logic unchanged
          className="w-auto bg-black text-white font-semibold py-3 px-8 rounded-lg shadow-md
                     hover:bg-yellow-500 hover:text-black transition-colors duration-200 text-lg transform hover:scale-105"
        >
          Lihat Semua Berita
        </button>
      </div>

      {/* Branding at bottom right - this should be in a global footer, not per section */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-gray-600">
        <img src={LogoSmall} alt="Logo Sacaluna Coffee" className="w-7 h-7" />
        <span className="text-sm font-medium">Sacaluna Coffee</span>
      </div>
    </div>
  );
};

export default BeritaSection;
// This component fetches and displays the latest news articles (blogs) from Sacaluna Coffee.
