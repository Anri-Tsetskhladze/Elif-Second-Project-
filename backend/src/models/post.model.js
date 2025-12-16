import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true },

    // Forum fields
    title: {
      type: String,
      trim: true,
      maxLength: 200,
      required: function() { return !this.parentPost; },
    },
    content: { type: String, maxLength: 5000, trim: true },
    images: [{ type: String }],

    category: {
      type: String,
      enum: ["general", "academics", "campus-life", "housing", "career", "social", "help", "announcements"],
      default: "general",
      index: true,
    },

    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxLength: 30 }],
      validate: [arr => arr.length <= 5, "Maximum 5 tags allowed"],
      index: true,
    },

    // Threading
    parentPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", index: true },
    threadDepth: { type: Number, default: 0, max: 10 },
    replyCount: { type: Number, default: 0 },

    // Q&A
    isQuestion: { type: Boolean, default: false },
    isAnswered: { type: Boolean, default: false },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },

    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    // Poll
    poll: {
      question: { type: String, maxLength: 200 },
      options: [{
        text: { type: String, maxLength: 100 },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      }],
      expiresAt: { type: Date },
      allowMultiple: { type: Boolean, default: false },
    },

    // Event
    event: {
      title: { type: String, maxLength: 100 },
      startDate: { type: Date },
      endDate: { type: Date },
      location: { type: String, maxLength: 200 },
      isOnline: { type: Boolean, default: false },
      meetingUrl: { type: String },
      attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      maxAttendees: { type: Number },
    },

    // Marketplace
    marketplace: {
      title: { type: String, maxLength: 100 },
      price: { type: Number, min: 0 },
      condition: { type: String, enum: ["new", "like-new", "good", "fair", "poor", ""] },
      isSold: { type: Boolean, default: false },
      soldTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Settings
    visibility: {
      type: String,
      enum: ["public", "university", "followers", "private"],
      default: "public",
    },
    isAnonymous: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

    // Moderation
    status: {
      type: String,
      enum: ["active", "hidden", "deleted", "flagged"],
      default: "active",
      index: true,
    },
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    moderationNote: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ university: 1, category: 1 });
postSchema.index({ university: 1, category: 1, createdAt: -1 });
postSchema.index({ parentPost: 1, createdAt: 1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ isQuestion: 1, isAnswered: 1 });
postSchema.index({ title: "text", content: "text" });
postSchema.index({ "event.startDate": 1 });

// Virtuals
postSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

postSchema.virtual("bookmarksCount").get(function () {
  return this.bookmarks?.length || 0;
});

postSchema.virtual("isReply").get(function () {
  return !!this.parentPost;
});

postSchema.virtual("isPoll").get(function () {
  return !!this.poll?.question;
});

postSchema.virtual("isEvent").get(function () {
  return !!this.event?.title;
});

postSchema.virtual("isMarketplace").get(function () {
  return !!this.marketplace?.title;
});

postSchema.virtual("replies", {
  ref: "Post",
  localField: "_id",
  foreignField: "parentPost",
});

// Instance methods
postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

postSchema.methods.isBookmarkedBy = function (userId) {
  return this.bookmarks.some(id => id.toString() === userId.toString());
};

postSchema.methods.getReplies = function (options = {}) {
  const { page = 1, limit = 20, sortBy = "oldest" } = options;

  let sort = { createdAt: 1 };
  if (sortBy === "newest") sort = { createdAt: -1 };
  if (sortBy === "popular") sort = { likesCount: -1, createdAt: -1 };

  return mongoose.model("Post")
    .find({ parentPost: this._id, status: "active" })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture isVerifiedStudent");
};

postSchema.methods.acceptAnswer = async function (replyId) {
  if (!this.isQuestion) {
    throw new Error("Only questions can have accepted answers");
  }

  const reply = await mongoose.model("Post").findById(replyId);
  if (!reply || reply.parentPost?.toString() !== this._id.toString()) {
    throw new Error("Invalid reply");
  }

  this.acceptedAnswer = replyId;
  this.isAnswered = true;
  return this.save();
};

postSchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save();
};

postSchema.methods.canView = function (user) {
  if (this.status !== "active") return false;
  if (this.visibility === "public") return true;
  if (!user) return false;
  if (this.user.toString() === user._id.toString()) return true;
  if (this.visibility === "university") {
    return user.university?.toString() === this.university?.toString();
  }
  return false;
};

