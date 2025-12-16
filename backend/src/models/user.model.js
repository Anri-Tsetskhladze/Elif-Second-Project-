import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Core fields 
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true, maxLength: 50 },
    lastName: { type: String, required: true, trim: true, maxLength: 50 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 3,
      maxLength: 20,
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    profilePicture: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    bio: { type: String, default: "", maxLength: 500, trim: true },
    location: { type: String, default: "", maxLength: 100, trim: true },

    // Role and verification
    role: {
      type: String,
      enum: ["student", "alumni", "faculty", "prospective", "admin", "moderator"],
      default: "prospective",
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },

    // Student verification
    studentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.edu$/, "Must be a valid .edu email"],
      sparse: true,
    },
    isVerifiedStudent: { type: Boolean, default: false },
    studentVerifiedAt: { type: Date },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },

    // University affiliation
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true },
    universityJoinedAt: { type: Date },
    previousUniversities: [{
      university: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
      joinedAt: { type: Date },
      leftAt: { type: Date },
    }],

    // Academic info
    major: { type: String, default: "", maxLength: 100, trim: true },
    minor: { type: String, default: "", maxLength: 100, trim: true },
    graduationYear: { type: Number, min: 1900, max: 2100 },
    academicYear: {
      type: String,
      enum: ["freshman", "sophomore", "junior", "senior", "graduate", "phd", "alumni", "faculty", ""],
      default: "",
    },
    gpa: { type: Number, min: 0, max: 4.0 },
    studentId: { type: String, trim: true },

    // Interests and skills
    interests: [{
      type: String,
      trim: true,
      maxLength: 50,
      lowercase: true,
    }],
    skills: [{ type: String, trim: true, maxLength: 50 }],

    // References
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    studyGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup" }],

    // Social links
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    // Social connections
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Settings
    settings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      privateProfile: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showGpa: { type: Boolean, default: false },
      allowMessages: { type: String, enum: ["everyone", "followers", "none"], default: "everyone" },
    },

    // Stats
    stats: {
      postsCount: { type: Number, default: 0 },
      notesCount: { type: Number, default: 0 },
      reviewsCount: { type: Number, default: 0 },
    },

    // Status
    lastActiveAt: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date },
    banReason: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
userSchema.index({ university: 1, academicYear: 1 });
userSchema.index({ university: 1, major: 1 });
userSchema.index({ username: "text", firstName: "text", lastName: "text" });
userSchema.index({ interests: 1 });
userSchema.index({ studentEmail: 1 }, { sparse: true });
userSchema.index({ "settings.privateProfile": 1 });

// Virtuals
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("followersCount").get(function () {
  return this.followers?.length || 0;
});

userSchema.virtual("followingCount").get(function () {
  return this.following?.length || 0;
});

userSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

userSchema.virtual("hasUniversity").get(function () {
  return !!this.university;
});

// Instance methods
userSchema.methods.isFollowing = function (userId) {
  return this.following.some((id) => id.toString() === userId.toString());
};

userSchema.methods.isFollowedBy = function (userId) {
  return this.followers.some((id) => id.toString() === userId.toString());
};

userSchema.methods.hasBlocked = function (userId) {
  return this.blockedUsers.some((id) => id.toString() === userId.toString());
};

userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.clerkId;
  delete obj.blockedUsers;
  delete obj.settings;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  if (!this.settings?.showEmail) delete obj.email;
  if (!this.settings?.showGpa) delete obj.gpa;
  return obj;
};

// Verify student email
userSchema.methods.verifyStudentEmail = async function (token) {
  if (!this.verificationToken || !this.verificationTokenExpires) {
    throw new Error("No verification pending");
  }

  if (new Date() > this.verificationTokenExpires) {
    this.verificationToken = undefined;
    this.verificationTokenExpires = undefined;
    await this.save();
    throw new Error("Verification token expired");
  }

  if (this.verificationToken !== token) {
    throw new Error("Invalid verification token");
  }

  this.isVerifiedStudent = true;
  this.studentVerifiedAt = new Date();
  this.verificationToken = undefined;
  this.verificationTokenExpires = undefined;

  if (this.role === "prospective") {
    this.role = "student";
  }

  // Auto-join university based on email domain
  if (this.studentEmail && !this.university) {
    const University = mongoose.model("University");
    const domain = this.studentEmail.split("@")[1];
    const university = await University.findOne({ emailDomains: domain, isActive: true });
    if (university) {
      await this.joinUniversity(university._id);
    }
  }

  return this.save();
};

