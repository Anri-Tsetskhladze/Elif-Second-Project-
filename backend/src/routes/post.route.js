import express from "express";
import {
  getFeed,
  getPost,
  getByCategory,
  getReplies,
  createPost,
  createReply,
  toggleLike,
  toggleBookmark,
  acceptAnswer,
  pinPost,
  lockThread,
  deletePost,
  editPost,
  getUserPosts,
  getBookmarks,
  searchPosts,
  getTrending,
  getUnanswered,
  getPopularTags,
  getByTag,
  getCategories,
  votePoll,
} from "../controllers/post.controller.js";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { searchLimiter, postLimiter, likeLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.get("/categories", getCategories);
router.get("/", optionalAuth, getFeed);
router.get("/trending", getTrending);
router.get("/unanswered", getUnanswered);
router.get("/tags", getPopularTags);
router.get("/tags/:tag", optionalAuth, getByTag);
router.get("/search", searchLimiter, optionalAuth, searchPosts);
router.get("/category/:category", optionalAuth, getByCategory);
router.get("/user/:username", getUserPosts);
router.get("/:postId", optionalAuth, getPost);
router.get("/:postId/replies", optionalAuth, getReplies);

// Protected routes
router.post("/", protectRoute, postLimiter, upload.array("images", 4), createPost);
router.post("/:postId/reply", protectRoute, postLimiter, upload.array("images", 1), createReply);
router.post("/:postId/like", protectRoute, likeLimiter, toggleLike);
router.post("/:postId/bookmark", protectRoute, toggleBookmark);
router.post("/:postId/accept-answer", protectRoute, acceptAnswer);
router.post("/:postId/pin", protectRoute, pinPost);
router.post("/:postId/lock", protectRoute, lockThread);
router.post("/:postId/vote", protectRoute, votePoll);
router.put("/:postId", protectRoute, editPost);
router.delete("/:postId", protectRoute, deletePost);
router.get("/me/bookmarks", protectRoute, getBookmarks);

export default router;
