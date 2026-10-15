import { apiClient } from "../../../services/api";

const root = "/admin/community-groups";

export const getAdminCommunityGroups = (params = {}) => apiClient.get(root, { params });
export const getAdminCommunityGroupSummary = () => apiClient.get(`${root}/summary`);
export const createAdminCommunityGroup = (payload) => apiClient.post(root, payload);
export const updateAdminCommunityGroup = (groupId, payload) => apiClient.put(`${root}/${groupId}`, payload);
export const setAdminCommunityGroupStatus = (groupId, active) =>
  apiClient.patch(`${root}/${groupId}/status`, null, { params: { active } });

export const uploadAdminCommunityGroupIcon = (groupId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`${root}/${groupId}/icon`, formData, {
    headers: { "Content-Type": false },
    timeout: 60000,
  });
};

export const getCommunityUniversities = () => apiClient.get("/universities");
export const getCommunityBranchesByUniversity = (universityId) =>
  apiClient.get(`/branches/university/${universityId}`);
export const getCommunitySemesters = () => apiClient.get("/semesters");
