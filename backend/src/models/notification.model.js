import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    type: {
      type: String,
      required: true,
      enum: [
        // Social interactions
        "follow",
        "like_post",
        "like_comment",
        "comment",
        "reply",
        "mention",
        "share",

        // Post related
        "post_reply",
        "answer_accepted",

        // Note related
        "note_liked",
        "note_downloaded",
        "note_comment",

        // Review related
        "review_helpful",
        "review_reply",
        "review_comment",

        // Messaging
        "message",
        "group_invite",
        "group_message",
        "study_group_invite",

        // Events
        "event_invite",
        "event_reminder",
        "event_update",

        // University
        "university_update",
        "university_announcement",
        "new_student",

        // Course
        "course_update",

        // System
        "system",
        "welcome",
        "achievement",
      ],
      index: true,
    },

    // Notification category for grouping
    category: {
      type: String,
      enum: ["social", "content", "university", "messaging", "system"],
      default: "social",
    },

    title: { type: String, trim: true, maxLength: 100 },
    body: { type: String, trim: true, maxLength: 500 },

    data: {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost" },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
      noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
      reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
      conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
      universityId: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
      eventId: { type: mongoose.Schema.Types.ObjectId },
      studyGroupId: { type: mongoose.Schema.Types.ObjectId },
      answerId: { type: mongoose.Schema.Types.ObjectId },
      // Extra context data
      extra: { type: mongoose.Schema.Types.Mixed },
    },

    actionUrl: { type: String },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },

    // For grouping similar notifications
    groupKey: { type: String, index: true },
    groupCount: { type: Number, default: 1 },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    expiresAt: { type: Date },

    pushSent: { type: Boolean, default: false },
    pushSentAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ groupKey: 1, recipient: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Instance methods
notificationSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

notificationSchema.methods.archive = function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getByUser = function (userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false, type, category } = options;

  const query = { recipient: userId, isArchived: false };
  if (unreadOnly) query.isRead = false;
  if (type) query.type = type;
  if (category) query.category = category;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username fullName profileImage isVerified")
    .populate("data.postId", "content title")
    .populate("data.noteId", "title fileType")
    .populate("data.reviewId", "title rating")
    .populate("data.universityId", "name images");
};

notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false, isArchived: false });
};

notificationSchema.statics.getUnreadCountByCategory = async function (userId) {
  return this.aggregate([
    { $match: { recipient: new mongoose.Types.ObjectId(userId), isRead: false, isArchived: false } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
};

notificationSchema.statics.markAsRead = function (userId, notificationId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = function (userId, category = null) {
  const query = { recipient: userId, isRead: false };
  if (category) query.category = category;
  return this.updateMany(query, { $set: { isRead: true, readAt: new Date() } });
};

notificationSchema.statics.markMultipleAsRead = function (userId, notificationIds) {
  return this.updateMany(
    { _id: { $in: notificationIds }, recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

notificationSchema.statics.archiveOld = function (userId, daysOld = 30) {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.updateMany(
    { recipient: userId, createdAt: { $lt: cutoff }, isArchived: false },
    { $set: { isArchived: true, archivedAt: new Date() } }
  );
};

notificationSchema.statics.deleteAllForUser = function (userId) {
  return this.deleteMany({ recipient: userId });
};

notificationSchema.statics.getGroupedByType = async function (userId) {
  return this.aggregate([
    { $match: { recipient: new mongoose.Types.ObjectId(userId), isRead: false, isArchived: false } },
    { $group: { _id: "$type", count: { $sum: 1 }, latestAt: { $max: "$createdAt" } } },
    { $sort: { latestAt: -1 } },
  ]);
};

// Helper to determine category from type
const getCategoryFromType = (type) => {
  const categoryMap = {
    follow: "social",
    like_post: "social",
    like_comment: "social",
    comment: "social",
    reply: "social",
    mention: "social",
    share: "social",
    post_reply: "content",
    answer_accepted: "content",
    note_liked: "content",
    note_downloaded: "content",
    note_comment: "content",
    review_helpful: "content",
    review_reply: "content",
    review_comment: "content",
    message: "messaging",
    group_invite: "messaging",
    group_message: "messaging",
    study_group_invite: "messaging",
    event_invite: "university",
    event_reminder: "university",
    event_update: "university",
    university_update: "university",
    university_announcement: "university",
    new_student: "university",
    course_update: "university",
    system: "system",
    welcome: "system",
    achievement: "system",
  };
  return categoryMap[type] || "social";
};

// Create notification helpers
notificationSchema.statics.createNotification = async function (data) {
  const category = getCategoryFromType(data.type);
  return this.create({ ...data, category });
};

notificationSchema.statics.createFollowNotification = function (recipientId, senderId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "follow",
    body: "started following you",
    actionUrl: `/profile/${senderId}`,
  });
};

notificationSchema.statics.createLikePostNotification = function (recipientId, senderId, postId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "like_post",
    body: "liked your post",
    data: { postId },
    actionUrl: `/post/${postId}`,
    groupKey: `like_post_${postId}`,
  });
};

notificationSchema.statics.createCommentNotification = function (recipientId, senderId, postId, commentId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "comment",
    body: "commented on your post",
    data: { postId, commentId },
    actionUrl: `/post/${postId}`,
  });
};

notificationSchema.statics.createPostReplyNotification = function (recipientId, senderId, postId, commentId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "post_reply",
    body: "replied to your post",
    data: { postId, commentId },
    actionUrl: `/post/${postId}`,
  });
};

