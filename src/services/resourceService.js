import { apiClient } from "./api";

export const getResources = (params) => apiClient.get("/resources", { params });
export const getResourceById = (id) => apiClient.get(`/resources/${id}`);
export const getCurrentUserSyllabus = () => apiClient.get("/resources/my-syllabus");
export const viewResource = (id) =>
  apiClient.get(`/resources/${id}/view`, { responseType: "blob" });
export const downloadResource = (id) =>
  apiClient.get(`/resources/${id}/download`, { responseType: "blob" });

/** Review APIs use the authenticated session and enforce resource access on the server. */
export const getResourceReviewSummary = (resourceId) =>
  apiClient.get(`/resources/${resourceId}/reviews/summary`);

export const getMyResourceReview = (resourceId) =>
  apiClient.get(`/resources/${resourceId}/reviews/me`);

export const createResourceReview = (resourceId, payload) =>
  apiClient.post(`/resources/${resourceId}/reviews`, payload);

export const updateResourceReview = (resourceId, reviewId, payload) =>
  apiClient.put(`/resources/${resourceId}/reviews/${reviewId}`, payload);
