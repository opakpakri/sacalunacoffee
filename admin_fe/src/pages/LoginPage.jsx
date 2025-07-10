import React, { useState } from "react";
import LogoImage from "../assets/images/logo.webp";
import bgImage from "../assets/images/bgImage.webp";
import { FaEye, FaEyeSlash, FaChevronDown, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";

const SECRET_KEY = "sacaluna_secret_key";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    role: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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

      localStorage.setItem("adminToken", token);
      localStorage.setItem("user", JSON.stringify(userData));

      if (userData.role === "Admin") navigate("/users");
      else if (userData.role === "Cashier") navigate("/transactionsCashier");
      else if (userData.role === "Kitchen") navigate("/transactionsKitchen");
    } catch (error) {
      alert(
        error.response?.data?.message || "Login gagal. Periksa koneksi Anda."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-screen h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white/80 p-6 sm:p-8 md:p-12 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="flex flex-col items-center">
          <img
            src={LogoImage}
            alt="Logo"
            className="w-20 h-20 sm:w-28 sm:h-28 mb-2 sm:mb-4"
          />{" "}
          <h1 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
            {" "}
            Selamat Datang di Sacaluna Coffee
          </h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          {" "}
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
                e.target.setCustomValidity("");
              }}
              onInvalid={(e) =>
                e.target.setCustomValidity(
                  "Silakan isi username terlebih dahulu"
                )
              }
              className="px-3 py-2 sm:px-4 sm:py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
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
                  e.target.setCustomValidity("");
                }}
                onInvalid={(e) =>
                  e.target.setCustomValidity(
                    "Silakan pilih role terlebih dahulu"
                  )
                }
                className="appearance-none w-full px-3 py-2 sm:px-4 sm:py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              >
                <option value="" disabled>
                  Pilih Role
                </option>
                <option value="Admin">Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                <FaChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
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
                e.target.setCustomValidity("");
              }}
              onInvalid={(e) =>
                e.target.setCustomValidity(
                  "Silakan isi password minimal 8 karakter"
                )
              }
              minLength={8}
              className="px-3 py-2 sm:px-4 sm:py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              required
            />
            <div
              className="absolute right-3 top-[42px] sm:top-[46px] cursor-pointer text-gray-600"
              onClick={togglePassword}
            >
              {showPassword ? (
                <FaEye className="w-4 h-4" />
              ) : (
                <FaEyeSlash className="w-4 h-4" />
              )}{" "}
            </div>
          </div>
          <div className="flex justify-center pt-2 sm:pt-4">
            {" "}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-50 bg-black hover:bg-yellow-500 text-white hover:text-black py-3 sm:py-4 rounded-lg font-bold transition duration-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg" /* Adjusted width, padding, font size */
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />{" "}
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
