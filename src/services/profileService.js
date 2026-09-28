import { apiClient } from "./api";

export const getCurrentUser = () => apiClient.get("/auth/me");

export const getUserAcademicProfile = (userId) =>
  apiClient.get(`/user-profile/${userId}`);
