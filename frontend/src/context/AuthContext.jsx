import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    return null;
  });
  const loading = false;

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.success) {
        const data = response.data.data;
        const newUser = {
          token: data.token,
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
        };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        return { success: true, user: newUser };
      }

      return { success: false, message: response.data.message || "Đăng nhập thất bại" };
    } catch (error) {
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: "Không thể kết nối đến máy chủ" };
    }
  };

  const register = async ({ fullName, phone, email, password, role = "customer" }) => {
    try {
      const response = await api.post("/auth/register", {
        fullName,
        phone,
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (response.data.success) {
        return { success: true, user: response.data.data };
      }

      return { success: false, message: response.data.message || "Đăng ký thất bại" };
    } catch (error) {
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: "Không thể kết nối đến máy chủ" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const updateProfile = async ({ fullName, phone }) => {
    try {
      const response = await api.put("/auth/me", {
        fullName: fullName.trim(),
        phone: phone?.trim() || "",
      });

      if (response.data.success) {
        const data = response.data.data;
        const nextUser = {
          ...user,
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
        };
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
        return { success: true, user: nextUser };
      }

      return { success: false, message: response.data.message || "Cập nhật thất bại" };
    } catch (error) {
      if (error.response?.data?.message) {
        if (error.response.status === 404) {
          return {
            success: false,
            message: "Backend chưa load API cập nhật thông tin. Hãy restart backend rồi thử lại.",
          };
        }
        return { success: false, message: error.response.data.message };
      }
      if (error.response?.status === 404) {
        return {
          success: false,
          message: "Backend chưa load API cập nhật thông tin. Hãy restart backend rồi thử lại.",
        };
      }
      return { success: false, message: "Không thể kết nối đến máy chủ" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
