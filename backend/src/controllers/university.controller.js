import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import University from "../models/university.model.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import Post from "../models/post.model.js";
import Note from "../models/note.model.js";

// GET /api/universities - search/list with filters
export const getUniversities = asyncHandler(async (req, res) => {
  const {
    q,
    country,
    state,
    city,
    type,
    level,
    minRating,
    maxTuition,
    minStudents,
    maxStudents,
    sortBy = "relevance",
    page = 1,
    limit = 20,
  } = req.query;

  const universities = await University.search({
    query: q,
    country,
    state,
    city,
    type,
    level,
    minRating: minRating ? parseFloat(minRating) : undefined,
    maxTuition: maxTuition ? parseInt(maxTuition) : undefined,
    minStudents: minStudents ? parseInt(minStudents) : undefined,
    maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
    sortBy,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
  });

  const total = await University.countDocuments({
    isActive: true,
    ...(country && { country }),
    ...(state && { state: state.toUpperCase() }),
    ...(type && { type }),
  });

  res.status(200).json({
    universities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/universities/popular
export const getPopularUniversities = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const universities = await University.getPopular(Math.min(parseInt(limit), 50));
  res.status(200).json({ universities });
});

// GET /api/universities/top-rated
export const getTopRatedUniversities = asyncHandler(async (req, res) => {
  const { limit = 10, minReviews = 5 } = req.query;
  const universities = await University.getTopRated(
    Math.min(parseInt(limit), 50),
    parseInt(minReviews)
  );
  res.status(200).json({ universities });
});

// GET /api/universities/countries
export const getCountries = asyncHandler(async (req, res) => {
  const result = await University.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
        states: { $addToSet: "$state" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const countries = result.map((r) => ({
    country: r._id,
    count: r.count,
    states: r.states.filter(Boolean).sort(),
  }));

  res.status(200).json({ countries });
});

// GET /api/universities/states
export const getStates = asyncHandler(async (req, res) => {
  const { country = "United States" } = req.query;

  const result = await University.aggregate([
    { $match: { isActive: true, country } },
    {
      $group: {
        _id: "$state",
        count: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: null, $ne: "" } } },
    { $sort: { _id: 1 } },
  ]);

  const states = result.map((r) => ({
    state: r._id,
    count: r.count,
  }));

  res.status(200).json({ states });
});

// GET /api/universities/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const university = await University.findByEmailDomain(email);

  if (university) {
    res.status(200).json({
      valid: true,
      university: {
        _id: university._id,
        name: university.name,
        city: university.city,
        state: university.state,
        logo: university.images?.logo,
      },
    });
  } else {
    res.status(200).json({ valid: false, university: null });
  }
});

// GET /api/universities/suggest
export const suggestUniversities = asyncHandler(async (req, res) => {
  const { domain, q, limit = 10 } = req.query;

  let universities = [];

  if (domain) {
    universities = await University.find({
      isActive: true,
      emailDomains: { $regex: domain, $options: "i" },
    })
      .limit(parseInt(limit))
      .select("name city state emailDomains images.logo");
  } else if (q && q.length >= 2) {
    universities = await University.find(
      { isActive: true, $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(parseInt(limit))
      .select("name city state images.logo");
  }

  res.status(200).json({ universities });
});

// GET /api/universities/:id
export const getUniversity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const university = await University.findOne({ _id: id, isActive: true });

  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  res.status(200).json({ university });
});

// GET /api/universities/:id/reviews
export const getUniversityReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = "recent" } = req.query;

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  const reviews = await Review.getByUniversity(id, {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 50),
    sortBy,
  });

  const stats = await Review.getStats(id);

  const total = await Review.countDocuments({ university: id, status: "active" });

  res.status(200).json({
    reviews,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/universities/:id/posts
export const getUniversityPosts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, page = 1, limit = 20 } = req.query;

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  const query = { university: id, status: "active", parentPost: null };
  if (category) query.category = category;

  const posts = await Post.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(Math.min(parseInt(limit), 50))
    .populate("user", "username firstName lastName profilePicture isVerifiedStudent");

  const total = await Post.countDocuments(query);

  res.status(200).json({
    posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/universities/:id/notes
export const getUniversityNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, noteType, page = 1, limit = 20 } = req.query;

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  const notes = await Note.getByUniversity(id, {
    subject,
    noteType,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 50),
  });

  const total = await Note.countDocuments({
    university: id,
    status: "active",
    isPublic: true,
  });

  res.status(200).json({
    notes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/universities/:id/students
export const getUniversityStudents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, academicYear, major, verifiedOnly } = req.query;

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  const students = await User.findByUniversity(id, {
    academicYear,
    major,
    verifiedOnly: verifiedOnly === "true",
  })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(Math.min(parseInt(limit), 50))
    .select("username firstName lastName profilePicture major academicYear isVerifiedStudent");

  const total = await User.countDocuments({ university: id, isBanned: false });

  res.status(200).json({
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// POST /api/universities/:id/join
export const joinUniversity = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  if (!university.isActive) {
    return res.status(400).json({ error: "University is not active" });
  }

  if (user.university?.toString() === id) {
    return res.status(400).json({ error: "Already a member of this university" });
  }

  await user.joinUniversity(id);

  res.status(200).json({
    message: `Joined ${university.name}`,
    university: {
      _id: university._id,
      name: university.name,
      city: university.city,
      state: university.state,
    },
  });
});

// POST /api/universities/:id/leave
export const leaveUniversity = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.university || user.university.toString() !== id) {
    return res.status(400).json({ error: "Not a member of this university" });
  }

  const university = await University.findById(id);
  await user.leaveUniversity();

  res.status(200).json({
    message: `Left ${university?.name || "university"}`,
  });
});

// GET /api/universities/:id/stats
export const getUniversityStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const university = await University.findById(id);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  const [reviewStats, postCount, noteCount, studentCount] = await Promise.all([
    Review.getStats(id),
    Post.countDocuments({ university: id, status: "active" }),
    Note.countDocuments({ university: id, status: "active", isPublic: true }),
    User.countDocuments({ university: id, isBanned: false }),
  ]);

  res.status(200).json({
    stats: {
      reviews: reviewStats,
      posts: postCount,
      notes: noteCount,
      students: studentCount,
      communityStats: university.communityStats,
    },
  });
});

// GET /api/universities/featured
export const getFeaturedUniversities = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  const universities = await University.getFeatured(parseInt(limit));
  res.status(200).json({ universities });
});

// GET /api/universities/nearby
export const getNearbyUniversities = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 50, limit = 20 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  const radiusInRadians = parseInt(radius) / 3963.2;

  const universities = await University.find({
    isActive: true,
    "coordinates.latitude": { $exists: true },
    "coordinates.longitude": { $exists: true },
  })
    .where("coordinates.latitude")
    .gte(parseFloat(lat) - radiusInRadians * (180 / Math.PI))
    .lte(parseFloat(lat) + radiusInRadians * (180 / Math.PI))
    .where("coordinates.longitude")
    .gte(parseFloat(lng) - radiusInRadians * (180 / Math.PI))
    .lte(parseFloat(lng) + radiusInRadians * (180 / Math.PI))
    .limit(parseInt(limit))
    .select("name city state coordinates images.logo ratings.overall");

  res.status(200).json({ universities });
});
