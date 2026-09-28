import { apiClient } from "./api";

export const getCurrentUser = () => apiClient.get("/auth/me");

export const getUserAcademicProfile = (userId) =>
  apiClient.get(`/user-profile/${userId}`);

export const getPersonalProfile = () => apiClient.get("/user-profile/personal");
export const updatePersonalProfile = (payload) => apiClient.patch("/user-profile/personal", payload);
