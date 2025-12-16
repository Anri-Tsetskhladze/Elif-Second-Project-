import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import { getCache, setCache, deleteCache, CACHE_TTL, CACHE_KEYS } from "../utils/cache.js";

const CATEGORIES = [
  { id: "general", name: "General", icon: "chatbubbles", color: "#6366F1" },
  { id: "academics", name: "Academics", icon: "school", color: "#10B981" },
  { id: "campus-life", name: "Campus Life", icon: "people", color: "#F59E0B" },
  { id: "housing", name: "Housing", icon: "home", color: "#8B5CF6" },
  { id: "career", name: "Career", icon: "briefcase", color: "#3B82F6" },
  { id: "social", name: "Social", icon: "heart", color: "#EC4899" },
  { id: "help", name: "Help", icon: "help-circle", color: "#EF4444" },
  { id: "announcements", name: "Announcements", icon: "megaphone", color: "#14B8A6" },
];

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  res.json({ categories: CATEGORIES });
});

// Get feed posts with filtering
export const getFeed = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const {
    category,
    university,
    sortBy = "newest",
    page = 1,
    limit = 20,
    following,
  } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { status: "active", parentPost: null };

  // Category filter
  if (category && category !== "all") {
    query.category = category;
  }

  // University filter
  if (university) {
    query.university = university;
  } else if (user?.university) {
    // Default to user's university
    query.$or = [
      { university: user.university },
      { visibility: "public" },
    ];
  }

  // Following filter
  if (following === "true" && user) {
    query.user = { $in: user.following };
  }

  // Build sort
  let sort = { isPinned: -1 };
  switch (sortBy) {
    case "popular":
      sort.likesCount = -1;
      sort.replyCount = -1;
      sort.createdAt = -1;
      break;
    case "unanswered":
      query.isQuestion = true;
      query.isAnswered = false;
      sort.createdAt = -1;
      break;
    default:
      sort.createdAt = -1;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .populate("university", "name images.logo")
      .lean(),
    Post.countDocuments(query),
  ]);

  // Add user-specific data
  const enrichedPosts = posts.map(post => ({
    ...post,
    isLiked: user ? post.likes?.some(id => id.toString() === user._id.toString()) : false,
    isBookmarked: user ? post.bookmarks?.some(id => id.toString() === user._id.toString()) : false,
    likesCount: post.likes?.length || 0,
    bookmarksCount: post.bookmarks?.length || 0,
  }));

  res.json({
    posts: enrichedPosts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get posts by category
export const getByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { userId } = getAuth(req);
  const { university, page = 1, limit = 20, sortBy = "newest" } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;

  if (!CATEGORIES.find(c => c.id === category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const query = { status: "active", parentPost: null, category };

  if (university) {
    query.university = university;
  } else if (user?.university) {
    query.$or = [
      { university: user.university },
      { visibility: "public" },
    ];
  }

  let sort = { isPinned: -1, createdAt: -1 };
  if (sortBy === "popular") {
    sort = { isPinned: -1, likesCount: -1, replyCount: -1, createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .populate("university", "name images.logo")
      .lean(),
    Post.countDocuments(query),
  ]);

  res.json({
    posts: posts.map(post => ({
      ...post,
      isLiked: user ? post.likes?.some(id => id.toString() === user._id.toString()) : false,
      likesCount: post.likes?.length || 0,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get single post with thread
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);

  const user = userId ? await User.findOne({ clerkId: userId }) : null;

  const post = await Post.findById(postId)
    .populate("user", "username fullName profileImg isVerifiedStudent")
    .populate("university", "name images.logo")
    .populate({
      path: "acceptedAnswer",
      populate: { path: "user", select: "username fullName profileImg isVerifiedStudent" },
    });

  if (!post || post.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  // Increment view count
  await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });

  res.json({
    post: {
      ...post.toObject(),
      isLiked: user ? post.isLikedBy(user._id) : false,
      isBookmarked: user ? post.isBookmarkedBy(user._id) : false,
      likesCount: post.likesCount,
      bookmarksCount: post.bookmarksCount,
    },
  });
});

// Get replies for a post
export const getReplies = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);
  const { page = 1, limit = 20, sortBy = "oldest" } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;

  let sort = { createdAt: 1 };
  if (sortBy === "newest") sort = { createdAt: -1 };
  if (sortBy === "popular") sort = { likesCount: -1, createdAt: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [replies, total] = await Promise.all([
    Post.find({ parentPost: postId, status: "active" })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .lean(),
    Post.countDocuments({ parentPost: postId, status: "active" }),
  ]);

  // Get nested replies for each reply (one level deep)
  const repliesWithNested = await Promise.all(
    replies.map(async (reply) => {
      const nestedReplies = await Post.find({ parentPost: reply._id, status: "active" })
        .sort({ createdAt: 1 })
        .limit(3)
        .populate("user", "username fullName profileImg isVerifiedStudent")
        .lean();

      const nestedCount = await Post.countDocuments({ parentPost: reply._id, status: "active" });

      return {
        ...reply,
        isLiked: user ? reply.likes?.some(id => id.toString() === user._id.toString()) : false,
        likesCount: reply.likes?.length || 0,
        nestedReplies: nestedReplies.map(nr => ({
          ...nr,
          isLiked: user ? nr.likes?.some(id => id.toString() === user._id.toString()) : false,
          likesCount: nr.likes?.length || 0,
        })),
        hasMoreNested: nestedCount > 3,
        nestedCount,
      };
    })
  );

  res.json({
    replies: repliesWithNested,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Create new post
export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const {
    title,
    content,
    category = "general",
    tags,
    university,
    isQuestion = false,
    visibility = "public",
    isAnonymous = false,
  } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Title is required" });
  }

  // Handle image uploads
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: "forum_posts",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto" },
          ],
        });
        images.push(result.secure_url);
      } catch (err) {
        console.error("Image upload error:", err);
      }
    }
  }

  const post = await Post.create({
    user: user._id,
    title: title.trim(),
    content: content?.trim() || "",
    category,
    tags: tags ? tags.split(",").map(t => t.trim().toLowerCase()).slice(0, 5) : [],
    university: university || user.university,
    isQuestion,
    visibility,
    isAnonymous,
    images,
  });

  await post.populate("user", "username fullName profileImg isVerifiedStudent");
  await post.populate("university", "name images.logo");

  // Invalidate trending and tags cache
  await deleteCache(`${CACHE_KEYS.POPULAR_POSTS}:trending:*`);
  await deleteCache(`${CACHE_KEYS.POPULAR_POSTS}:tags:*`);

  res.status(201).json({ post });
});

