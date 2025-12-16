import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  getGroupedNotifications,
  markAsRead,
  markAllAsRead,
  markMultipleAsRead,
  archiveNotification,
  archiveOldNotifications,
  deleteNotification,
  deleteAllNotifications,
  updateNotificationSettings,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Get notifications
router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.get("/grouped", protectRoute, getGroupedNotifications);

// Mark as read
router.put("/:notificationId/read", protectRoute, markAsRead);
router.put("/read-all", protectRoute, markAllAsRead);
router.put("/read-multiple", protectRoute, markMultipleAsRead);

// Archive
router.put("/:notificationId/archive", protectRoute, archiveNotification);
router.put("/archive-old", protectRoute, archiveOldNotifications);

// Delete
router.delete("/:notificationId", protectRoute, deleteNotification);
router.delete("/", protectRoute, deleteAllNotifications);

// Settings
router.put("/settings", protectRoute, updateNotificationSettings);

export default router;
