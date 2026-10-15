import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ResourcesPage from "../features/resources/ResourcesPage";
import SubjectPage from "../features/subjects/SubjectPage";
import ResourceViewerPage from "../features/resources/ResourceViewerPage";
import ProfilePage from "../features/profile/ProfilePage";
import CommunityPage from "../features/community/CommunityPage";
import UniversityPage from "../features/university/UniversityPage";
import AdminDashboardPage from "../features/admin/AdminDashboardPage";
import AdminRoute from "../features/admin/AdminRoute";
import AdminUploadResourcePage from "../features/admin/AdminUploadResourcePage";
import AdminManageCategoriesPage from "../features/admin/AdminManageCategoriesPage";
import AdminCommunityGroupsPage from "../features/admin/AdminCommunityGroupsPage";
import AdminCommunityGroupDetailsPage from "../features/admin/AdminCommunityGroupDetailsPage";
import AuthRoute from "./AuthRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public entry points stay accessible without a session. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* All student-facing pages verify the session before they mount. */}
      <Route element={<AuthRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:subjectCode" element={<SubjectPage />} />
        <Route path="/resources/:subjectCode/:resourceId" element={<ResourceViewerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/university" element={<UniversityPage />} />
      </Route>

      {/* Admin routes retain their existing server-verified role guard. */}
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/resources/upload" element={<AdminRoute><AdminUploadResourcePage /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><AdminManageCategoriesPage /></AdminRoute>} />
      <Route path="/admin/community-groups" element={<AdminRoute><AdminCommunityGroupsPage /></AdminRoute>} />
      <Route path="/admin/community-groups/:groupId" element={<AdminRoute><AdminCommunityGroupDetailsPage /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
