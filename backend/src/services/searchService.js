import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import University from "../models/university.model.js";
import Note from "../models/note.model.js";
import Review from "../models/review.model.js";
import SearchHistory from "../models/searchHistory.model.js";
import mongoose from "mongoose";

const DEFAULT_LIMIT = 10;

// Track which search method is available
let searchMethod = null;

// Check if Atlas Search is available
const checkAtlasSearch = async () => {
  if (searchMethod !== null) return searchMethod;

  try {
    await University.aggregate([
      {
        $search: {
          index: "universities_search",
          text: { query: "test", path: "name" },
        },
      },
      { $limit: 1 },
    ]);
    searchMethod = "atlas";
    console.log("Search: Using Atlas Search");
  } catch (error) {
    searchMethod = "text";
    console.log("Search: Atlas Search not available, using basic text search");
  }

  return searchMethod;
};

// Initialize search method on first use
checkAtlasSearch();

// Atlas Search aggregation builder
const buildAtlasSearch = (query, indexName, paths, options = {}) => {
  const { fuzzy = true, filters = {} } = options;

  const searchStage = {
    $search: {
      index: indexName,
      compound: {
        must: [
          {
            text: {
              query,
              path: paths,
              ...(fuzzy && {
                fuzzy: {
                  maxEdits: 1,
                  prefixLength: 2,
                },
              }),
            },
          },
        ],
      },
      highlight: {
        path: paths,
      },
    },
  };

  return searchStage;
};

// Atlas autocomplete builder
const buildAtlasAutocomplete = (query, indexName, path) => ({
  $search: {
    index: indexName,
    autocomplete: {
      query,
      path,
      tokenOrder: "sequential",
      fuzzy: {
        maxEdits: 1,
        prefixLength: 2,
      },
    },
  },
});

// Basic text search query
const buildTextSearchQuery = (query, additionalFilters = {}) => ({
  $text: { $search: query },
  ...additionalFilters,
});

