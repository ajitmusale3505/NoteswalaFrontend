import { apiClient } from "./api";

const root = "/community/channels";

// Returns only the user's two eligible groups, computed from the authenticated academic profile.
export const getCommunityGroups = () => apiClient.get(`${root}/groups`);
export const getCommunityMembers = (channelId, size = 8, page = 0) =>
  apiClient.get(`${root}/${channelId}/members`, { params: { size, page } });
export const getCommunityMessages = (channelId, params = {}) =>
  apiClient.get(`${root}/${channelId}/messages`, { params });
export const searchCommunityMessages = (channelId, query, page = 0, size = 10) =>
  apiClient.get(`${root}/${channelId}/messages/search`, {
    params: { query, page, size: Math.min(Math.max(1, size), 20) },
  });
export const getCommunityMessageContext = (channelId, messageId, size = 30) =>
  apiClient.get(`${root}/${channelId}/messages/${messageId}/context`, {
    params: { size: Math.min(Math.max(1, size), 50) },
  });
export const getPinnedCommunityMessage = (channelId) =>
  apiClient.get(`${root}/${channelId}/pinned`);
export const getCommunityAttachments = (channelId, limit = 5) =>
  apiClient.get(`${root}/${channelId}/attachments`, { params: { limit } });
export const postCommunityMessage = (channelId, payload) =>
  apiClient.post(`${root}/${channelId}/messages`, payload);
export const uploadCommunityAttachment = (channelId, messageId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`${root}/${channelId}/messages/${messageId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
};
