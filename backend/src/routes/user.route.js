import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { profileUpdateLimiter, likeLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// public route
router.get("/profile/:username", getUserProfile);

// protected routes
router.post("/sync", protectRoute, syncUser);
router.get("/me", protectRoute, getCurrentUser);
router.put("/profile", protectRoute, profileUpdateLimiter, updateProfile);
router.post("/follow/:targetUserId", protectRoute, likeLimiter, followUser);

export default router;
