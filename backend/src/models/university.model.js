import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true, trim: true },
    alias: [{ type: String, trim: true }],
    country: { type: String, default: "USA", trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true, uppercase: true },
    zip: { type: String, trim: true },
    address: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    region: { type: String, enum: ["northeast", "midwest", "south", "west", "international", ""] },
    timezone: { type: String, trim: true },

    // Classification
    type: {
      type: String,
      enum: ["public", "private-nonprofit", "private-forprofit", "community-college", ""],
      default: "",
    },
    level: {
      type: String,
      enum: ["4-year", "2-year", "graduate-only", "less-than-2-year", ""],
      default: "",
    },
    religiousAffiliation: { type: String, trim: true },
    foundedYear: { type: Number },

    // Contact & web
    website: { type: String, trim: true },
    admissionsUrl: { type: String, trim: true },
    financialAidUrl: { type: String, trim: true },
    priceCalculatorUrl: { type: String, trim: true },
    phone: { type: String, trim: true },
    admissionsEmail: { type: String, trim: true },

    // Email domains for student verification
    emailDomains: [{ type: String, lowercase: true, trim: true, index: true }],

    // Images
    images: {
      logo: { type: String, default: "" },
      logoSmall: { type: String, default: "" },
      cover: { type: String, default: "" },
      campus: [{ type: String }],
    },
    colors: {
      primary: { type: String, default: "#6366F1" },
      secondary: { type: String, default: "#14B8A6" },
    },

    // Statistics
    stats: {
      studentSize: { type: Number, default: 0 },
      undergradSize: { type: Number },
      gradSize: { type: Number },
      facultySize: { type: Number },
      studentFacultyRatio: { type: Number },
      admissionRate: { type: Number, min: 0, max: 1 },
      graduationRate: { type: Number, min: 0, max: 1 },
      retentionRate: { type: Number, min: 0, max: 1 },
      transferRate: { type: Number, min: 0, max: 1 },
      avgSat: { type: Number },
      avgAct: { type: Number },
      satRange: { low: { type: Number }, high: { type: Number } },
      actRange: { low: { type: Number }, high: { type: Number } },
    },

    // Demographics
    demographics: {
      percentMale: { type: Number, min: 0, max: 100 },
      percentFemale: { type: Number, min: 0, max: 100 },
      percentInternational: { type: Number, min: 0, max: 100 },
      percentOnCampus: { type: Number, min: 0, max: 100 },
    },

    // Costs
    costs: {
      tuitionInState: { type: Number },
      tuitionOutState: { type: Number },
      tuitionInternational: { type: Number },
      roomAndBoard: { type: Number },
      booksAndSupplies: { type: Number },
      otherExpenses: { type: Number },
      avgNetPrice: { type: Number },
      avgFinancialAid: { type: Number },
      percentReceivingAid: { type: Number, min: 0, max: 100 },
    },

    // Outcomes
    outcomes: {
      medianEarnings6yr: { type: Number },
      medianEarnings10yr: { type: Number },
      employmentRate: { type: Number, min: 0, max: 1 },
      medianDebt: { type: Number },
      loanDefaultRate: { type: Number, min: 0, max: 1 },
    },

    // Academic programs
    programs: [{ type: String, trim: true }],
    majors: [{ type: String, trim: true }],
    degrees: [{ type: String, enum: ["certificate", "associate", "bachelor", "master", "doctorate"] }],

    // App ratings (from user reviews)
    ratings: {
      overall: { type: Number, default: 0, min: 0, max: 5 },
      academics: { type: Number, default: 0, min: 0, max: 5 },
      professors: { type: Number, default: 0, min: 0, max: 5 },
      campusLife: { type: Number, default: 0, min: 0, max: 5 },
      housing: { type: Number, default: 0, min: 0, max: 5 },
      foodService: { type: Number, default: 0, min: 0, max: 5 },
      facilities: { type: Number, default: 0, min: 0, max: 5 },
      safety: { type: Number, default: 0, min: 0, max: 5 },
      socialLife: { type: Number, default: 0, min: 0, max: 5 },
      careerServices: { type: Number, default: 0, min: 0, max: 5 },
      valueForMoney: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      ratingDistribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },

    // App community stats
    communityStats: {
      totalMembers: { type: Number, default: 0 },
      verifiedMembers: { type: Number, default: 0 },
      totalPosts: { type: Number, default: 0 },
      totalNotes: { type: Number, default: 0 },
      totalStudyGroups: { type: Number, default: 0 },
      activeToday: { type: Number, default: 0 },
      activeThisWeek: { type: Number, default: 0 },
    },

    // Metadata
    metadata: {
      dataSource: { type: String, enum: ["college-scorecard", "manual", "api", "scrape"], default: "manual" },
      scorecardId: { type: Number, sparse: true },
      ipedId: { type: String, sparse: true },
      lastSyncedAt: { type: Date },
      lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Status
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
universitySchema.index({ name: "text", alias: "text", city: "text", state: "text" });
universitySchema.index({ emailDomains: 1 });
universitySchema.index({ country: 1, state: 1 });
universitySchema.index({ "ratings.overall": -1 });
universitySchema.index({ "communityStats.totalMembers": -1 });
universitySchema.index({ "stats.studentSize": -1 });
universitySchema.index({ type: 1, level: 1 });
universitySchema.index({ state: 1, city: 1 });
universitySchema.index({ "metadata.scorecardId": 1 }, { sparse: true });
universitySchema.index({ isActive: 1, isVerified: 1 });

// Virtuals
universitySchema.virtual("totalCostInState").get(function () {
  const c = this.costs;
  if (!c) return null;
  return (c.tuitionInState || 0) + (c.roomAndBoard || 0) + (c.booksAndSupplies || 0) + (c.otherExpenses || 0);
});

universitySchema.virtual("totalCostOutState").get(function () {
  const c = this.costs;
  if (!c) return null;
  return (c.tuitionOutState || 0) + (c.roomAndBoard || 0) + (c.booksAndSupplies || 0) + (c.otherExpenses || 0);
});

universitySchema.virtual("formattedAdmissionRate").get(function () {
  if (!this.stats?.admissionRate) return null;
  return `${(this.stats.admissionRate * 100).toFixed(1)}%`;
});

universitySchema.virtual("formattedGraduationRate").get(function () {
  if (!this.stats?.graduationRate) return null;
  return `${(this.stats.graduationRate * 100).toFixed(1)}%`;
});

universitySchema.virtual("location").get(function () {
  const parts = [this.city, this.state, this.country].filter(Boolean);
  return parts.join(", ");
});

// Instance methods
universitySchema.methods.isEmailDomainValid = function (email) {
  if (!this.emailDomains?.length) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return this.emailDomains.includes(domain);
};

universitySchema.methods.addEmailDomain = function (domain) {
  const normalized = domain.toLowerCase().trim();
  if (!this.emailDomains.includes(normalized)) {
    this.emailDomains.push(normalized);
  }
  return this.save();
};

universitySchema.methods.removeEmailDomain = function (domain) {
  const normalized = domain.toLowerCase().trim();
  this.emailDomains = this.emailDomains.filter((d) => d !== normalized);
  return this.save();
};

universitySchema.methods.incrementStat = function (stat, amount = 1) {
  if (this.communityStats[stat] !== undefined) {
    this.communityStats[stat] += amount;
  }
  return this.save();
};

// Static: Find by email domain
universitySchema.statics.findByEmailDomain = function (email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return Promise.resolve(null);
  return this.findOne({ emailDomains: domain, isActive: true });
};

// Static: Search with filters and pagination
universitySchema.statics.search = function (options = {}) {
  const {
    query,
    country,
    state,
    city,
    type,
    level,
    minStudents,
    maxStudents,
    minRating,
    maxTuition,
    hasReviews,
    isVerified,
    page = 1,
    limit = 20,
    sortBy = "relevance",
  } = options;

  const filter = { isActive: true };

  if (country) filter.country = country;
  if (state) filter.state = state.toUpperCase();
  if (city) filter.city = new RegExp(city, "i");
  if (type) filter.type = type;
  if (level) filter.level = level;
  if (minStudents) filter["stats.studentSize"] = { $gte: minStudents };
  if (maxStudents) filter["stats.studentSize"] = { ...filter["stats.studentSize"], $lte: maxStudents };
  if (minRating) filter["ratings.overall"] = { $gte: minRating };
  if (maxTuition) filter["costs.tuitionInState"] = { $lte: maxTuition };
  if (hasReviews) filter["ratings.totalReviews"] = { $gt: 0 };
  if (isVerified !== undefined) filter.isVerified = isVerified;

  let queryBuilder;
  if (query) {
    filter.$text = { $search: query };
    queryBuilder = this.find(filter, { score: { $meta: "textScore" } });
  } else {
    queryBuilder = this.find(filter);
  }

  // Sorting
  let sort = {};
  switch (sortBy) {
    case "relevance":
      if (query) sort = { score: { $meta: "textScore" } };
      else sort = { "communityStats.totalMembers": -1 };
      break;
    case "rating":
      sort = { "ratings.overall": -1 };
      break;
    case "students":
      sort = { "stats.studentSize": -1 };
      break;
    case "members":
      sort = { "communityStats.totalMembers": -1 };
      break;
    case "name":
      sort = { name: 1 };
      break;
    case "tuition-low":
      sort = { "costs.tuitionInState": 1 };
      break;
    case "tuition-high":
      sort = { "costs.tuitionInState": -1 };
      break;
    default:
      sort = { name: 1 };
  }

  return queryBuilder
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .select("-metadata.lastUpdatedBy");
};

// Static: Get popular universities (most registered students)
universitySchema.statics.getPopular = function (limit = 10) {
  return this.find({ isActive: true, "communityStats.totalMembers": { $gt: 0 } })
    .sort({ "communityStats.totalMembers": -1 })
    .limit(limit)
    .select("name city state images.logo ratings.overall communityStats.totalMembers");
};

// Static: Get top rated universities
universitySchema.statics.getTopRated = function (limit = 10, minReviews = 5) {
  return this.find({
    isActive: true,
    "ratings.totalReviews": { $gte: minReviews },
  })
    .sort({ "ratings.overall": -1, "ratings.totalReviews": -1 })
    .limit(limit)
    .select("name city state images.logo ratings");
};

// Static: Update rating from reviews
universitySchema.statics.updateRating = async function (universityId) {
  const Review = mongoose.model("Review");

  const result = await Review.aggregate([
    { $match: { university: new mongoose.Types.ObjectId(universityId), status: "approved" } },
    {
      $group: {
        _id: null,
        overall: { $avg: "$ratings.overall" },
        academics: { $avg: "$ratings.academics" },
        professors: { $avg: "$ratings.professors" },
        campusLife: { $avg: "$ratings.campusLife" },
        housing: { $avg: "$ratings.housing" },
        foodService: { $avg: "$ratings.foodService" },
        facilities: { $avg: "$ratings.facilities" },
        safety: { $avg: "$ratings.safety" },
        socialLife: { $avg: "$ratings.socialLife" },
        careerServices: { $avg: "$ratings.careerServices" },
        valueForMoney: { $avg: "$ratings.valueForMoney" },
        count: { $sum: 1 },
        rating5: { $sum: { $cond: [{ $gte: ["$ratings.overall", 4.5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $and: [{ $gte: ["$ratings.overall", 3.5] }, { $lt: ["$ratings.overall", 4.5] }] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $and: [{ $gte: ["$ratings.overall", 2.5] }, { $lt: ["$ratings.overall", 3.5] }] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $and: [{ $gte: ["$ratings.overall", 1.5] }, { $lt: ["$ratings.overall", 2.5] }] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $lt: ["$ratings.overall", 1.5] }, 1, 0] } },
      },
    },
  ]);

  const roundRating = (val) => (val ? Math.round(val * 10) / 10 : 0);

  let updateData;
  if (result.length > 0) {
    const r = result[0];
    updateData = {
      "ratings.overall": roundRating(r.overall),
      "ratings.academics": roundRating(r.academics),
      "ratings.professors": roundRating(r.professors),
      "ratings.campusLife": roundRating(r.campusLife),
      "ratings.housing": roundRating(r.housing),
      "ratings.foodService": roundRating(r.foodService),
      "ratings.facilities": roundRating(r.facilities),
      "ratings.safety": roundRating(r.safety),
      "ratings.socialLife": roundRating(r.socialLife),
      "ratings.careerServices": roundRating(r.careerServices),
      "ratings.valueForMoney": roundRating(r.valueForMoney),
      "ratings.totalReviews": r.count,
      "ratings.ratingDistribution.5": r.rating5,
      "ratings.ratingDistribution.4": r.rating4,
      "ratings.ratingDistribution.3": r.rating3,
      "ratings.ratingDistribution.2": r.rating2,
      "ratings.ratingDistribution.1": r.rating1,
    };
  } else {
    updateData = {
      "ratings.overall": 0,
      "ratings.totalReviews": 0,
      "ratings.ratingDistribution": { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  return this.findByIdAndUpdate(universityId, { $set: updateData }, { new: true });
};

// Static: Get by state
universitySchema.statics.findByState = function (state, options = {}) {
  const { page = 1, limit = 50 } = options;
  return this.find({ state: state.toUpperCase(), isActive: true })
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Get featured universities
universitySchema.statics.getFeatured = function (limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ "ratings.overall": -1 })
    .limit(limit);
};

// Static: Sync from College Scorecard API
universitySchema.statics.syncFromScorecard = async function (data) {
  const updateData = {
    name: data["school.name"],
    city: data["school.city"],
    state: data["school.state"],
    zip: data["school.zip"],
    coordinates: {
      latitude: data["location.lat"],
      longitude: data["location.lon"],
    },
    website: data["school.school_url"],
    priceCalculatorUrl: data["school.price_calculator_url"],
    type: data["school.ownership"] === 1 ? "public" : data["school.ownership"] === 2 ? "private-nonprofit" : "private-forprofit",
    stats: {
      studentSize: data["latest.student.size"],
      admissionRate: data["latest.admissions.admission_rate.overall"],
      graduationRate: data["latest.completion.rate_suppressed.overall"],
      avgSat: data["latest.admissions.sat_scores.average.overall"],
      avgAct: data["latest.admissions.act_scores.midpoint.cumulative"],
    },
    costs: {
      tuitionInState: data["latest.cost.tuition.in_state"],
      tuitionOutState: data["latest.cost.tuition.out_of_state"],
      avgNetPrice: data["latest.cost.avg_net_price.overall"],
    },
    outcomes: {
      medianEarnings6yr: data["latest.earnings.6_yrs_after_entry.median"],
      medianEarnings10yr: data["latest.earnings.10_yrs_after_entry.median"],
    },
    "metadata.dataSource": "college-scorecard",
    "metadata.scorecardId": data.id,
    "metadata.lastSyncedAt": new Date(),
  };

  // Clean undefined values
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined || updateData[key] === null) {
      delete updateData[key];
    }
  });

  return this.findOneAndUpdate(
    { "metadata.scorecardId": data.id },
    { $set: updateData },
    { upsert: true, new: true }
  );
};

// Static: Get count by country/state
universitySchema.statics.getCountByLocation = async function () {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: { country: "$country", state: "$state" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

const University = mongoose.model("University", universitySchema);

export default University;