notificationSchema.statics.createAnswerAcceptedNotification = function (recipientId, senderId, postId, answerId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "answer_accepted",
    title: "Answer Accepted!",
    body: "Your answer was marked as accepted",
    data: { postId, answerId },
    actionUrl: `/post/${postId}`,
    priority: "high",
  });
};

notificationSchema.statics.createNoteLikedNotification = function (recipientId, senderId, noteId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "note_liked",
    body: "liked your note",
    data: { noteId },
    actionUrl: `/notes/${noteId}`,
    groupKey: `note_liked_${noteId}`,
  });
};

notificationSchema.statics.createNoteDownloadedNotification = function (recipientId, senderId, noteId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "note_downloaded",
    body: "downloaded your note",
    data: { noteId },
    actionUrl: `/notes/${noteId}`,
    groupKey: `note_downloaded_${noteId}`,
  });
};

notificationSchema.statics.createReviewHelpfulNotification = function (recipientId, senderId, reviewId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "review_helpful",
    body: "found your review helpful",
    data: { reviewId },
    actionUrl: `/review/${reviewId}`,
    groupKey: `review_helpful_${reviewId}`,
  });
};

notificationSchema.statics.createReviewReplyNotification = function (recipientId, senderId, reviewId, commentId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "review_reply",
    body: "replied to your review",
    data: { reviewId, commentId },
    actionUrl: `/review/${reviewId}`,
  });
};

notificationSchema.statics.createUniversityUpdateNotification = function (recipientId, universityId, title, body) {
  return this.createNotification({
    recipient: recipientId,
    type: "university_update",
    title,
    body,
    data: { universityId },
    actionUrl: `/universities/${universityId}`,
  });
};

notificationSchema.statics.createNewStudentNotification = function (recipientId, senderId, universityId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "new_student",
    body: "joined your university",
    data: { universityId },
    actionUrl: `/profile/${senderId}`,
  });
};

notificationSchema.statics.createMentionNotification = function (recipientId, senderId, targetType, targetId) {
  return this.createNotification({
    recipient: recipientId,
    sender: senderId,
    type: "mention",
    body: "mentioned you",
    data: { [`${targetType}Id`]: targetId },
    actionUrl: `/${targetType}/${targetId}`,
  });
};

notificationSchema.statics.createEventReminderNotification = function (recipientId, eventId, eventTitle, startsIn) {
  return this.createNotification({
    recipient: recipientId,
    type: "event_reminder",
    title: "Event Starting Soon",
    body: `${eventTitle} starts in ${startsIn}`,
    data: { eventId },
    priority: "high",
  });
};

notificationSchema.statics.createSystemNotification = function (recipientId, title, body, priority = "normal") {
  return this.createNotification({
    recipient: recipientId,
    type: "system",
    title,
    body,
    priority,
  });
};

notificationSchema.statics.createWelcomeNotification = function (recipientId) {
  return this.createNotification({
    recipient: recipientId,
    type: "welcome",
    title: "Welcome to Academy Hub!",
    body: "Start exploring universities, connect with students, and share your knowledge.",
    priority: "high",
  });
};

notificationSchema.statics.createBulkNotifications = function (recipientIds, notificationData) {
  const category = getCategoryFromType(notificationData.type);
  const notifications = recipientIds.map((recipientId) => ({
    ...notificationData,
    recipient: recipientId,
    category,
  }));
  return this.insertMany(notifications);
};

// Notify all students of a university
notificationSchema.statics.notifyUniversityStudents = async function (universityId, notificationData, excludeUserId = null) {
  const User = mongoose.model("User");
  const query = { "university._id": universityId };
  if (excludeUserId) query._id = { $ne: excludeUserId };

  const students = await User.find(query).select("_id");
  const recipientIds = students.map((s) => s._id);

  if (recipientIds.length > 0) {
    return this.createBulkNotifications(recipientIds, notificationData);
  }
  return [];
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
