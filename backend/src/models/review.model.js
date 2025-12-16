import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true, index: true },

    overallRating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxLength: 100 },
    content: { type: String, trim: true, maxLength: 2000 },

    categoryRatings: {
      academics: { type: Number, min: 1, max: 5 },
      campusLife: { type: Number, min: 1, max: 5 },
      facilities: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      safety: { type: Number, min: 1, max: 5 },
    },

    pros: {
      type: [{ type: String, trim: true, maxLength: 150 }],
      validate: [arr => arr.length <= 5, "Maximum 5 pros allowed"],
    },
    cons: {
      type: [{ type: String, trim: true, maxLength: 150 }],
      validate: [arr => arr.length <= 5, "Maximum 5 cons allowed"],
    },

    isAnonymous: { type: Boolean, default: false },

    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    reportCount: { type: Number, default: 0 },
    reports: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, maxLength: 500 },
      createdAt: { type: Date, default: Date.now },
    }],

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
reviewSchema.index({ author: 1, university: 1 }, { unique: true });
reviewSchema.index({ university: 1, status: 1, createdAt: -1 });
reviewSchema.index({ overallRating: -1 });
reviewSchema.index({ title: "text", content: "text" });

// Virtuals
reviewSchema.virtual("helpfulCount").get(function () {
  return this.helpfulVotes?.length || 0;
});

reviewSchema.virtual("categoryAverage").get(function () {
  const c = this.categoryRatings;
  if (!c) return null;
  const values = [c.academics, c.campusLife, c.facilities, c.value, c.location, c.safety].filter(Boolean);
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
});

// Mark as helpful
reviewSchema.methods.markHelpful = function (userId) {
  const userIdStr = userId.toString();
  const alreadyVoted = this.helpfulVotes.some(id => id.toString() === userIdStr);

  if (alreadyVoted) {
    this.helpfulVotes = this.helpfulVotes.filter(id => id.toString() !== userIdStr);
  } else {
    this.helpfulVotes.push(userId);
  }

  return this.save();
};

// Report review
reviewSchema.methods.report = function (userId, reason) {
  const userIdStr = userId.toString();
  const alreadyReported = this.reports.some(r => r.user.toString() === userIdStr);

  if (alreadyReported) {
    throw new Error("You have already reported this review");
  }

  this.reports.push({ user: userId, reason });
  this.reportCount += 1;

  if (this.reportCount >= 5) {
    this.status = "flagged";
  }

  return this.save();
};

// Check if user voted helpful
reviewSchema.methods.hasVotedHelpful = function (userId) {
  return this.helpfulVotes.some(id => id.toString() === userId.toString());
};

// Static methods
reviewSchema.statics.getByUniversity = function (universityId, options = {}) {
  const { page = 1, limit = 10, sortBy = "recent" } = options;

  let sort = { createdAt: -1 };
  if (sortBy === "helpful") sort = { helpfulCount: -1, createdAt: -1 };
  if (sortBy === "highest") sort = { overallRating: -1, createdAt: -1 };
  if (sortBy === "lowest") sort = { overallRating: 1, createdAt: -1 };

  return this.find({ university: universityId, status: "active" })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("author", "username firstName lastName profilePicture");
};

reviewSchema.statics.getByUser = function (userId, options = {}) {
  const { page = 1, limit = 10 } = options;

  return this.find({ author: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("university", "name city state images.logo");
};

reviewSchema.statics.hasUserReviewed = function (userId, universityId) {
  return this.exists({ author: userId, university: universityId });
};

reviewSchema.statics.getStats = async function (universityId) {
  const result = await this.aggregate([
    { $match: { university: new mongoose.Types.ObjectId(universityId), status: "active" } },
    {
      $group: {
        _id: null,
        avgOverall: { $avg: "$overallRating" },
        avgAcademics: { $avg: "$categoryRatings.academics" },
        avgCampusLife: { $avg: "$categoryRatings.campusLife" },
        avgFacilities: { $avg: "$categoryRatings.facilities" },
        avgValue: { $avg: "$categoryRatings.value" },
        avgLocation: { $avg: "$categoryRatings.location" },
        avgSafety: { $avg: "$categoryRatings.safety" },
        totalReviews: { $sum: 1 },
        rating5: { $sum: { $cond: [{ $eq: ["$overallRating", 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ["$overallRating", 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ["$overallRating", 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ["$overallRating", 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ["$overallRating", 1] }, 1, 0] } },
      },
    },
  ]);

  return result[0] || null;
};

reviewSchema.statics.getMostHelpful = function (universityId, limit = 5) {
  return this.find({ university: universityId, status: "active" })
    .sort({ helpfulCount: -1 })
    .limit(limit)
    .populate("author", "username firstName lastName profilePicture");
};

// Update university rating after save
reviewSchema.post("save", async function () {
  const University = mongoose.model("University");
  await University.updateRating(this.university);
});

// Update university rating after delete
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const University = mongoose.model("University");
    await University.updateRating(doc.university);
  }
});

reviewSchema.post("deleteOne", { document: true, query: false }, async function () {
  const University = mongoose.model("University");
  await University.updateRating(this.university);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
