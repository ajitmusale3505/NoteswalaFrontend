import { apiClient } from "./api";

export const sendOtp = (email, purpose) => apiClient.post("/auth/otp/send", { email, purpose });
export const verifyOtp = (email, purpose, otp) => apiClient.post("/auth/otp/verify", { email, purpose, otp });
export const login = (payload) => apiClient.post("/auth/login", payload);
export const register = (payload) => apiClient.post("/auth/register", payload);
export const refreshToken = (payload) => apiClient.post("/auth/refresh-token", payload);
export const logout = (payload) => apiClient.post("/auth/logout", payload);
