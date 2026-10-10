import { apiClient } from "../../../services/api";

export const getUploadCategories = () => apiClient.get("/categories");
export const getUploadUniversities = () => apiClient.get("/universities");
export const getUploadColleges = (universityId) => apiClient.get(`/colleges/university/${universityId}`);
export const getUploadBranchesByUniversity = (universityId) => apiClient.get(`/branches/university/${universityId}`);
export const getUploadBranchesByCollege = (collegeId) => apiClient.get(`/branches/college/${collegeId}`);
export const getUploadCollegeBranchMappings = (collegeId) => apiClient.get(`/college-branches/college/${collegeId}`);
export const getUploadAcademicYears = (universityId) => apiClient.get(`/academic-years/university/${universityId}`);
export const getUploadSemesters = (academicYearId) => apiClient.get(`/semesters/academic-year/${academicYearId}`);
export const getUploadCurriculumsByBranch = (branchId) => apiClient.get(`/curriculums/branch/${branchId}`);
export const getUploadCurriculumSemesters = (curriculumId) => apiClient.get(`/curriculums/${curriculumId}/semesters`);
export const getUploadSubjectOfferings = (curriculumSemesterId) => apiClient.get(`/subject-offerings/curriculum-semester/${curriculumSemesterId}`);

/**
 * Send files and metadata as one multipart request.
 *
 * Do not set Content-Type manually: Axios/browser must generate the boundary
 * that Spring uses to split file parts from form fields. The shared API client
 * defaults to JSON, so explicitly clear that header for this request.
 */
export const uploadAdminResource = (formData, metadata, onUploadProgress) => {
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });

  return apiClient.post("/admin/resources/upload", formData, {
    headers: { "Content-Type": false },
    timeout: 120000,
    onUploadProgress,
  });
};
