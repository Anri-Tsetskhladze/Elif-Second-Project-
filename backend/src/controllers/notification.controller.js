import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// Get all notifications for user
export const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { page = 1, limit = 20, unreadOnly, type, category } = req.query;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    unreadOnly: unreadOnly === "true",
    type,
    category,
  };

  const notifications = await Notification.getByUser(user._id, options);
  const total = await Notification.countDocuments({
    recipient: user._id,
    isArchived: false,
    ...(options.unreadOnly ? { isRead: false } : {}),
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
  });

  res.status(200).json({
    notifications,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
  });
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const count = await Notification.getUnreadCount(user._id);
  const byCategory = await Notification.getUnreadCountByCategory(user._id);

  const categoryCounts = byCategory.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.status(200).json({ count, byCategory: categoryCounts });
});

// Get grouped notifications
export const getGroupedNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const grouped = await Notification.getGroupedByType(user._id);

  res.status(200).json({ grouped });
});

// Mark single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notification = await Notification.markAsRead(user._id, notificationId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.status(200).json({ notification });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { category } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await Notification.markAllAsRead(user._id, category);

  res.status(200).json({
    message: "Notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

// Mark multiple notifications as read
export const markMultipleAsRead = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({ error: "notificationIds array required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await Notification.markMultipleAsRead(user._id, notificationIds);

  res.status(200).json({
    message: "Notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

// Archive a notification
export const archiveNotification = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: user._id },
    { $set: { isArchived: true, archivedAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.status(200).json({ message: "Notification archived", notification });
});

// Archive old notifications
export const archiveOldNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { daysOld = 30 } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await Notification.archiveOld(user._id, daysOld);

  res.status(200).json({
    message: "Old notifications archived",
    modifiedCount: result.modifiedCount,
  });
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: user._id,
  });

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.status(200).json({ message: "Notification deleted" });
});

// Delete all notifications for user
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await Notification.deleteAllForUser(user._id);

  res.status(200).json({
    message: "All notifications deleted",
    deletedCount: result.deletedCount,
  });
});

// Update notification settings (preferences would be stored in User model)
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { settings } = req.body;

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    { $set: { notificationSettings: settings } },
    { new: true }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({
    message: "Notification settings updated",
    settings: user.notificationSettings,
  });
});
