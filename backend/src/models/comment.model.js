import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    targetType: {
      type: String,
      required: true,
      enum: ["post", "note", "review"],
      index: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetModel", index: true },
    targetModel: {
      type: String,
      required: true,
      enum: ["Post", "Note", "Review"],
    },

    content: { type: String, required: true, trim: true, maxLength: 500 },
    images: [{ type: String }],

    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", index: true },
    depth: { type: Number, default: 0, max: 3 },
    replyCount: { type: Number, default: 0 },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isAnonymous: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

    status: {
      type: String,
      enum: ["active", "hidden", "deleted", "flagged"],
      default: "active",
      index: true,
    },
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

commentSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

commentSchema.virtual("isReply").get(function () {
  return !!this.parentComment;
});

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

commentSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((id) => id.toString() === userId.toString());
};

commentSchema.methods.flag = function (userId, reason) {
  if (!this.flaggedBy.some((id) => id.toString() === userId.toString())) {
    this.flaggedBy.push(userId);
    this.flagCount += 1;
    if (this.flagCount >= 5) this.status = "flagged";
  }
};

commentSchema.statics.getByTarget = function (targetType, targetId, options = {}) {
  const { page = 1, limit = 20, includeReplies = true } = options;

  const query = { targetType, targetId, status: "active" };
  if (!includeReplies) query.parentComment = null;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture isVerified")
    .populate({
      path: "replies",
      match: { status: "active" },
      options: { sort: { createdAt: 1 }, limit: 3 },
      populate: { path: "user", select: "username firstName lastName profilePicture isVerified" },
    });
};

commentSchema.statics.getReplies = function (commentId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({ parentComment: commentId, status: "active" })
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username firstName lastName profilePicture isVerified");
};

commentSchema.statics.getCount = function (targetType, targetId) {
  return this.countDocuments({ targetType, targetId, status: "active" });
};

commentSchema.statics.getByUser = function (userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({ user: userId, status: "active" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("targetId");
};

commentSchema.pre("save", async function (next) {
  if (this.isNew && this.parentComment) {
    const parent = await this.constructor.findById(this.parentComment);
    if (parent) {
      this.depth = parent.depth + 1;
      this.targetType = parent.targetType;
      this.targetId = parent.targetId;
      this.targetModel = parent.targetModel;
      await this.constructor.findByIdAndUpdate(this.parentComment, { $inc: { replyCount: 1 } });
    }
  }
  next();
});

commentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }

  const mentionRegex = /@(\w+)/g;
  const mentions = this.content.match(mentionRegex);
  if (mentions) {
    this.mentions = [];
  }
  next();
});

commentSchema.post("save", async function () {
  if (this.isNew) {
    const modelMap = { post: "Post", note: "Note", review: "Review" };
    const Model = mongoose.model(modelMap[this.targetType]);
    if (Model) {
      await Model.findByIdAndUpdate(this.targetId, { $inc: { commentCount: 1 } });
    }
  }
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
