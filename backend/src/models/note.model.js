import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: {
    type: String,
    enum: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "image", "other"],
    default: "other",
  },
  fileSize: { type: Number },
}, { _id: false });

const noteSchema = new mongoose.Schema(
  {
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxLength: 200 },
    description: { type: String, trim: true, maxLength: 1000 },

    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true },
    subject: { type: String, trim: true, maxLength: 100, index: true },
    course: { type: String, trim: true, maxLength: 100 },
    professor: { type: String, trim: true, maxLength: 100 },
    semester: { type: String, trim: true, maxLength: 50 },

    noteType: {
      type: String,
      enum: ["lecture-notes", "study-guide", "cheat-sheet", "past-exam", "textbook-notes", "other"],
      default: "other",
      index: true,
    },

    files: {
      type: [fileSchema],
      validate: [arr => arr.length >= 1 && arr.length <= 10, "Must have 1-10 files"],
    },
    thumbnailUrl: { type: String },

    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxLength: 30 }],
      validate: [arr => arr.length <= 10, "Maximum 10 tags allowed"],
      index: true,
    },

    downloadCount: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isPublic: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "hidden", "flagged"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
noteSchema.index({ title: "text", description: "text", subject: "text", course: "text", tags: "text" });
noteSchema.index({ university: 1, subject: 1 });
noteSchema.index({ university: 1, noteType: 1 });
noteSchema.index({ uploader: 1, createdAt: -1 });
noteSchema.index({ downloadCount: -1 });
noteSchema.index({ createdAt: -1 });

// Virtuals
noteSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

noteSchema.virtual("savesCount").get(function () {
  return this.saves?.length || 0;
});

noteSchema.virtual("totalFileSize").get(function () {
  return this.files?.reduce((sum, file) => sum + (file.fileSize || 0), 0) || 0;
});

// Instance methods
noteSchema.methods.incrementDownloads = function () {
  this.downloadCount += 1;
  return this.save();
};

noteSchema.methods.toggleLike = function (userId) {
  const userIdStr = userId.toString();
  const isLiked = this.likes.some(id => id.toString() === userIdStr);

  if (isLiked) {
    this.likes = this.likes.filter(id => id.toString() !== userIdStr);
  } else {
    this.likes.push(userId);
  }

  return this.save();
};

noteSchema.methods.toggleSave = function (userId) {
  const userIdStr = userId.toString();
  const isSaved = this.saves.some(id => id.toString() === userIdStr);

  if (isSaved) {
    this.saves = this.saves.filter(id => id.toString() !== userIdStr);
  } else {
    this.saves.push(userId);
  }

  return this.save();
};

noteSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

noteSchema.methods.isSavedBy = function (userId) {
  return this.saves.some(id => id.toString() === userId.toString());
};

noteSchema.methods.canView = function (user) {
  if (this.status !== "active") return false;
  if (this.isPublic) return true;
  if (!user) return false;
  if (this.uploader.toString() === user._id.toString()) return true;
  if (this.university) {
    return user.university?.toString() === this.university.toString();
  }
  return false;
};

// Static methods
noteSchema.statics.getByUniversity = function (universityId, options = {}) {
  const { subject, noteType, page = 1, limit = 20 } = options;

  const query = { university: universityId, status: "active", isPublic: true };
  if (subject) query.subject = new RegExp(subject, "i");
  if (noteType) query.noteType = noteType;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.getByUploader = function (uploaderId, options = {}) {
  const { page = 1, limit = 20, includePrivate = false } = options;

  const query = { uploader: uploaderId, status: "active" };
  if (!includePrivate) query.isPublic = true;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("university", "name");
};

noteSchema.statics.getPopular = function (universityId, limit = 10) {
  const query = { status: "active", isPublic: true };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ downloadCount: -1, likesCount: -1 })
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.search = function (searchQuery, options = {}) {
  const { universityId, subject, noteType, page = 1, limit = 20 } = options;

  const query = { status: "active", isPublic: true, $text: { $search: searchQuery } };
  if (universityId) query.university = universityId;
  if (subject) query.subject = new RegExp(subject, "i");
  if (noteType) query.noteType = noteType;

  return this.find(query, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.getByCourse = function (course, universityId, options = {}) {
  const { page = 1, limit = 20 } = options;

  const query = { course: new RegExp(course, "i"), status: "active", isPublic: true };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ downloadCount: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.getByTag = function (tag, options = {}) {
  const { universityId, page = 1, limit = 20 } = options;

  const query = { tags: tag.toLowerCase(), status: "active", isPublic: true };
  if (universityId) query.university = universityId;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.getSavedByUser = function (userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({ saves: userId, status: "active" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("uploader", "username firstName lastName profilePicture");
};

noteSchema.statics.getPopularSubjects = async function (universityId, limit = 20) {
  const match = { status: "active", isPublic: true };
  if (universityId) match.university = new mongoose.Types.ObjectId(universityId);

  return this.aggregate([
    { $match: match },
    { $group: { _id: "$subject", count: { $sum: 1 }, downloads: { $sum: "$downloadCount" } } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

// Update user stats after save
noteSchema.post("save", async function () {
  if (this.wasNew) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(this.uploader, { $inc: { "stats.notesCount": 1 } });
  }
});

noteSchema.pre("save", function (next) {
  this.wasNew = this.isNew;
  next();
});

noteSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(doc.uploader, { $inc: { "stats.notesCount": -1 } });
  }
});

const Note = mongoose.model("Note", noteSchema);

export default Note;
