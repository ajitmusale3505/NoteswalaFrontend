import { apiClient } from "../../../services/api";

export const getAdminCategories = () => apiClient.get("/categories/admin");
export const createAdminCategory = (payload) => apiClient.post("/categories", payload);
export const updateAdminCategory = (categoryId, payload) =>
  apiClient.put(`/categories/${categoryId}`, payload);
export const setAdminCategoryStatus = (categoryId, active) =>
  apiClient.patch(`/categories/${categoryId}/status`, null, { params: { active } });