// Generate verification token for student email
userSchema.methods.generateVerificationToken = function () {
  const crypto = require("crypto");
  this.verificationToken = crypto.randomBytes(32).toString("hex");
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.verificationToken;
};

// Join university
userSchema.methods.joinUniversity = async function (universityId) {
  const University = mongoose.model("University");
  const university = await University.findById(universityId);

  if (!university) {
    throw new Error("University not found");
  }

  if (!university.isActive) {
    throw new Error("University is not active");
  }

  // Store previous university if exists
  if (this.university && this.university.toString() !== universityId.toString()) {
    this.previousUniversities.push({
      university: this.university,
      joinedAt: this.universityJoinedAt,
      leftAt: new Date(),
    });

    // Update old university stats
    await University.findByIdAndUpdate(this.university, {
      $inc: { "communityStats.totalMembers": -1 },
    });
  }

  this.university = universityId;
  this.universityJoinedAt = new Date();

  // Update new university stats
  await University.findByIdAndUpdate(universityId, {
    $inc: { "communityStats.totalMembers": 1 },
  });

  return this.save();
};

// Leave university
userSchema.methods.leaveUniversity = async function () {
  if (!this.university) {
    throw new Error("Not affiliated with any university");
  }

  const University = mongoose.model("University");

  this.previousUniversities.push({
    university: this.university,
    joinedAt: this.universityJoinedAt,
    leftAt: new Date(),
  });

  await University.findByIdAndUpdate(this.university, {
    $inc: { "communityStats.totalMembers": -1 },
  });

  this.university = undefined;
  this.universityJoinedAt = undefined;

  return this.save();
};

// Join study group
userSchema.methods.joinStudyGroup = function (studyGroupId) {
  if (!this.studyGroups.some((id) => id.toString() === studyGroupId.toString())) {
    this.studyGroups.push(studyGroupId);
  }
  return this.save();
};

// Leave study group
userSchema.methods.leaveStudyGroup = function (studyGroupId) {
  this.studyGroups = this.studyGroups.filter((id) => id.toString() !== studyGroupId.toString());
  return this.save();
};

// Static methods
userSchema.statics.findByClerkId = function (clerkId) {
  return this.findOne({ clerkId });
};

userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByStudentEmail = function (studentEmail) {
  return this.findOne({ studentEmail: studentEmail.toLowerCase() });
};

userSchema.statics.findByUniversity = function (universityId, options = {}) {
  const query = this.find({ university: universityId, isBanned: false });
  if (options.academicYear) query.where("academicYear", options.academicYear);
  if (options.major) query.where("major", new RegExp(options.major, "i"));
  if (options.role) query.where("role", options.role);
  if (options.verifiedOnly) query.where("isVerifiedStudent", true);
  return query.sort({ lastActiveAt: -1 });
};

userSchema.statics.findByInterests = function (interests, universityId, limit = 20) {
  const query = { interests: { $in: interests }, isBanned: false };
  if (universityId) query.university = universityId;
  return this.find(query).limit(limit);
};

userSchema.statics.searchUsers = function (searchTerm, limit = 20) {
  return this.find(
    { $text: { $search: searchTerm }, isBanned: false, "settings.privateProfile": false },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);
};

userSchema.statics.getRecommendedUsers = function (userId, universityId, limit = 10) {
  return this.find({
    _id: { $ne: userId },
    university: universityId,
    isBanned: false,
    "settings.privateProfile": false,
  })
    .sort({ followersCount: -1, lastActiveAt: -1 })
    .limit(limit);
};

userSchema.statics.getVerifiedStudents = function (universityId, limit = 50) {
  return this.find({
    university: universityId,
    isVerifiedStudent: true,
    isBanned: false,
  })
    .sort({ lastActiveAt: -1 })
    .limit(limit);
};

// Pre-save hooks
userSchema.pre("save", function (next) {
  if (this.isModified("username")) {
    this.username = this.username.toLowerCase();
  }
  if (this.isModified("studentEmail") && this.studentEmail) {
    this.studentEmail = this.studentEmail.toLowerCase();
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
