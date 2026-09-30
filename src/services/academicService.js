import { apiClient } from "./api";

export const getUniversities=()=>apiClient.get("/universities");
export const getCollegesByUniversity=(id)=>apiClient.get(`/colleges/university/${id}`);
export const getBranchesByCollege=(id)=>apiClient.get(`/branches/college/${id}`);
export const getAllBranches=()=>apiClient.get("/branches");
export const getAcademicYearsByUniversity=(id)=>apiClient.get(`/academic-years/university/${id}`);
export const getExamPatterns=()=>apiClient.get("/exam-patterns");
export const getExamPatternsByUniversity=(universityId)=>apiClient.get("/exam-patterns").then((response)=>({
  ...response,
  data: (response.data?.data || response.data || []).filter((pattern)=>
    String(pattern.universityId ?? pattern.university?.id ?? "") === String(universityId)
  )
}));
export const getSemestersByAcademicYear=(id)=>apiClient.get(`/semesters/academic-year/${id}`);
export const createAcademicProfile=(payload)=>apiClient.post("/user-profile",payload);
export const updateAcademicProfile=(id,payload)=>apiClient.put(`/user-profile/${id}`,payload);

export const patchAcademicProfile=(id,payload)=>apiClient.patch(`/user-profile/${id}`,payload);

export const getCurrentAcademicSubjects=()=>apiClient.get("/academic-context/subjects");
export const getCurrentSubjectSelections=()=>apiClient.get("/academic-context/subject-selections");
export const updateCurrentSubjectSelections=(subjectOfferingIds)=>apiClient.put("/academic-context/subject-selections",{subjectOfferingIds});
