import { apiClient } from "../../services/api";

// These endpoints return authenticated notifications and public, published learning
// materials. Official calendar/exam timetable APIs are not available in this backend yet.
export const getUniversityNotifications = (page = 0, size = 50) =>
  apiClient.get("/api/notifications", { params: { page, size: Math.min(Math.max(size, 1), 50) } });

export const markUniversityNotificationRead = (notificationId) =>
  apiClient.patch(`/api/notifications/${notificationId}/read`);

export const markAllUniversityNotificationsRead = () =>
  apiClient.patch("/api/notifications/read-all");

export const getUniversityDocuments = (page = 0, size = 50) =>
  apiClient.get("/public/resources/page", { params: { page, size: Math.min(Math.max(size, 1), 50) } });
