import { apiClient } from "./api";

const root = "/community/channels";

export const getUniversityCommunity = () => apiClient.get(`${root}/university`);
export const getUniversityMembers = (limit = 8, page = 0) =>
  apiClient.get(`${root}/university/members`, { params: { limit, page } });
export const getCommunityMessages = (channelId, params = {}) =>
  apiClient.get(`${root}/${channelId}/messages`, { params });
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
