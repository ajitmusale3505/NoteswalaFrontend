import { apiClient } from "./api";

export const getResources = (params) => apiClient.get("/resources", { params });
export const getResourceById = (id) => apiClient.get(`/resources/${id}`);
export const viewResource = (id) =>
  apiClient.get(`/resources/${id}/view`, { responseType: "blob" });
export const downloadResource = (id) =>
  apiClient.get(`/resources/${id}/download`, { responseType: "blob" });
