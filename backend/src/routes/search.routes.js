import express from "express";
import {
  globalSearch,
  searchUniversities,
  searchUsers,
  searchPosts,
  searchNotes,
  searchReviews,
  getSuggestions,
  getRecentSearches,
  clearSearchHistory,
  getPopularSearches,
} from "../controllers/search.controller.js";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";
import { searchLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes (with optional auth for history tracking)
router.get("/", searchLimiter, optionalAuth, globalSearch);
router.get("/universities", searchLimiter, optionalAuth, searchUniversities);
router.get("/users", searchLimiter, optionalAuth, searchUsers);
router.get("/posts", searchLimiter, optionalAuth, searchPosts);
router.get("/notes", searchLimiter, optionalAuth, searchNotes);
router.get("/reviews", searchLimiter, optionalAuth, searchReviews);
router.get("/suggestions", searchLimiter, getSuggestions);
router.get("/popular", getPopularSearches);

// Protected routes (require authentication)
router.get("/recent", protectRoute, getRecentSearches);
router.delete("/recent", protectRoute, clearSearchHistory);

export default router;