// Regex search for partial matching
const buildRegexQuery = (query, fields) => {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

// Search universities
export const searchUniversities = async (query, options = {}) => {
  const { limit = DEFAULT_LIMIT, page = 1, sortBy = "score" } = options;
  const skip = (page - 1) * limit;
  const method = await checkAtlasSearch();

  if (method === "atlas") {
    try {
      const pipeline = [
        buildAtlasSearch(query, "universities_search", ["name", "city", "state", "description"]),
        { $addFields: { score: { $meta: "searchScore" } } },
        { $sort: sortBy === "score" ? { score: -1 } : { name: 1 } },
        {
          $facet: {
            results: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  name: 1,
                  city: 1,
                  state: 1,
                  country: 1,
                  images: 1,
                  rating: 1,
                  reviewCount: 1,
                  studentCount: 1,
                  score: 1,
                  highlights: { $meta: "searchHighlights" },
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await University.aggregate(pipeline);
      const total = result.total[0]?.count || 0;

      return { results: result.results, total };
    } catch (error) {
      console.error("Atlas Search error, falling back:", error.message);
    }
  }

  // Fallback to basic text search
  try {
    let universities = await University.find(
      buildTextSearchQuery(query),
      { score: { $meta: "textScore" } }
    )
      .sort(sortBy === "score" ? { score: { $meta: "textScore" } } : { name: 1 })
      .skip(skip)
      .limit(limit)
      .select("name city state country images rating reviewCount studentCount")
      .lean();

    if (universities.length === 0) {
      universities = await University.find(buildRegexQuery(query, ["name", "city", "state"]))
        .skip(skip)
        .limit(limit)
        .select("name city state country images rating reviewCount studentCount")
        .lean();
    }

    const total = await University.countDocuments(
      universities.length > 0
        ? buildTextSearchQuery(query)
        : buildRegexQuery(query, ["name", "city", "state"])
    );

    return { results: universities, total };
  } catch (error) {
    const universities = await University.find(buildRegexQuery(query, ["name", "city", "state"]))
      .skip(skip)
      .limit(limit)
      .select("name city state country images rating reviewCount studentCount")
      .lean();

    const total = await University.countDocuments(buildRegexQuery(query, ["name", "city", "state"]));
    return { results: universities, total };
  }
};

// Search users
export const searchUsers = async (query, options = {}) => {
  const { limit = DEFAULT_LIMIT, page = 1 } = options;
  const skip = (page - 1) * limit;
  const method = await checkAtlasSearch();

  if (method === "atlas") {
    try {
      const pipeline = [
        buildAtlasSearch(query, "users_search", ["username", "fullName", "firstName", "lastName", "bio"]),
        { $addFields: { score: { $meta: "searchScore" } } },
        { $sort: { score: -1 } },
        {
          $facet: {
            results: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  username: 1,
                  firstName: 1,
                  lastName: 1,
                  fullName: 1,
                  profilePicture: 1,
                  isVerifiedStudent: 1,
                  university: 1,
                  score: 1,
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await User.aggregate(pipeline);
      const total = result.total[0]?.count || 0;

      return { results: result.results, total };
    } catch (error) {
      console.error("Atlas Search error, falling back:", error.message);
    }
  }

  // Fallback to basic text search
  try {
    let users = await User.find(buildTextSearchQuery(query), { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
      .select("username firstName lastName fullName profilePicture isVerifiedStudent university")
      .lean();

    if (users.length === 0) {
      users = await User.find(buildRegexQuery(query, ["username", "firstName", "lastName", "fullName"]))
        .skip(skip)
        .limit(limit)
        .select("username firstName lastName fullName profilePicture isVerifiedStudent university")
        .lean();
    }

    const total = await User.countDocuments(
      users.length > 0
        ? buildTextSearchQuery(query)
        : buildRegexQuery(query, ["username", "firstName", "lastName", "fullName"])
    );

    return { results: users, total };
  } catch (error) {
    const users = await User.find(buildRegexQuery(query, ["username", "firstName", "lastName", "fullName"]))
      .skip(skip)
      .limit(limit)
      .select("username firstName lastName fullName profilePicture isVerifiedStudent university")
      .lean();

    const total = await User.countDocuments(buildRegexQuery(query, ["username", "firstName", "lastName", "fullName"]));
    return { results: users, total };
  }
};

// Search posts
export const searchPosts = async (query, options = {}) => {
  const { limit = DEFAULT_LIMIT, page = 1, category, universityId, sortBy = "relevance" } = options;
  const skip = (page - 1) * limit;
  const method = await checkAtlasSearch();

  const matchFilters = { status: "active" };
  if (category) matchFilters.category = category;
  if (universityId) matchFilters.university = new mongoose.Types.ObjectId(universityId);

  if (method === "atlas") {
    try {
      const pipeline = [
        buildAtlasSearch(query, "posts_search", ["title", "content", "tags"]),
        { $match: matchFilters },
        { $addFields: { score: { $meta: "searchScore" } } },
        {
          $sort:
            sortBy === "relevance"
              ? { score: -1 }
              : sortBy === "newest"
              ? { createdAt: -1 }
              : { likesCount: -1 },
        },
        {
          $facet: {
            results: [
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  pipeline: [
                    { $project: { username: 1, firstName: 1, lastName: 1, profilePicture: 1, isVerifiedStudent: 1 } },
                  ],
                  as: "user",
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "universities",
                  localField: "university",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, images: 1 } }],
                  as: "university",
                },
              },
              { $unwind: { path: "$university", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  title: 1,
                  content: 1,
                  category: 1,
                  tags: 1,
                  likesCount: 1,
                  replyCount: 1,
                  viewCount: 1,
                  isQuestion: 1,
                  isAnswered: 1,
                  createdAt: 1,
                  user: 1,
                  university: 1,
                  score: 1,
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await Post.aggregate(pipeline);
      const total = result.total[0]?.count || 0;

      return { results: result.results, total };
    } catch (error) {
      console.error("Atlas Search error, falling back:", error.message);
    }
  }

  // Fallback to basic text search
  const filters = { status: "active" };
  if (category) filters.category = category;
  if (universityId) filters.university = universityId;

  try {
    let posts = await Post.find({ ...buildTextSearchQuery(query), ...filters }, { score: { $meta: "textScore" } })
      .sort(
        sortBy === "relevance"
          ? { score: { $meta: "textScore" } }
          : sortBy === "newest"
          ? { createdAt: -1 }
          : { likesCount: -1 }
      )
      .skip(skip)
      .limit(limit)
      .populate("user", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images")
      .select("title content category tags likesCount replyCount viewCount isQuestion isAnswered createdAt")
      .lean();

    if (posts.length === 0) {
      posts = await Post.find({ ...buildRegexQuery(query, ["title", "content", "tags"]), ...filters })
        .sort(sortBy === "newest" ? { createdAt: -1 } : { likesCount: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "username firstName lastName profilePicture isVerifiedStudent")
        .populate("university", "name images")
        .select("title content category tags likesCount replyCount viewCount isQuestion isAnswered createdAt")
        .lean();
    }

    const total = await Post.countDocuments({ ...buildRegexQuery(query, ["title", "content", "tags"]), ...filters });
    return { results: posts, total };
  } catch (error) {
    const posts = await Post.find({ ...buildRegexQuery(query, ["title", "content", "tags"]), ...filters })
      .sort(sortBy === "newest" ? { createdAt: -1 } : { likesCount: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images")
      .select("title content category tags likesCount replyCount viewCount isQuestion isAnswered createdAt")
      .lean();

    const total = await Post.countDocuments({ ...buildRegexQuery(query, ["title", "content", "tags"]), ...filters });
    return { results: posts, total };
  }
};

// Search notes
export const searchNotes = async (query, options = {}) => {
  const { limit = DEFAULT_LIMIT, page = 1, universityId, subject, noteType, sortBy = "relevance" } = options;
  const skip = (page - 1) * limit;
  const method = await checkAtlasSearch();

  const matchFilters = { status: "active", isPublic: true };
  if (universityId) matchFilters.university = new mongoose.Types.ObjectId(universityId);
  if (subject) matchFilters.subject = new RegExp(subject, "i");
  if (noteType) matchFilters.noteType = noteType;

  if (method === "atlas") {
    try {
      const pipeline = [
        buildAtlasSearch(query, "notes_search", ["title", "description", "subject", "course", "tags"]),
        { $match: matchFilters },
        { $addFields: { score: { $meta: "searchScore" } } },
        {
          $sort:
            sortBy === "relevance"
              ? { score: -1 }
              : sortBy === "newest"
              ? { createdAt: -1 }
              : { downloadCount: -1 },
        },
        {
          $facet: {
            results: [
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "author",
                  foreignField: "_id",
                  pipeline: [
                    { $project: { username: 1, firstName: 1, lastName: 1, profilePicture: 1, isVerifiedStudent: 1 } },
                  ],
                  as: "author",
                },
              },
              { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "universities",
                  localField: "university",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, images: 1 } }],
                  as: "university",
                },
              },
              { $unwind: { path: "$university", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  title: 1,
                  description: 1,
                  subject: 1,
                  course: 1,
                  noteType: 1,
                  thumbnail: 1,
                  likesCount: 1,
                  downloadCount: 1,
                  createdAt: 1,
                  author: 1,
                  university: 1,
                  score: 1,
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await Note.aggregate(pipeline);
      const total = result.total[0]?.count || 0;

      return { results: result.results, total };
    } catch (error) {
      console.error("Atlas Search error, falling back:", error.message);
    }
  }

  // Fallback to basic text search
  const filters = { status: "active", isPublic: true };
  if (universityId) filters.university = universityId;
  if (subject) filters.subject = new RegExp(subject, "i");
  if (noteType) filters.noteType = noteType;

  try {
    let notes = await Note.find({ ...buildTextSearchQuery(query), ...filters }, { score: { $meta: "textScore" } })
      .sort(
        sortBy === "relevance"
          ? { score: { $meta: "textScore" } }
          : sortBy === "newest"
          ? { createdAt: -1 }
          : { downloadCount: -1 }
      )
      .skip(skip)
      .limit(limit)
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images")
      .select("title description subject course noteType thumbnail likesCount downloadCount createdAt")
      .lean();

    if (notes.length === 0) {
      notes = await Note.find({
        ...buildRegexQuery(query, ["title", "description", "subject", "course", "tags"]),
        ...filters,
      })
        .sort(sortBy === "newest" ? { createdAt: -1 } : { downloadCount: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
        .populate("university", "name images")
        .select("title description subject course noteType thumbnail likesCount downloadCount createdAt")
        .lean();
    }

    const total = await Note.countDocuments({
      ...buildRegexQuery(query, ["title", "description", "subject", "course", "tags"]),
      ...filters,
    });

    return { results: notes, total };
  } catch (error) {
    const notes = await Note.find({
      ...buildRegexQuery(query, ["title", "description", "subject", "course", "tags"]),
      ...filters,
    })
      .sort(sortBy === "newest" ? { createdAt: -1 } : { downloadCount: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images")
      .select("title description subject course noteType thumbnail likesCount downloadCount createdAt")
      .lean();

    const total = await Note.countDocuments({
      ...buildRegexQuery(query, ["title", "description", "subject", "course", "tags"]),
      ...filters,
    });

    return { results: notes, total };
  }
};

// Search reviews
export const searchReviews = async (query, options = {}) => {
  const { limit = DEFAULT_LIMIT, page = 1, universityId, minRating } = options;
  const skip = (page - 1) * limit;
  const method = await checkAtlasSearch();

  const matchFilters = { status: "active" };
  if (universityId) matchFilters.university = new mongoose.Types.ObjectId(universityId);
  if (minRating) matchFilters.overallRating = { $gte: minRating };

  if (method === "atlas") {
    try {
      const pipeline = [
        buildAtlasSearch(query, "reviews_search", ["title", "content", "pros", "cons"]),
        { $match: matchFilters },
        { $addFields: { score: { $meta: "searchScore" } } },
        { $sort: { score: -1 } },
        {
          $facet: {
            results: [
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "author",
                  foreignField: "_id",
                  pipeline: [
                    { $project: { username: 1, firstName: 1, lastName: 1, profilePicture: 1, isVerifiedStudent: 1 } },
                  ],
                  as: "author",
                },
              },
              { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "universities",
                  localField: "university",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, images: 1, city: 1, state: 1 } }],
                  as: "university",
                },
              },
              { $unwind: { path: "$university", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  title: 1,
                  content: 1,
                  overallRating: 1,
                  helpfulCount: 1,
                  isAnonymous: 1,
                  createdAt: 1,
                  author: 1,
                  university: 1,
                  score: 1,
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await Review.aggregate(pipeline);
      const total = result.total[0]?.count || 0;

      return { results: result.results, total };
    } catch (error) {
      console.error("Atlas Search error, falling back:", error.message);
    }
  }

  // Fallback to basic text search
  const filters = { status: "active" };
  if (universityId) filters.university = universityId;
  if (minRating) filters.overallRating = { $gte: minRating };

  try {
    let reviews = await Review.find({ ...buildTextSearchQuery(query), ...filters }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images city state")
      .select("title content overallRating helpfulCount isAnonymous createdAt")
      .lean();

    if (reviews.length === 0) {
      reviews = await Review.find({ ...buildRegexQuery(query, ["title", "content", "pros", "cons"]), ...filters })
        .skip(skip)
        .limit(limit)
        .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
        .populate("university", "name images city state")
        .select("title content overallRating helpfulCount isAnonymous createdAt")
        .lean();
    }

    const total = await Review.countDocuments({
      ...buildRegexQuery(query, ["title", "content", "pros", "cons"]),
      ...filters,
    });

    return { results: reviews, total };
  } catch (error) {
    const reviews = await Review.find({ ...buildRegexQuery(query, ["title", "content", "pros", "cons"]), ...filters })
      .skip(skip)
      .limit(limit)
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name images city state")
      .select("title content overallRating helpfulCount isAnonymous createdAt")
      .lean();

    const total = await Review.countDocuments({
      ...buildRegexQuery(query, ["title", "content", "pros", "cons"]),
      ...filters,
    });

    return { results: reviews, total };
  }
};

// Global search across all collections
export const globalSearch = async (query, options = {}) => {
  const { limit = 5, userId } = options;

  const [universities, users, posts, notes] = await Promise.all([
    searchUniversities(query, { limit }),
    searchUsers(query, { limit }),
    searchPosts(query, { limit }),
    searchNotes(query, { limit }),
  ]);

  // Save to search history if user is logged in
  if (userId) {
    await saveSearchHistory(userId, query);
  }

  // Update popular searches
  await updatePopularSearches(query);

  return {
    query,
    results: {
      universities: universities.results,
      users: users.results,
      posts: posts.results,
      notes: notes.results,
    },
    counts: {
      universities: universities.total,
      users: users.total,
      posts: posts.total,
      notes: notes.total,
      total: universities.total + users.total + posts.total + notes.total,
    },
  };
};

// Autocomplete suggestions with Atlas Search support
export const getSuggestions = async (query, options = {}) => {
  const { limit = 8 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const method = await checkAtlasSearch();

  if (method === "atlas") {
    try {
      const [universities, subjects] = await Promise.all([
        University.aggregate([
          buildAtlasAutocomplete(query, "universities_autocomplete", "name"),
          { $limit: 3 },
          { $project: { name: 1 } },
        ]),
        Note.aggregate([
          buildAtlasAutocomplete(query, "notes_autocomplete", "subject"),
          { $match: { status: "active" } },
          { $group: { _id: "$subject" } },
          { $limit: 3 },
        ]),
      ]);

      const suggestions = [
        ...universities.map((u) => ({ type: "university", text: u.name })),
        ...subjects.map((s) => ({ type: "subject", text: s._id })),
      ];

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error("Atlas autocomplete error, falling back:", error.message);
    }
  }

  // Fallback to regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedQuery}`, "i");

  const [universities, subjects, tags] = await Promise.all([
    University.find({ name: regex }).limit(3).select("name").lean(),
    Note.distinct("subject", { subject: regex, status: "active" }).then((s) => s.slice(0, 3)),
    Post.distinct("tags", { tags: regex, status: "active" }).then((t) => t.slice(0, 3)),
  ]);

  const suggestions = [
    ...universities.map((u) => ({ type: "university", text: u.name })),
    ...subjects.map((s) => ({ type: "subject", text: s })),
    ...tags.map((t) => ({ type: "tag", text: t })),
  ];

  suggestions.sort((a, b) => {
    const aStartsWith = a.text.toLowerCase().startsWith(query.toLowerCase());
    const bStartsWith = b.text.toLowerCase().startsWith(query.toLowerCase());
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.text.localeCompare(b.text);
  });

  return suggestions.slice(0, limit);
};

// Save search to history
export const saveSearchHistory = async (userId, query) => {
  if (!query || query.trim().length < 2) return;

  const normalizedQuery = query.trim().toLowerCase();

  try {
    await SearchHistory.findOneAndUpdate(
      { user: userId, query: normalizedQuery },
      { $set: { updatedAt: new Date() }, $inc: { count: 1 } },
      { upsert: true }
    );

    // Keep only last 50 searches per user
    const userSearches = await SearchHistory.find({ user: userId }).sort({ updatedAt: -1 }).skip(50).select("_id");

    if (userSearches.length > 0) {
      await SearchHistory.deleteMany({ _id: { $in: userSearches.map((s) => s._id) } });
    }
  } catch (error) {
    console.error("Error saving search history:", error);
  }
};

// Get user's recent searches
export const getRecentSearches = async (userId, limit = 10) => {
  const searches = await SearchHistory.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("query updatedAt")
    .lean();

  return searches.map((s) => s.query);
};

// Clear user's search history
export const clearSearchHistory = async (userId) => {
  await SearchHistory.deleteMany({ user: userId });
};

// Update popular searches
const popularSearchesCache = new Map();
let popularSearchesList = [];

export const updatePopularSearches = async (query) => {
  const normalizedQuery = query.trim().toLowerCase();
  const current = popularSearchesCache.get(normalizedQuery) || 0;
  popularSearchesCache.set(normalizedQuery, current + 1);

  if (popularSearchesCache.size % 100 === 0 || popularSearchesList.length === 0) {
    popularSearchesList = Array.from(popularSearchesCache.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([q]) => q);
  }
};

// Get popular searches
export const getPopularSearches = async (limit = 10) => {
  if (popularSearchesList.length > 0) {
    return popularSearchesList.slice(0, limit);
  }

  const popular = await SearchHistory.aggregate([
    { $group: { _id: "$query", totalCount: { $sum: "$count" } } },
    { $sort: { totalCount: -1 } },
    { $limit: limit },
  ]);

  return popular.map((p) => p._id);
};

// Get current search method
export const getSearchMethod = () => searchMethod;

export default {
  searchUniversities,
  searchUsers,
  searchPosts,
  searchNotes,
  searchReviews,
  globalSearch,
  getSuggestions,
  saveSearchHistory,
  getRecentSearches,
  clearSearchHistory,
  getPopularSearches,
  getSearchMethod,
};
