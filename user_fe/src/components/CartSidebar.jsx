import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faTimes,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import LogoImage from "../assets/images/logo.webp";
import { useParams } from "react-router-dom";

function CartSidebar({
  cart,
  showCart,
  updateCartItem,
  removeCartItem,
  toggleCart,
  tableNumber,
}) {
  // Calculate total price, formatted as Rupiah
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  ); // Keep as number for calculation, format for display later

  const { token } = useParams();

  const handlePaymentClick = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong, tidak dapat melakukan pemesanan.");
      return;
    }

    // Simpan ke localStorage (utama)
    localStorage.setItem(`cart_${tableNumber}`, JSON.stringify({ cart }));

    // Simpan backup ke sessionStorage (cadangan sementara)
    sessionStorage.setItem("backup_cart", JSON.stringify(cart));

    // Arahkan ke halaman checkout
    window.location.href = `/table/${tableNumber}/${token}/checkout`;
  };

  return (
    <div
      className={`${
        showCart ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 fixed right-0 top-[80px] w-96 h-[600px] // <-- Changed height here!
        bg-white shadow-xl z-50 rounded-l-2xl flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleCart}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Tutup keranjang"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>
          <h2 className="font-semibold text-xl">Keranjang Anda</h2>
        </div>
        <span className="text-lg font-medium">
          Meja No. {tableNumber || "-"}
        </span>
      </div>

      {/* Scrollable Order List with Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-800">
        {cart.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Keranjang Anda kosong. Yuk, pilih menu favoritmu!
          </p>
        ) : (
          cart.map((item) => (
            <div
              key={item.id_menu}
              className="flex flex-col bg-gray-50 p-3 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-base text-gray-900 truncate w-2/3">
                  {item.name_menu}
                </span>
                <span className="font-medium text-base text-gray-900 ml-2">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Rp {item.price.toLocaleString("id-ID")} per item</span>
                <div className="flex items-center gap-2">
                  {/* Quantity Controls */}
                  <button
                    onClick={() => updateCartItem(item.id_menu, -1)}
                    className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center 
                               hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label={`Kurangi jumlah ${item.name_menu}`}
                  >
                    <FontAwesomeIcon icon={faMinus} className="text-xs" />
                  </button>
                  <span className="w-6 text-center font-medium text-lg text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItem(item.id_menu, 1)}
                    className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center 
                               hover:bg-yellow-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-700"
                    aria-label={`Tambah jumlah ${item.name_menu}`}
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  </button>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => removeCartItem(item.id_menu)}
                    className="ml-4 p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Hapus ${item.name_menu} dari keranjang`}
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-base" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Footer: Total and Payment Button */}
      <div className="bg-white p-5 border-t border-gray-200 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-2xl text-gray-900">Total:</span>
          <span className="font-bold text-2xl text-yellow-600">
            Rp {totalPrice.toLocaleString("id-ID")}
          </span>
        </div>

        <button
          onClick={handlePaymentClick}
          className="w-full bg-yellow-500 text-white py-3 rounded-xl 
                     hover:bg-yellow-600 transition-colors duration-200 
                     text-lg font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:ring-opacity-75"
        >
          Bayar Sekarang
        </button>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-600">
          <img src={LogoImage} alt="Sacaluna Logo" className="w-6 h-6" />
          <span>Sacaluna Coffee &copy; 2024</span>
        </div>
      </div>
    </div>
  );
}

export default CartSidebar;
