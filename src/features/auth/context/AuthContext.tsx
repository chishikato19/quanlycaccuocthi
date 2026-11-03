"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TeacherDto } from "@/types";

interface AuthContextType {
  currentUser: TeacherDto | null;
  setCurrentUser: (user: TeacherDto | null) => void;
  logout: () => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TeacherDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Đọc phiên đăng nhập từ localStorage để nạp tức thì (SWR)
    let hasLocal = false;
    try {
      const savedUser = localStorage.getItem("current_teacher_session");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        hasLocal = true;
      }
    } catch (e) {
      console.error("Failed to load user session", e);
    }

    // Xác thực phiên với Server qua HttpOnly Cookie để chống giả mạo quyền ở localStorage
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("current_teacher_session", JSON.stringify(data.user));
        } else if (hasLocal) {
          // Phiên cookie ở server đã hết hạn hoặc không hợp lệ -> xóa sạch local state
          setCurrentUser(null);
          localStorage.removeItem("current_teacher_session");
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSetCurrentUser = (user: TeacherDto | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("current_teacher_session", JSON.stringify(user));
    } else {
      localStorage.removeItem("current_teacher_session");
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    handleSetCurrentUser(null);
  };

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN" || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        logout,
        isLoading,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
