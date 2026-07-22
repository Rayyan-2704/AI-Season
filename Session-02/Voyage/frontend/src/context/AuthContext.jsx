import { createContext, useContext, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("voyage_token"));

  const register = async ({ email, password, name }) => {
    const response = await apiClient.post("/auth/register", { email, password, name });
    return response.data;
  };

  const login = async ({ email, password }) => {
    const response = await apiClient.post("/auth/login", { email, password });
    const newToken = response.data.access_token;
    localStorage.setItem("voyage_token", newToken);
    setToken(newToken);
    return newToken;
  };

  const logout = () => {
    localStorage.removeItem("voyage_token");
    setToken(null);
  };

  const value = {
    token,
    isAuthenticated: Boolean(token),
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}