import { apiClient } from "./api";

export const getUniversities=()=>apiClient.get("/universities");
export const getCollegesByUniversity=(id)=>apiClient.get(`/colleges/university/${id}`);
export const getBranchesByCollege=(id)=>apiClient.get(`/branches/college/${id}`);
export const getAcademicYearsByUniversity=(id)=>apiClient.get(`/academic-years/university/${id}`);
export const getSemestersByAcademicYear=(id)=>apiClient.get(`/semesters/academic-year/${id}`);
export const createAcademicProfile=(payload)=>apiClient.post("/user-profile",payload);
export const updateAcademicProfile=(id,payload)=>apiClient.put(`/user-profile/${id}`,payload);