postSchema.methods.vote = function (userId, optionIndex) {
  if (!this.poll?.options) return false;
  if (this.poll.expiresAt && new Date() > this.poll.expiresAt) return false;

  this.poll.options.forEach(opt => {
    const idx = opt.votes.findIndex(id => id.toString() === userId.toString());
    if (idx > -1) opt.votes.splice(idx, 1);
  });

  this.poll.options[optionIndex].votes.push(userId);
  return this.save();
};

postSchema.methods.toggleLike = function (userId) {
  const userIdStr = userId.toString();
  const isLiked = this.likes.some(id => id.toString() === userIdStr);

  if (isLiked) {
    this.likes = this.likes.filter(id => id.toString() !== userIdStr);
  } else {
    this.likes.push(userId);
  }

  return this.save();
};

postSchema.methods.toggleBookmark = function (userId) {
  const userIdStr = userId.toString();
  const isBookmarked = this.bookmarks.some(id => id.toString() === userIdStr);

  if (isBookmarked) {
    this.bookmarks = this.bookmarks.filter(id => id.toString() !== userIdStr);
  } else {
    this.bookmarks.push(userId);
  }

  return this.save();
};

// Static methods
postSchema.statics.getFeed = function (options = {}) {
  const { universityId, category, page = 1, limit = 20 } = options;

  const query = { status: "active", parentPost: null };
  if (universityId) query.university = universityId;
  if (category) query.category = category;

  return this.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name images.logo");
};

postSchema.statics.getByCategory = function (category, options = {}) {
  const { universityId, page = 1, limit = 20 } = options;

  const query = { status: "active", parentPost: null, category };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture isVerifiedStudent");
};

postSchema.statics.getThread = function (postId) {
  return this.findById(postId)
    .populate("user", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("acceptedAnswer")
    .populate({
      path: "replies",
      match: { status: "active" },
      options: { sort: { createdAt: 1 } },
      populate: { path: "user", select: "username firstName lastName profilePicture isVerifiedStudent" },
    });
};

postSchema.statics.getUnansweredQuestions = function (universityId, limit = 10) {
  const query = { status: "active", parentPost: null, isQuestion: true, isAnswered: false };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture");
};

postSchema.statics.getTrending = function (universityId, limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const query = { status: "active", createdAt: { $gte: oneDayAgo }, parentPost: null };
  if (universityId) query.university = universityId;

  return this.aggregate([
    { $match: query },
    {
      $addFields: {
        engagement: {
          $add: [
            { $size: "$likes" },
            { $multiply: ["$replyCount", 2] },
            { $multiply: ["$viewCount", 0.1] },
          ],
        },
      },
    },
    { $sort: { engagement: -1 } },
    { $limit: limit },
  ]);
};

postSchema.statics.getByTag = function (tag, options = {}) {
  const { universityId, page = 1, limit = 20 } = options;

  const query = { status: "active", parentPost: null, tags: tag.toLowerCase() };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture");
};

postSchema.statics.getPopularTags = async function (universityId, limit = 20) {
  const match = { status: "active", parentPost: null };
  if (universityId) match.university = new mongoose.Types.ObjectId(universityId);

  return this.aggregate([
    { $match: match },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

postSchema.statics.search = function (query, options = {}) {
  const { universityId, category, page = 1, limit = 20 } = options;

  const filter = { status: "active", parentPost: null, $text: { $search: query } };
  if (universityId) filter.university = universityId;
  if (category) filter.category = category;

  return this.find(filter, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture");
};

postSchema.statics.getUpcomingEvents = function (universityId, limit = 10) {
  const query = {
    status: "active",
    parentPost: null,
    "event.startDate": { $gte: new Date() },
  };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ "event.startDate": 1 })
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture");
};

postSchema.statics.getMarketplace = function (universityId, options = {}) {
  const { condition, maxPrice, page = 1, limit = 20 } = options;

  const query = { status: "active", parentPost: null, "marketplace.isSold": false };
  if (universityId) query.university = universityId;
  if (condition) query["marketplace.condition"] = condition;
  if (maxPrice) query["marketplace.price"] = { $lte: maxPrice };

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture");
};

// Hooks
postSchema.pre("save", async function (next) {
  if (this.isNew && this.parentPost) {
    const parent = await this.constructor.findById(this.parentPost);
    if (parent) {
      if (parent.isLocked) {
        throw new Error("Cannot reply to a locked post");
      }
      this.threadDepth = parent.threadDepth + 1;
      this.university = parent.university;
      this.category = parent.category;
      await this.constructor.findByIdAndUpdate(this.parentPost, { $inc: { replyCount: 1 } });
    }
  }
  next();
});

postSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

postSchema.pre("save", function (next) {
  if (this.tags && this.tags.length > 5) {
    this.tags = this.tags.slice(0, 5);
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
