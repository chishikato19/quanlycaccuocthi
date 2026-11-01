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
    // Đọc phiên đăng nhập từ localStorage
    try {
      const savedUser = localStorage.getItem("current_teacher_session");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to load user session", e);
    } finally {
      setIsLoading(false);
    }
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
