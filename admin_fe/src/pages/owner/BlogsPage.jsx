import React, { useEffect, useState, useCallback } from "react"; // Tambahkan useCallback
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarAdmin from "../../components/SidebarAdmin";
import { FaEdit, FaTrash } from "react-icons/fa";
import LogoImage from "../../assets/images/logo.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faXmark,
  faSpinner, // <--- Import faSpinner
  faTimesCircle, // <--- Import faTimesCircle
} from "@fortawesome/free-solid-svg-icons";

function BlogsPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // <--- State baru untuk loading pencarian
  const [initialLoading, setInitialLoading] = useState(true); // <--- State baru untuk loading awal
  const [dataError, setDataError] = useState(null); // <--- State baru untuk error data umum (bukan auth)

  // Fungsi terpusat untuk menangani error autentikasi
  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (BlogsPage):",
        errorData,
        "Status HTTP:",
        res.status
      );

      let errorMessage = "";
      if (res.status === 401 && errorData.expired) {
        errorMessage =
          "Sesi Anda telah berakhir karena token kadaluarsa. Anda akan dialihkan ke halaman login.";
      } else if (res.status === 401 || res.status === 403) {
        errorMessage =
          errorData.message ||
          "Anda tidak memiliki izin untuk mengakses atau melakukan tindakan ini.";
      } else {
        errorMessage =
          "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
      }

      setAuthError(errorMessage);

      setTimeout(() => {
        localStorage.clear();
        navigate("/");
      }, 3000);
    },
    [navigate]
  );

  // Bungkus fetchBlogs dengan useCallback
  const fetchBlogs = useCallback(async () => {
    // setSearchLoading(true); // Ini akan diatur oleh useEffect debounce atau loadBlogsData
    setDataError(null); // Reset error data umum
    // setAuthError(null); // Ini akan direset di sini, atau oleh handleAuthenticationError

    const token = localStorage.getItem("adminToken");
    console.log(
      "Mengambil blog dengan token:",
      token ? "Token ada" : "Token tidak ada"
    );

    try {
      const res = await fetch("http://localhost:3000/api/blogs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();
      setBlogs(data.data);
      setAuthError(null); // Reset authError jika fetch berhasil
    } catch (error) {
      console.error(
        "Gagal memuat blog (kesalahan jaringan atau tak tertangani):",
        error
      );
      setDataError(
        // <--- Set error data umum di sini
        "Gagal memuat daftar blog. Pastikan server berjalan dan koneksi internet Anda stabil."
      );
    }
  }, [handleAuthenticationError]); // handleAuthenticationError adalah dependency fetchBlogs

  // Effect untuk loading awal
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || user?.role !== "Admin") {
      if (!token) {
        alert("Anda tidak memiliki akses. Silakan login kembali.");
      }
      localStorage.clear();
      navigate("/");
      return;
    }

    const loadBlogsData = async () => {
      setInitialLoading(true); // Aktifkan loading awal
      await fetchBlogs();
      setInitialLoading(false); // Matikan loading awal setelah fetch
    };

    loadBlogsData();
  }, [navigate, fetchBlogs]);

  // Effect untuk pencarian (dengan Debounce)
  useEffect(() => {
    // Hanya aktifkan debounce setelah loading awal selesai
    if (!initialLoading) {
      const delayDebounceFn = setTimeout(async () => {
        setSearchLoading(true); // Aktifkan loading pencarian
        await fetchBlogs(); // Panggil ulang fetchBlogs untuk pencarian
        setSearchLoading(false); // Matikan loading pencarian
      }, 500); // Debounce 500ms

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, fetchBlogs, initialLoading]); // searchTerm, fetchBlogs, dan initialLoading sebagai dependency

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (type, value) => {
    setModalType(type);
    setModalContent(value);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType("");
    setModalContent(null);
  };

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Yakin ingin menghapus blog "${title}"?`);
    if (!confirmed) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:3000/api/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();
      alert(data.message);
      fetchBlogs();
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Gagal menghapus blog.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarAdmin />
        <div className="flex-1 p-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Blog Management</h1>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cari Blog:</label>
              <input
                type="text"
                placeholder="Search blog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}

          <div className="bg-white border rounded shadow-md w-full h-[700px] overflow-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-200 text-left">
                  <th className="p-3 w-[5%] text-center">No</th>
                  <th className="p-3 w-[35%]">Title</th>
                  <th className="p-3 w-[35%]">Content</th>
                  <th className="p-3 w-[12.5%]">Image</th>
                  <th className="p-3 w-[12.5%]">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Tampilkan loading awal atau loading pencarian */}
                {initialLoading || searchLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-3xl text-yellow-500 mb-4"
                      />
                      <p>
                        {initialLoading
                          ? "Memuat data Berita..."
                          : "Mencari Berita..."}
                      </p>
                    </td>
                  </tr>
                ) : dataError ? ( // Tampilkan error umum jika ada dan bukan karena loading
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-600">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-3xl text-red-500 mb-4"
                      />
                      <p>{dataError}</p> {/* Menggunakan dataError di sini */}
                    </td>
                  </tr>
                ) : filteredBlogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBlogs.map((blog, index) => (
                    <tr key={blog.id_blog} className="hover:bg-gray-100 ">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 w-2/5">
                        <button
                          onClick={() => openModal("title", blog.title)}
                          className="line-clamp-1"
                        >
                          {blog.title}
                        </button>
                      </td>
                      <td className="p-3  w-2/5">
                        <button
                          onClick={() => openModal("content", blog.content)}
                          className="line-clamp-2 text-justify"
                        >
                          {blog.content}
                        </button>
                      </td>
                      <td className="p-3 ">
                        <button
                          onClick={() => openModal("image", blog.image_blog)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Review Image
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-8">
                          <button
                            onClick={() =>
                              navigate(`/blogs/edit-blog/${blog.id_blog}`)
                            }
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(blog.id_blog, blog.title)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <button
              onClick={() => navigate("/blogs/add-blog")}
              className="w-50 text-lg bg-black hover:bg-yellow-500 text-white hover:text-black py-2 rounded-lg font-bold transition duration-200 mt-4 flex items-center justify-center gap-4"
            >
              <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
              Add Blog
            </button>
          </div>

          <div className="fixed bottom-4 right-4 pb-4 pr-12">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
              <span>Sacaluna Coffee</span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={closeModal} // Menggunakan closeModal
        >
          <div
            className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-4 text-gray-600 hover:text-black text-xl font-bold"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>

            {modalType === "image" ? (
              <img
                src={`http://localhost:3000${modalContent}`}
                alt="Blog"
                className="w-full h-auto object-contain rounded"
              />
            ) : (
              <p className="whitespace-pre-wrap text-justify">{modalContent}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogsPage;
