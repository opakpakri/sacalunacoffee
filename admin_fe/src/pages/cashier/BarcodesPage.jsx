import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import SidebarCashier from "../../components/SidebarCashier";
import LogoImage from "../../assets/images/logo.webp";
import QRCode from "react-qr-code";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCirclePlus,
  faEdit,
  faTrash,
  faQrcode,
  faRotate,
  faSpinner, // Digunakan untuk loading
  faInfoCircle,
  faCircleCheck,
  faCircleExclamation,
  faTimesCircle, // Digunakan untuk error
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

function BarcodesPage() {
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading untuk generate QR di modal
  const [tableLoading, setTableLoading] = useState(true); // <--- State loading untuk data tabel utama
  const [tableError, setTableError] = useState(null); // <--- State error untuk data tabel utama
  const [isReusedToken, setIsReusedToken] = useState(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const TOKEN_EXPIRY_SECONDS = 20;

  const qrCodeRef = useRef();
  const [authError, setAuthError] = useState(null);

  const handleAuthenticationError = useCallback(
    async (res) => {
      let errorData = { message: "Terjadi kesalahan yang tidak terduga." };
      try {
        errorData = await res.json();
      } catch (e) {
        console.error("Gagal parsing respons error:", e);
      }

      console.error(
        "Detail Error Autentikasi (BarcodesPage):",
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

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || user?.role !== "Cashier") {
      if (!token) {
        alert(
          "Anda tidak memiliki akses sebagai Kasir. Silakan login kembali."
        );
      }
      localStorage.clear();
      navigate("/");
      return;
    }
    fetchTables();
  }, [navigate]);

  const fetchTables = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        "https://sacalunacoffee-production.up.railway.app/api/tables/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error("Failed to fetch tables", err);
      setTableError("Gagal memuat data meja. Silakan coba lagi.");
    } finally {
      setTableLoading(false);
    }
  }, [handleAuthenticationError]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const generateQRToken = async (table) => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/generate-qr/${table.id_table}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        const age =
          (Date.now() - new Date(data.qr_generated_at).getTime()) / 1000;

        if (data.reused) {
          if (age > TOKEN_EXPIRY_SECONDS) {
            const forcedRes = await fetch(
              `https://sacalunacoffee-production.up.railway.app/api/tables/generate-qr/${table.id_table}?force=true`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (!forcedRes.ok) {
              await handleAuthenticationError(forcedRes);
              return;
            }
            const forcedData = await forcedRes.json();
            setQrData(forcedData.qr_token);
            setIsReusedToken(false);
            setIsTokenExpired(false);
            alert("QR Code berhasil diperbarui!");
          } else {
            const confirmGenerate = window.confirm(
              "QR Code masih berlaku untuk meja ini. Apakah Anda yakin ingin membuat QR Code baru?"
            );
            if (!confirmGenerate) {
              setQrData(data.qr_token);
              setIsReusedToken(true);
              setIsTokenExpired(false);
              return;
            }
            const forcedRes = await fetch(
              `https://sacalunacoffee-production.up.railway.app/api/tables/generate-qr/${table.id_table}?force=true`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (!forcedRes.ok) {
              await handleAuthenticationError(forcedRes);
              return;
            }
            const forcedData = await forcedRes.json();
            setQrData(forcedData.qr_token);
            setIsReusedToken(false);
            setIsTokenExpired(false);
            alert("QR Code berhasil diperbarui!");
          }
        } else {
          setQrData(data.qr_token);
          setIsReusedToken(false);
          setIsTokenExpired(false);
          alert("QR Code baru berhasil dibuat!");
        }
      } else {
        alert(data.message || "Gagal generate QR Code.");
        console.error("Backend error:", data.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat generate QR Code.");
      console.error("Frontend error during QR generation:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingQrToken = async (table) => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/generate-qr/${table.id_table}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        await handleAuthenticationError(res);
        return;
      }

      const data = await res.json();

      if (res.ok && data.success && data.qr_token) {
        const age =
          (Date.now() - new Date(data.qr_generated_at).getTime()) / 1000;

        if (age < TOKEN_EXPIRY_SECONDS) {
          setQrData(data.qr_token);
          setIsReusedToken(true);
          setIsTokenExpired(false);
        } else {
          setQrData(null);
          setIsReusedToken(null);
          setIsTokenExpired(true);
        }
      } else {
        setQrData(null);
        setIsReusedToken(null);
        setIsTokenExpired(false);
      }
    } catch (error) {
      console.error("Failed to fetch existing QR token", error);
      setQrData(null);
      setIsReusedToken(null);
      setIsTokenExpired(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const svgElement = qrCodeRef.current;
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const URL = window.URL || window.webkitURL || window;
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const qrRenderSize = 256;
        const padding = 40;
        const lineHeight = 24;
        const spacingAfterQR = 20;

        const topText1 = `Meja ${selectedTable.table_number}`;
        const topText1Font = "bold 24px Arial";

        const bottomText1 = "SCAN ME!";
        const bottomText1Font = "bold 16px Arial";

        const bottomText2 = "jika token ditolak mohon hubungi kasir";
        const bottomText2Font = "16px Arial";

        const bottomText3 = `Masa berlaku token ${TOKEN_EXPIRY_SECONDS} detik`;
        const bottomText3Font = "14px Arial";

        ctx.font = topText1Font;
        const text1Width = ctx.measureText(topText1).width;
        ctx.font = bottomText1Font;
        const text2Width = ctx.measureText(bottomText1).width;
        ctx.font = bottomText2Font;
        const text3Width = ctx.measureText(bottomText2).width;
        ctx.font = bottomText3Font;
        const text4Width = ctx.measureText(bottomText3).width;

        const maxTextWidth = Math.max(
          text1Width,
          text2Width,
          text3Width,
          text4Width
        );

        canvas.width = Math.max(qrRenderSize, maxTextWidth) + 2 * padding;

        const totalHeight =
          padding +
          lineHeight +
          padding / 2 +
          qrRenderSize +
          spacingAfterQR +
          3 * lineHeight +
          padding;

        canvas.height = totalHeight;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = padding + lineHeight / 2;

        ctx.font = topText1Font;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(topText1, canvas.width / 2, currentY);
        currentY += lineHeight + padding / 2;

        ctx.drawImage(
          img,
          (canvas.width - qrRenderSize) / 2,
          currentY,
          qrRenderSize,
          qrRenderSize
        );
        currentY += qrRenderSize;

        currentY += spacingAfterQR;

        ctx.font = bottomText1Font;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(bottomText1, canvas.width / 2, currentY);
        currentY += lineHeight;

        ctx.font = bottomText2Font;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(bottomText2, canvas.width / 2, currentY);
        currentY += lineHeight;

        ctx.font = bottomText3Font;
        ctx.fillStyle = "gray";
        ctx.textAlign = "center";
        ctx.fillText(bottomText3, canvas.width / 2, currentY);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngFile;
        downloadLink.download = `qr_meja_${selectedTable.table_number}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } else {
      alert("QR Code belum tersedia untuk diunduh.");
    }
  };

  // Open modal handler
  const openModal = async (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
    setQrData(null);
    setIsReusedToken(null);
    setIsTokenExpired(false);
    await fetchExistingQrToken(table);
  };

  // Close modal handler
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTable(null);
    setQrData(null);
    setIsReusedToken(null);
    setIsTokenExpired(false);
  };

  // Handle delete table
  const handleDeleteTable = async (id_table, table_number) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus meja ${table_number}? Aksi ini tidak dapat dibatalkan jika ada riwayat transaksi terkait.`
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/${id_table}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        alert(errorData.message || "Sesi berakhir. Mohon login kembali.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchTables();
      } else {
        alert(data.message || "Gagal menghapus meja.");
        console.error("Backend delete error:", data.message);
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      alert("Terjadi kesalahan saat menghapus meja.");
    }
  };

  // Base URL untuk QR Code (URL aplikasi frontend Anda)
  const appBaseUrl = "http://localhost:5173";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarCashier />
        <div className="flex-1 p-16">
          <h1 className="text-2xl font-bold mb-8">Generate Barcode</h1>

          {/* Bagian untuk menampilkan pesan error autentikasi */}
          {authError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{authError}</span>
            </div>
          )}

          {/* Table List Container */}
          <div className="bg-white rounded shadow-xl overflow-hidden border border-gray-200 min-h-[400px] flex flex-col">
            <div className="bg-white border rounded shadow-md w-full h-[700px] overflow-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-gray-200 text-center">
                  <tr>
                    <th className="p-4 uppercase tracking-wider w-[10%]">
                      No.
                    </th>{" "}
                    {/* Changed from ID to No. */}
                    <th className="p-4 uppercase tracking-wider w-[30%]">
                      Table Number
                    </th>
                    <th className="p-4 uppercase tracking-wider w-[35%]">
                      QR Code
                    </th>
                    <th className="p-4 uppercase tracking-wider w-[25%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Tampilkan loading atau error saat mengambil data */}
                  {tableLoading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-16 text-gray-500"
                      >
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="text-3xl text-yellow-500 mb-4"
                        />
                        <p>Memuat data meja...</p>
                      </td>
                    </tr>
                  ) : tableError ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-16 text-red-600"
                      >
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className="text-3xl text-red-500 mb-4"
                        />
                        <p>{tableError}</p>
                      </td>
                    </tr>
                  ) : tables.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-16 text-gray-500"
                      >
                        <FontAwesomeIcon
                          icon={faInfoCircle}
                          className="text-3xl text-gray-400 mb-4"
                        />
                        <p>Belum ada data meja tersedia.</p>
                        <p className="mt-2">Klik "Tambah Meja" untuk mulai.</p>
                      </td>
                    </tr>
                  ) : (
                    tables.map((table, index) => (
                      <tr
                        key={table.id_table}
                        className="p-4 bg-white text-center hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="p-4">{index + 1}</td>{" "}
                        {/* Displaying sequential number */}
                        <td className="p-4">{table.table_number}</td>
                        <td className="p-4">
                          <button
                            onClick={() => openModal(table)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 gap-2"
                          >
                            <FontAwesomeIcon icon={faQrcode} />
                            <span>Lihat QR Code</span>
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-4">
                            <button
                              onClick={() =>
                                navigate(
                                  `/barcodeCashier/edit-table/${table.id_table}`
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                              title="Edit Meja"
                              aria-label={`Edit meja ${table.table_number}`}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="w-5 h-5"
                              />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteTable(
                                  table.id_table,
                                  table.table_number
                                )
                              }
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Hapus Meja"
                              aria-label={`Hapus meja ${table.table_number}`}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="w-5 h-5"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Table Button */}
          <button
            onClick={() => navigate("/barcodeCashier/add-table")}
            className="w-auto mt-6 px-6 py-3 bg-black text-white rounded-lg font-bold text-lg shadow-md
                  hover:bg-yellow-600 hover:text-black transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <FontAwesomeIcon icon={faCirclePlus} className="text-xl" />
            <span>Tambah Meja Baru</span>
          </button>

          {/* Note Section */}
          <p className="pt-8 text-sm text-gray-600">
            * Klik "Lihat QR Code" untuk menampilkan atau membuat QR Code baru
            untuk meja.
          </p>

          {/* Branding at bottom right */}
          <div className="fixed bottom-4 right-4 z-10 flex items-center gap-2 text-sm font-semibold text-gray-600 bg-white px-4 py-2 rounded-lg shadow-lg">
            <img src={LogoImage} alt="Sacaluna" className="h-6 w-6" />
            <span>Sacaluna Coffee</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedTable && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full relative flex flex-col items-center text-center transform scale-105 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Tutup"
            >
              <FontAwesomeIcon icon={faXmark} className="text-2xl" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              QR Code Meja {selectedTable?.table_number}
            </h2>

            {loading ? (
              <div className="flex flex-col items-center py-10">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-4xl text-yellow-500 mb-4"
                />
                <p className="text-gray-600">Memuat QR Code...</p>
              </div>
            ) : qrData ? (
              <>
                <div className="p-4 border-4 border-yellow-500 rounded-lg bg-white shadow-inner mb-6">
                  <QRCode
                    value={`${appBaseUrl}/table/${selectedTable.table_number}/${qrData}`}
                    size={200}
                    ref={qrCodeRef}
                  />
                </div>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    isReusedToken ? "text-green-600" : "text-yellow-600"
                  } flex items-center gap-1.5`}
                >
                  <FontAwesomeIcon
                    icon={isReusedToken ? faCircleCheck : faCircleExclamation}
                  />
                  {isReusedToken
                    ? "Token ini masih berlaku. Tidak perlu regenerasi."
                    : "Token baru berhasil dibuat!"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Masa berlaku QR Code: {TOKEN_EXPIRY_SECONDS} detik.
                </p>

                <div className="flex flex-col gap-4 mt-6">
                  {" "}
                  <button
                    onClick={() => generateQRToken(selectedTable)}
                    disabled={loading}
                    className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold text-lg shadow-md
                              hover:bg-yellow-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faRotate} />
                    )}
                    <span>
                      {loading ? "Membuat ulang..." : "Regenerasi QR Code"}
                    </span>
                  </button>
                  <button
                    onClick={downloadQRCode}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg shadow-md
                              hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Download QR</span>
                  </button>
                </div>
              </>
            ) : (
              // No QR data or token expired
              <div className="flex flex-col items-center py-10">
                {isTokenExpired && (
                  <p className="text-red-600 font-semibold mb-4 text-center flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleExclamation} /> Token sudah
                    berakhir.
                  </p>
                )}
                <button
                  onClick={() => generateQRToken(selectedTable)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-md
                              hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faQrcode} />
                  )}
                  <span>{loading ? "Membuat..." : "Generate QR Code"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BarcodesPage;