// Create reply
export const createReply = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const parentPost = await Post.findById(postId);
  if (!parentPost || parentPost.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  if (parentPost.isLocked) {
    return res.status(403).json({ error: "This thread is locked" });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Reply content is required" });
  }

  // Handle image
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files.slice(0, 1)) {
      try {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: "forum_replies",
          transformation: [{ width: 800, height: 800, crop: "limit" }],
        });
        images.push(result.secure_url);
      } catch (err) {
        console.error("Image upload error:", err);
      }
    }
  }

  const reply = await Post.create({
    user: user._id,
    parentPost: postId,
    content: content.trim(),
    images,
  });

  await reply.populate("user", "username fullName profileImg isVerifiedStudent");

  // Notify post author
  const rootPost = parentPost.parentPost
    ? await Post.findById(parentPost.parentPost)
    : parentPost;

  if (rootPost.user.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: rootPost.user,
      type: "reply",
      post: rootPost._id,
    });
  }

  res.status(201).json({ reply });
});

// Toggle like
export const toggleLike = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post || post.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  await post.toggleLike(user._id);

  const isLiked = post.isLikedBy(user._id);

  // Notify on like
  if (isLiked && post.user.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: post.user,
      type: "like",
      post: post._id,
    });
  }

  res.json({ isLiked, likesCount: post.likesCount });
});

// Toggle bookmark
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post || post.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  await post.toggleBookmark(user._id);

  res.json({
    isBookmarked: post.isBookmarkedBy(user._id),
    bookmarksCount: post.bookmarksCount,
  });
});

// Accept answer
export const acceptAnswer = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { replyId } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post || post.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "Only the author can accept answers" });
  }

  if (!post.isQuestion) {
    return res.status(400).json({ error: "This post is not a question" });
  }

  await post.acceptAnswer(replyId);

  // Notify answer author
  const reply = await Post.findById(replyId);
  if (reply && reply.user.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: reply.user,
      type: "answer_accepted",
      post: post._id,
    });
  }

  res.json({ message: "Answer accepted", acceptedAnswer: replyId });
});

// Pin post (moderators only)
export const pinPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.role !== "admin" && user.role !== "moderator") {
    return res.status(403).json({ error: "Only moderators can pin posts" });
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  post.isPinned = !post.isPinned;
  post.pinnedAt = post.isPinned ? new Date() : null;
  post.pinnedBy = post.isPinned ? user._id : null;
  await post.save();

  res.json({ isPinned: post.isPinned });
});

