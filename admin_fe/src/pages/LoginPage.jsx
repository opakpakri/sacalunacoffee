// LoginPage.jsx
import React, { useState } from "react";
import LogoImage from "../assets/images/logo.webp";
import bgImage from "../assets/images/bgImage.webp";
import { FaEye, FaEyeSlash, FaChevronDown, FaSpinner } from "react-icons/fa"; // Import FaSpinner
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";

// Pastikan nilai ini SAMA PERSIS dengan nilai 'SECRET_KEY' di file .env Anda
const SECRET_KEY = "sacaluna_secret_key"; // Ganti dengan nilai dari .env Anda

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    role: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true when login starts

    const encryptedPassword = CryptoJS.AES.encrypt(
      form.password,
      SECRET_KEY
    ).toString();

    const formData = {
      ...form,
      password: encryptedPassword,
    };

    try {
      const response = await axios.post(
        "https://sacalunacoffee-production.up.railway.app/api/login",
        formData
      );

      const userData = response.data.user;
      const token = userData.token;

      localStorage.setItem("adminToken", token); // Using adminToken for all roles for consistency with other files
      localStorage.setItem("user", JSON.stringify(userData));

      if (userData.role === "Admin") navigate("/users");
      else if (userData.role === "Cashier") navigate("/transactionsCashier");
      else if (userData.role === "Kitchen") navigate("/transactionsKitchen");
    } catch (error) {
      alert(
        error.response?.data?.message || "Login gagal. Periksa koneksi Anda."
      );
    } finally {
      setIsLoading(false); // Set loading to false after login attempt (success or fail)
    }
  };

  return (
    <div
      className="w-screen h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white/80 p-12 rounded-lg shadow-lg w-lg">
        <div className="flex flex-col items-center">
          <img src={LogoImage} alt="Logo" className="w-28 h-28 mb-2" />
          <h1 className="text-xl font-bold text-center text-gray-800 mb-6">
            Selamat Datang di Sacaluna Coffee
          </h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="username" className="text-sm font-bold mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Masukkan username"
              value={form.username}
              onChange={(e) => {
                handleChange(e);
                e.target.setCustomValidity(""); // reset pesan error
              }}
              onInvalid={(e) =>
                e.target.setCustomValidity(
                  "Silakan isi username terlebih dahulu"
                )
              }
              className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="role" className="text-sm font-bold mb-1">
              Role
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                required
                value={form.role}
                onChange={(e) => {
                  handleChange(e);
                  e.target.setCustomValidity(""); // reset pesan error
                }}
                onInvalid={(e) =>
                  e.target.setCustomValidity(
                    "Silakan pilih role terlebih dahulu"
                  )
                }
                className="appearance-none w-full px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="" disabled>
                  Pilih Role
                </option>
                <option value="Admin">Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
              </select>

              {/* Ikon panah custom */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                <FaChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col relative">
            <label htmlFor="password" className="text-sm font-bold mb-1">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Masukkan password"
              value={form.password}
              onChange={(e) => {
                handleChange(e);
                e.target.setCustomValidity(""); // reset pesan error
              }}
              onInvalid={(e) =>
                e.target.setCustomValidity(
                  "Silakan isi password minimal 8 karakter"
                )
              }
              minLength={8}
              className="px-4 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
            <div
              className="absolute right-3 top-[46px] cursor-pointer text-gray-600"
              onClick={togglePassword}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading} // Disable button when loading
              className="w-50 bg-black hover:bg-yellow-500 text-white hover:text-black py-4 rounded-lg font-bold transition duration-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" // Add flex and gap for spinner
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" /> {/* Spinner icon */}
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
