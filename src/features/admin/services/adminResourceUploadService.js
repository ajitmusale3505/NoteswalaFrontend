import { apiClient } from "../../../services/api";

export const getUploadCategories = () => apiClient.get("/categories");
export const getUploadUniversities = () => apiClient.get("/universities");
export const getUploadColleges = (universityId) => apiClient.get(`/colleges/university/${universityId}`);
export const getUploadBranchesByUniversity = (universityId) => apiClient.get(`/branches/university/${universityId}`);
export const getUploadBranchesByCollege = (collegeId) => apiClient.get(`/branches/college/${collegeId}`);
export const getUploadAcademicYears = (universityId) => apiClient.get(`/academic-years/university/${universityId}`);
export const getUploadSemesters = (academicYearId) => apiClient.get(`/semesters/academic-year/${academicYearId}`);
export const getUploadCurriculumsByBranch = (branchId) => apiClient.get(`/curriculums/branch/${branchId}`);
export const getUploadCurriculumSemesters = (curriculumId) => apiClient.get(`/curriculums/${curriculumId}/semesters`);
export const getUploadSubjectOfferings = (curriculumSemesterId) => apiClient.get(`/subject-offerings/curriculum-semester/${curriculumSemesterId}`);

export const uploadAdminResource = (formData, metadata) =>
  apiClient.post("/admin/resources/upload", formData, {
    params: metadata,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
