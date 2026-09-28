import { apiClient } from "./api";

export const getCurrentUser = () => apiClient.get("/auth/me");

export const getUserAcademicProfile = (userId) =>
  apiClient.get(`/user-profile/${userId}`);

export const getPersonalProfile = () => apiClient.get("/user-profile/personal");
export const updatePersonalProfile = (payload) => apiClient.patch("/user-profile/personal", payload);
export const updateSkills = (skills) => apiClient.patch("/user-profile/personal", { skills });
export const updateInterests = (interests) => apiClient.patch("/user-profile/personal", { interests });
export const updateCareerPreferences = (payload) => apiClient.patch("/user-profile/personal", payload);

export const updateAboutMe = (aboutMe) => apiClient.patch("/user-profile/personal/about-me", JSON.stringify(aboutMe));
