import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("voyage_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthEndpoint =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("voyage_token");

      const currentPath = window.location.pathname + window.location.search;
      const isAlreadyOnLogin = window.location.pathname === "/login";

      if (!isAlreadyOnLogin) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;