// Lock thread (moderators only)
export const lockThread = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.role !== "admin" && user.role !== "moderator") {
    return res.status(403).json({ error: "Only moderators can lock threads" });
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  post.isLocked = !post.isLocked;
  post.lockedAt = post.isLocked ? new Date() : null;
  post.lockedBy = post.isLocked ? user._id : null;
  await post.save();

  res.json({ isLocked: post.isLocked });
});

// Delete post
export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const isOwner = post.user.toString() === user._id.toString();
  const isMod = user.role === "admin" || user.role === "moderator";

  if (!isOwner && !isMod) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  // Soft delete
  post.status = "deleted";
  await post.save();

  // Also soft delete all replies
  await Post.updateMany({ parentPost: postId }, { status: "deleted" });

  res.json({ message: "Post deleted" });
});

// Edit post
export const editPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post || post.status !== "active") {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only edit your own posts" });
  }

  if (title) post.title = title.trim();
  if (content !== undefined) post.content = content.trim();
  if (tags) post.tags = tags.split(",").map(t => t.trim().toLowerCase()).slice(0, 5);

  await post.save();
  await post.populate("user", "username fullName profileImg isVerifiedStudent");

  res.json({ post });
});

// Get user's posts
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    Post.find({ user: user._id, status: "active", parentPost: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .populate("university", "name images.logo")
      .lean(),
    Post.countDocuments({ user: user._id, status: "active", parentPost: null }),
  ]);

  res.json({
    posts: posts.map(p => ({
      ...p,
      likesCount: p.likes?.length || 0,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get user's bookmarks
export const getBookmarks = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    Post.find({ bookmarks: user._id, status: "active" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .populate("university", "name images.logo")
      .lean(),
    Post.countDocuments({ bookmarks: user._id, status: "active" }),
  ]);

  res.json({
    posts: posts.map(p => ({
      ...p,
      likesCount: p.likes?.length || 0,
      isBookmarked: true,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Search posts
export const searchPosts = asyncHandler(async (req, res) => {
  const { q, category, university, page = 1, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const query = {
    status: "active",
    parentPost: null,
    $text: { $search: q },
  };

  if (category) query.category = category;
  if (university) query.university = university;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    Post.find(query, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username fullName profileImg isVerifiedStudent")
      .populate("university", "name images.logo")
      .lean(),
    Post.countDocuments(query),
  ]);

  res.json({
    posts: posts.map(p => ({
      ...p,
      likesCount: p.likes?.length || 0,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get trending posts
export const getTrending = asyncHandler(async (req, res) => {
  const { university, limit = 10 } = req.query;
  const cacheKey = `${CACHE_KEYS.POPULAR_POSTS}:trending:${university || "all"}:${limit}`;

  // Check cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ posts: cached, fromCache: true });
  }

  const posts = await Post.getTrending(university, parseInt(limit));

  // Populate user info
  const populatedPosts = await Post.populate(posts, {
    path: "user",
    select: "username fullName profileImg isVerifiedStudent",
  });

  // Cache for 5 minutes
  await setCache(cacheKey, populatedPosts, CACHE_TTL.POPULAR_POSTS);

  res.json({ posts: populatedPosts });
});

// Get unanswered questions
export const getUnanswered = asyncHandler(async (req, res) => {
  const { university, limit = 10 } = req.query;

  const posts = await Post.getUnansweredQuestions(university, parseInt(limit));

  res.json({ posts });
});

// Get popular tags
export const getPopularTags = asyncHandler(async (req, res) => {
  const { university, limit = 20 } = req.query;
  const cacheKey = `${CACHE_KEYS.POPULAR_POSTS}:tags:${university || "all"}:${limit}`;

  // Check cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ tags: cached, fromCache: true });
  }

  const tags = await Post.getPopularTags(university, parseInt(limit));

  // Cache for 10 minutes
  await setCache(cacheKey, tags, 600);

  res.json({ tags });
});

// Get posts by tag
export const getByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const { university, page = 1, limit = 20 } = req.query;

  const posts = await Post.getByTag(tag, {
    universityId: university,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  const total = await Post.countDocuments({
    status: "active",
    parentPost: null,
    tags: tag.toLowerCase(),
    ...(university && { university }),
  });

  res.json({
    posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Vote on poll
export const votePoll = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { optionIndex } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const post = await Post.findById(postId);
  if (!post || !post.poll?.options) {
    return res.status(404).json({ error: "Poll not found" });
  }

  if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
    return res.status(400).json({ error: "Invalid option" });
  }

  await post.vote(user._id, optionIndex);

  res.json({ poll: post.poll });
});
