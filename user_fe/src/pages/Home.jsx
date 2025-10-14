import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CartSidebar from "../components/CartSidebar";
import MenusPage from "../pages/MenusPage";
import Navbar from "../components/Navbar"; // Pastikan import Navbar yang benar
import Footer from "../components/Footer";

function Home() {
  const { tableNumber, token } = useParams();
  const [tableData, setTableData] = useState(null);
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isValidTable, setIsValidTable] = useState(null);

  // NEW: Hitung total item di keranjang
  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (tableNumber && token) {
      const storedData = localStorage.getItem(`cart_${tableNumber}`);
      if (storedData) {
        try {
          const {
            cart: storedCart,
            qrToken,
            timestamp,
          } = JSON.parse(storedData);
          const now = Date.now();
          const diffInMinutes = (now - timestamp) / (1000 * 60);

          if (qrToken === token && diffInMinutes < 20) {
            setCart(storedCart);
          } else {
            localStorage.removeItem(`cart_${tableNumber}`);
            setCart([]);
          }
        } catch {
          localStorage.removeItem(`cart_${tableNumber}`);
          setCart([]);
        }
      }
    }
  }, [tableNumber, token]);

  useEffect(() => {
    if (cart.length > 0 && tableNumber && token) {
      const dataToStore = {
        cart,
        qrToken: token,
        timestamp: Date.now(),
      };
      localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(dataToStore));
    }
    if (cart.length === 0 && tableNumber) {
      localStorage.removeItem(`cart_${tableNumber}`);
    }
  }, [cart, tableNumber, token]);

  useEffect(() => {
    if (tableNumber && token) {
      fetch(
        `https://sacalunacoffee-production.up.railway.app/api/tables/validate/${tableNumber}/${token}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then(() => {
          setIsValidTable(true);
          return fetch(
            `https://sacalunacoffee-production.up.railway.app/api/tables/number/${tableNumber}`
          );
        })
        .then((res) => res.json())
        .then((data) => setTableData(data))
        .catch((err) => {
          console.error("Validation error:", err);
          setIsValidTable(false);
        });
    } else {
      setIsValidTable(false);
    }
  }, [tableNumber, token]);

  useEffect(() => {
    fetch("https://sacalunacoffee-production.up.railway.app/api/menus")
      .then((response) => response.json())
      .then((data) => {
        if (data?.data) {
          setMenus(data.data);
          setCategories([
            ...new Set(data.data.map((menu) => menu.category_menu)),
          ]);
        }
      })
      .catch((error) => console.error("Error fetching menus:", error));
  }, []);

  const toggleCart = () => setShowCart(!showCart);

  const addToCart = (menu) => {
    const existing = cart.find((item) => item.id_menu === menu.id_menu);
    if (existing) {
      // Cek apakah stok masih tersedia
      if (existing.quantity >= menu.stock) {
        alert(`Mohon maaf, untuk item ini hanya tersisa ${menu.stock} item.`);
        return;
      }

      setCart(
        cart.map((item) =>
          item.id_menu === menu.id_menu
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Jika stok minimal 1
      if (menu.stock > 0) {
        setCart([...cart, { ...menu, quantity: 1 }]);
      } else {
        alert(`"${menu.name_menu}" sedang habis.`);
      }
    }
  };

  const updateCartItem = (id_menu, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id_menu === id_menu) {
            const newQuantity = item.quantity + delta;

            if (newQuantity > item.stock) {
              alert(
                `Mohon maaf, untuk item ini hanya tersisa ${item.stock} item.`
              );
              return item; // jangan ubah quantity
            }

            return { ...item, quantity: Math.max(newQuantity, 0) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (id_menu) => {
    setCart(cart.filter((item) => item.id_menu !== id_menu));
  };

  const handleCategoryClick = () => {
    setSearchTerm("");
  };

  if (isValidTable === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isValidTable === false) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600 font-semibold text-lg">
          Nomor meja tidak ditemukan atau token tidak valid. Akses ditolak.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        categories={categories}
        toggleCart={toggleCart}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCategoryClick={handleCategoryClick}
        cartItemCount={totalCartItems}
      />

      <main className="flex-grow relative">
        <MenusPage
          menus={menus}
          categories={categories}
          addToCart={addToCart}
          searchTerm={searchTerm}
        />
      </main>

      <Footer />

      <CartSidebar
        cart={cart}
        showCart={showCart}
        toggleCart={toggleCart}
        updateCartItem={updateCartItem}
        removeCartItem={removeCartItem}
        tableNumber={tableData?.table_number}
      />
    </div>
  );
}

export default Home;
