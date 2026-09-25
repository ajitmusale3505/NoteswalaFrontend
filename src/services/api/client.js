import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const publicAuthPaths = [
  "/auth/register",
  "/auth/login",
  "/auth/refresh-token",
  "/auth/otp/send",
  "/auth/otp/verify",
];

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url || "";
  const isPublicAuthRequest = publicAuthPaths.some((path) => requestUrl === path);

  if (!isPublicAuthRequest) {
    const token = localStorage.getItem("noteswala_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;
